// deriveExpectedTuples — the single source of truth for the org graph → FGA
// tuple set. Reads current state from Postgres and returns the complete set of
// tuples that should exist in FGA for the given org.
//
// This function is used by:
//   - syncOrgTuples (writer) — to compute the expected side of the diff
//   - reconcileAllOrgs (reconciler) — same
//   - the backfill script — same
//
// Design principle: NEVER apply event deltas. The expected
// set is always derived fresh from the DB so replay/reorder always converges.

import { and, eq, isNotNull } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { FGA_TYPES, ACTIVE_WINDOW_CONDITION, objectRef, userRef, type Tuple } from '@avkash/shared';

// ── Helpers ───────────────────────────────────────────────────────────────────

function tuple(user: string, relation: string, object: string, condition?: Tuple['condition']): Tuple {
  const t: Tuple = { user, relation, object };
  if (condition) t.condition = condition;
  return t;
}

/**
 * Convert a date string (YYYY-MM-DD) to an ISO 8601 timestamp string at the
 * boundary the active_window condition uses:
 *   starts → midnight UTC of that day
 *   ends   → 23:59:59 UTC of that day (end-of-day inclusive)
 */
function toWindowStart(date: string): string {
  return `${date}T00:00:00Z`;
}
function toWindowEnd(date: string): string {
  return `${date}T23:59:59Z`;
}

// ── Per-entity tuple derivations ──────────────────────────────────────────────

/** org:<orgId> — member, hr_admin, owner relations from User rows. */
async function deriveOrgTuples(orgId: string): Promise<Tuple[]> {
  const users = await db
    .select({ id: schema.user.id, role: schema.user.role })
    .from(schema.user)
    .where(eq(schema.user.orgId, orgId));

  const tuples: Tuple[] = [];
  const orgObj = objectRef(FGA_TYPES.org, orgId);

  for (const u of users) {
    const uRef = userRef(u.id);
    // Every org member gets the `member` relation (used for basic visibility).
    tuples.push(tuple(uRef, 'member', orgObj));

    // Role-based relations on the org object.
    if (u.role === 'ADMIN') {
      tuples.push(tuple(uRef, 'hr_admin', orgObj));
    } else if (u.role === 'OWNER') {
      tuples.push(tuple(uRef, 'owner', orgObj));
      tuples.push(tuple(uRef, 'hr_admin', orgObj)); // owner also gets hr_admin authority
    }
  }

  return tuples;
}

/** business_unit:<id> — org, head, hrbp relations from BusinessUnit rows. */
async function deriveBusinessUnitTuples(orgId: string): Promise<Tuple[]> {
  const units = await db
    .select()
    .from(schema.businessUnit)
    .where(and(eq(schema.businessUnit.orgId, orgId), eq(schema.businessUnit.isActive, true)));

  const tuples: Tuple[] = [];
  const orgObj = objectRef(FGA_TYPES.org, orgId);

  for (const bu of units) {
    const buObj = objectRef(FGA_TYPES.businessUnit, bu.id);
    // Each active BU chains back to the org.
    tuples.push(tuple(orgObj, 'org', buObj));
    // Head of the BU (currently stored as the user who created/manages it;
    // no dedicated headUserId column on BusinessUnit — use createdBy as a proxy
    // when available, but primarily this relation is set via departmentLocation.headUserId
    // at the department level). The BU head relation is populated by the domain
    // when explicitly set (see departments / departmentLocation.headUserId).
    // For now we do not auto-populate `head` from BusinessUnit since there is no
    // dedicated headUserId column on the BusinessUnit table.
  }

  return tuples;
}

/** department:<id> — business_unit, head relations from Department + DepartmentLocation rows. */
async function deriveDepartmentTuples(orgId: string): Promise<Tuple[]> {
  // Departments joined with their BU link (stored on Team.departmentId chain).
  // The Department table itself doesn't store businessUnitId directly — teams
  // link to departments, and businessUnit is linked via user.businessUnitId or
  // Team.departmentId chain. We look up the BU via the teams that belong to
  // each department.
  const depts = await db
    .select({ id: schema.department.id })
    .from(schema.department)
    .where(and(eq(schema.department.orgId, orgId), eq(schema.department.isActive, true)));

  const tuples: Tuple[] = [];

  for (const dept of depts) {
    const deptObj = objectRef(FGA_TYPES.department, dept.id);

    // Look up teams in this department to infer the business_unit link.
    // A department may span multiple BUs in theory, but in practice each team
    // has one departmentId. We chain: team → departmentId → businessUnit via
    // user.businessUnitId on users in the team (proxy approach).
    // More directly: find teams with this departmentId, then their users'
    // businessUnitId values to find the canonical BU for this department.
    const teamsInDept = await db
      .select({ teamId: schema.team.teamId })
      .from(schema.team)
      .where(and(eq(schema.team.orgId, orgId), eq(schema.team.departmentId, dept.id)));

    if (teamsInDept.length > 0) {
      const _teamIds = teamsInDept.map((t) => t.teamId); void _teamIds;
      // Find users in these teams who have a businessUnitId set.
      // We use the first distinct BU found to associate the department.
      const buUsers = await db
        .select({ businessUnitId: schema.user.businessUnitId })
        .from(schema.user)
        .where(
          and(
            eq(schema.user.orgId, orgId),
            isNotNull(schema.user.businessUnitId),
          )
        )
        .limit(1);

      // Prefer team-level BU lookup: find any user in one of these teams with a BU.
      // Since inArray is complex here, we query per-team.
      const buIds = new Set<string>();
      for (const t of teamsInDept) {
        const [buUser] = await db
          .select({ businessUnitId: schema.user.businessUnitId })
          .from(schema.user)
          .where(
            and(
              eq(schema.user.orgId, orgId),
              eq(schema.user.teamId, t.teamId),
              isNotNull(schema.user.businessUnitId),
            )
          )
          .limit(1);
        if (buUser?.businessUnitId) buIds.add(buUser.businessUnitId);
      }

      // Suppress unused warning
      void buUsers;

      for (const buId of buIds) {
        const buObj = objectRef(FGA_TYPES.businessUnit, buId);
        tuples.push(tuple(buObj, 'business_unit', deptObj));
      }
    }

    // Department heads: from DepartmentLocation.headUserId.
    const deptLocations = await db
      .select({ headUserId: schema.departmentLocation.headUserId })
      .from(schema.departmentLocation)
      .where(eq(schema.departmentLocation.departmentId, dept.id));

    const headIds = new Set<string>();
    for (const dl of deptLocations) {
      if (dl.headUserId) headIds.add(dl.headUserId);
    }
    for (const headId of headIds) {
      tuples.push(tuple(userRef(headId), 'head', deptObj));
    }
  }

  return tuples;
}

/** team:<id> — org, department, manager, member relations from Team + User rows. */
async function deriveTeamTuples(orgId: string): Promise<Tuple[]> {
  const teams = await db
    .select()
    .from(schema.team)
    .where(and(eq(schema.team.orgId, orgId), eq(schema.team.isActive, true)));

  const tuples: Tuple[] = [];
  const orgObj = objectRef(FGA_TYPES.org, orgId);

  for (const team of teams) {
    const teamObj = objectRef(FGA_TYPES.team, team.teamId);

    // Each team belongs to the org (for hr_admin propagation).
    tuples.push(tuple(orgObj, 'org', teamObj));

    // Department link.
    if (team.departmentId) {
      const deptObj = objectRef(FGA_TYPES.department, team.departmentId);
      tuples.push(tuple(deptObj, 'department', teamObj));
    }

    // Managers (one tuple per entry in the managers array).
    for (const managerId of team.managers ?? []) {
      tuples.push(tuple(userRef(managerId), 'manager', teamObj));
    }

    // Members: all users whose teamId is this team.
    const members = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(and(eq(schema.user.teamId, team.teamId), eq(schema.user.orgId, orgId)));

    for (const member of members) {
      tuples.push(tuple(userRef(member.id), 'member', teamObj));
    }
  }

  return tuples;
}

/** employee:<employeeProfileId> — team, subject relations from EmployeeProfile + User rows.
 *  Note: employee type uses employeeProfile.id, not user.id. */
async function deriveEmployeeTuples(orgId: string): Promise<Tuple[]> {
  const profiles = await db
    .select({
      id: schema.employeeProfile.id,
      userId: schema.employeeProfile.userId,
    })
    .from(schema.employeeProfile)
    .where(eq(schema.employeeProfile.orgId, orgId));

  const tuples: Tuple[] = [];

  for (const profile of profiles) {
    const empObj = objectRef(FGA_TYPES.employee, profile.id);

    // subject: the user who IS this employee.
    tuples.push(tuple(userRef(profile.userId), 'subject', empObj));

    // team: the team this employee belongs to (via user.teamId).
    const [usr] = await db
      .select({ teamId: schema.user.teamId })
      .from(schema.user)
      .where(eq(schema.user.id, profile.userId))
      .limit(1);

    if (usr?.teamId) {
      const teamObj = objectRef(FGA_TYPES.team, usr.teamId);
      tuples.push(tuple(teamObj, 'team', empObj));
    }
  }

  return tuples;
}

/**
 * Delegation tuples: team.delegate (conditioned with active_window).
 * One conditioned tuple per ApprovalDelegation row.
 * If delegation.teamId is null (all teams the manager manages), emit one
 * delegate tuple per team the fromManagerId manages.
 */
async function deriveDelegationTuples(orgId: string): Promise<Tuple[]> {
  const delegations = await db
    .select()
    .from(schema.approvalDelegation)
    .where(eq(schema.approvalDelegation.orgId, orgId));

  const tuples: Tuple[] = [];

  for (const d of delegations) {
    const condition: Tuple['condition'] = {
      name: ACTIVE_WINDOW_CONDITION,
      context: {
        starts: toWindowStart(d.startsOn),
        ends: toWindowEnd(d.endsOn),
      },
    };

    if (d.teamId) {
      // Scoped to one team.
      tuples.push(tuple(userRef(d.toUserId), 'delegate', objectRef(FGA_TYPES.team, d.teamId), condition));
    } else {
      // All teams the fromManagerId manages: find their teams.
      const managedTeams = await db
        .select({ teamId: schema.team.teamId })
        .from(schema.team)
        .where(and(eq(schema.team.orgId, orgId), eq(schema.team.isActive, true)));

      for (const t of managedTeams) {
        // Check if fromManagerId is in the managers array.
        const [teamRow] = await db
          .select({ managers: schema.team.managers })
          .from(schema.team)
          .where(eq(schema.team.teamId, t.teamId))
          .limit(1);
        if (teamRow?.managers?.includes(d.fromManagerId)) {
          tuples.push(
            tuple(userRef(d.toUserId), 'delegate', objectRef(FGA_TYPES.team, t.teamId), condition)
          );
        }
      }
    }
  }

  return tuples;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Derive the complete expected FGA tuple set for an org from current Postgres state.
 *
 * This is THE single source of truth for the org graph → FGA mapping.
 * Used by syncOrgTuples (writer), reconcileAllOrgs (reconciler), and the
 * backfill script — never called from route handlers.
 *
 * The function is PURE READ — it never writes to FGA or the outbox. It reads
 * from Postgres only, producing the exact tuples that should be present in FGA
 * per the core.fga model.
 */
export async function deriveExpectedTuples(orgId: string): Promise<Tuple[]> {
  const [orgTuples, buTuples, deptTuples, teamTuples, empTuples, delegationTuples] = await Promise.all([
    deriveOrgTuples(orgId),
    deriveBusinessUnitTuples(orgId),
    deriveDepartmentTuples(orgId),
    deriveTeamTuples(orgId),
    deriveEmployeeTuples(orgId),
    deriveDelegationTuples(orgId),
  ]);

  return [
    ...orgTuples,
    ...buTuples,
    ...deptTuples,
    ...teamTuples,
    ...empTuples,
    ...delegationTuples,
  ];
}

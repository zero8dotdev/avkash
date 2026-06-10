import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetch, apiFetchData } from '$lib/server/api';
import { fail } from '@sveltejs/kit';

// User row from /users/:id
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
  locationId: string | null;
  departmentId: string | null;
  businessUnitId: string | null;
  isFloating: boolean;
  joinedOn: string | null;
  version: number;
  language: string | null;
  workweekPatternId: string | null;
  phoneNumber: string | null;
  image: string | null;
}

// EmployeeProfile fields from /employees/:id (partial — field-group projected)
interface EmployeeProfileRow {
  // BASIC group (may be present)
  employeeCode?: string | null;
  designation?: string | null;
  // CONTACT group
  personalEmail?: string | null;
  personalPhone?: string | null;
  address?: string | null;
  emergencyContact?: { name?: string; relation?: string; phone?: string } | null;
  phoneNumber?: string | null;
  // EMPLOYMENT group
  employmentType?: string | null;
  employmentStatus?: string | null;
  levelId?: string | null;
  workLocation?: string | null;
  reportingManagerId?: string | null;
  probationEndsOn?: string | null;
  confirmedOn?: string | null;
  exitDate?: string | null;
  exitReason?: string | null;
  // COMPENSATION group (may be absent from response)
  salary?: string | null;
  bankAccount?: string | null;
  bankIfsc?: string | null;
  bankName?: string | null;
  // IDENTITY group (may be absent from response)
  pan?: string | null;
  aadhaar?: string | null;
  passport?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  // MEDICAL group (may be absent from response)
  disability?: string | null;
  conditions?: string | null;
  bloodGroup?: string | null;
}

interface Team { teamId: string; name: string; }
interface Location { id: string; name: string; }

export const load: PageServerLoad = async ({ params, locals, request }) => {
  const cookie = request.headers.get('cookie') ?? '';
  const user = locals.user!;
  const subjectId = params.id;
  const isSelfView = user.id === subjectId;
  const isHrAdminView = user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER';

  // /users/:id requires MANAGER+. For USER callers viewing their own profile,
  // use /me instead (which is always accessible). For MANAGER+ callers use /users/:id.
  // /me returns { data: { user, org, team } } — we extract .user from it.
  interface MeResponse { user: UserRow; }

  const [userResult, empResult, teamsResult, locationsResult] = await Promise.all([
    isSelfView && !isHrAdminView
      ? apiFetch<MeResponse>('/me', cookie).then((r) => ({
          ...r,
          data: r.data?.user,
        }))
      : apiFetch<UserRow>(`/users/${subjectId}`, cookie),
    apiFetch<EmployeeProfileRow>(`/employees/${subjectId}`, cookie),
    apiFetchData<Team[]>('/teams', cookie),
    apiFetchData<Location[]>('/locations', cookie),
  ]);

  // If user not found or access denied
  if (userResult.status === 404) {
    throw error(404, 'Employee not found');
  }
  if (userResult.status === 403) {
    throw error(403, 'You do not have access to this employee profile');
  }
  if (!userResult.data) {
    throw error(500, 'Failed to load employee profile');
  }

  const subject = userResult.data as UserRow;

  // ETag from employee profile response (for PATCH If-Match)
  // The empResult might be 403 (FGA check failed) or {} (empty EmployeeProfile)
  const employeeProfile: EmployeeProfileRow = empResult.data ?? {};
  const empStatus = empResult.status;

  // Whether the caller can edit any fields (self or ADMIN/HR)
  const isSelf = user.id === subjectId;
  const isHrAdmin = user.role === 'ADMIN' || user.role === 'OWNER';
  const canEdit = isSelf || isHrAdmin;

  // ETag for If-Match header on PATCH (the API returns it on employee profile GETs)
  const etag = empResult.etag;

  // Compute role-based group access so the UI can infer locked state correctly.
  // This mirrors EMPLOYEE_FIELD_GROUPS.defaults from the API.
  // We can't rely purely on field presence because the API's serialize(userDto, empProfile)
  // strips EmployeeProfile fields (they don't exist in the User schema) — so the
  // response is {} even when the caller has access. We use the role-based matrix instead,
  // combined with field-presence as the definitive signal when fields ARE present.
  //
  // Group access:
  //   none    → group is locked (show locked state, never render fields)
  //   read    → group is accessible but we show whatever fields appear in the response
  //   write   → same as read for display purposes
  type AccessLevel = 'read' | 'write' | 'none';
  const DEFAULT_MATRIX: Record<string, Record<string, AccessLevel>> = {
    USER: { basic: 'read', contact: 'none', employment: 'none', compensation: 'none', identity: 'none', medical: 'none' },
    MANAGER: { basic: 'read', contact: 'read', employment: 'read', compensation: 'none', identity: 'none', medical: 'none' },
    ADMIN: { basic: 'write', contact: 'write', employment: 'write', compensation: 'write', identity: 'write', medical: 'write' },
    OWNER: { basic: 'write', contact: 'write', employment: 'write', compensation: 'write', identity: 'write', medical: 'write' },
    subject: { basic: 'write', contact: 'write', employment: 'read', compensation: 'read', identity: 'none', medical: 'none' },
  };

  const effectiveRole = isSelf ? 'subject' : user.role;
  const roleGrant = DEFAULT_MATRIX[effectiveRole] ?? DEFAULT_MATRIX['USER'];
  // groupAccess: fieldGroup -> 'read' | 'write' | 'none'
  const groupAccess: Record<string, AccessLevel> = { ...roleGrant };

  return {
    user,
    subject,
    employeeProfile,
    empStatus,
    isSelf,
    isHrAdmin,
    canEdit,
    groupAccess,
    teams: teamsResult ?? [],
    locations: locationsResult ?? [],
    etag,
  };
};

export const actions: Actions = {
  updateProfile: async ({ request, params, locals }) => {
    const cookie = request.headers.get('cookie') ?? '';
    const user = locals.user!;
    const subjectId = params.id;
    const data = await request.formData();

    const isSelf = user.id === subjectId;
    const isHrAdmin = user.role === 'ADMIN' || user.role === 'OWNER';

    if (!isSelf && !isHrAdmin) {
      return fail(403, { updateError: { code: 'FORBIDDEN', message: 'You cannot edit this profile' } });
    }

    const etag = data.get('_etag') as string | null;

    // Build patch body from form fields
    const patch: Record<string, unknown> = {};
    const fields = [
      'designation', 'employeeCode', 'personalEmail', 'personalPhone', 'address',
      'workLocation', 'employmentType', 'employmentStatus', 'gender', 'maritalStatus',
      'nationality', 'dateOfBirth',
    ];
    for (const f of fields) {
      const val = data.get(f);
      if (val !== null) patch[f] = val === '' ? null : val;
    }

    if (Object.keys(patch).length === 0) {
      return fail(400, { updateError: { code: 'VALIDATION', message: 'No fields to update' } });
    }

    const endpoint = isSelf ? '/employees/me' : `/employees/${subjectId}`;
    const headers: Record<string, string> = {};
    if (etag) headers['If-Match'] = etag;

    const result = await apiFetch(endpoint, cookie, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patch),
    });

    if (result.error) {
      return fail(result.status || 400, { updateError: result.error });
    }
    return { updateSuccess: true };
  },
};

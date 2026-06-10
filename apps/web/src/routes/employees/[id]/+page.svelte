<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import ErrorBanner from '$components/ErrorBanner.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Type assertions for the data shapes
  interface UserRow {
    id: string; name: string; email: string; role: string;
    teamId: string | null; locationId: string | null; joinedOn: string | null;
    image: string | null; phoneNumber: string | null;
  }
  interface Team { teamId: string; name: string; }
  interface Location { id: string; name: string; }

  const subject = $derived(data.subject as UserRow);
  const emp = $derived(data.employeeProfile as Record<string, unknown>);
  const teams = $derived(data.teams as Team[]);
  const locations = $derived(data.locations as Location[]);

  // Field group definitions for rendering sections
  const GROUPS = [
    {
      key: 'basic',
      label: 'Basic Info',
      icon: '👤',
      fields: ['employeeCode', 'designation'],
      labels: { employeeCode: 'Employee Code', designation: 'Designation' },
    },
    {
      key: 'contact',
      label: 'Contact',
      icon: '📞',
      fields: ['personalEmail', 'personalPhone', 'phoneNumber', 'address', 'emergencyContact'],
      labels: {
        personalEmail: 'Personal Email',
        personalPhone: 'Personal Phone',
        phoneNumber: 'Work Phone',
        address: 'Address',
        emergencyContact: 'Emergency Contact',
      },
    },
    {
      key: 'employment',
      label: 'Employment',
      icon: '💼',
      fields: ['employmentType', 'employmentStatus', 'levelId', 'workLocation', 'reportingManagerId', 'probationEndsOn', 'confirmedOn', 'exitDate', 'exitReason'],
      labels: {
        employmentType: 'Employment Type',
        employmentStatus: 'Status',
        levelId: 'Level',
        workLocation: 'Work Location',
        reportingManagerId: 'Reporting Manager',
        probationEndsOn: 'Probation Ends',
        confirmedOn: 'Confirmed On',
        exitDate: 'Exit Date',
        exitReason: 'Exit Reason',
      },
    },
    {
      key: 'compensation',
      label: 'Compensation',
      icon: '💰',
      fields: ['salary', 'bankAccount', 'bankIfsc', 'bankName'],
      labels: {
        salary: 'Salary',
        bankAccount: 'Bank Account',
        bankIfsc: 'IFSC Code',
        bankName: 'Bank Name',
      },
    },
    {
      key: 'identity',
      label: 'Identity / DPDP',
      icon: '🪪',
      fields: ['pan', 'aadhaar', 'passport', 'dateOfBirth', 'gender', 'maritalStatus', 'nationality'],
      labels: {
        pan: 'PAN',
        aadhaar: 'Aadhaar',
        passport: 'Passport',
        dateOfBirth: 'Date of Birth',
        gender: 'Gender',
        maritalStatus: 'Marital Status',
        nationality: 'Nationality',
      },
    },
    {
      key: 'medical',
      label: 'Medical',
      icon: '🏥',
      fields: ['disability', 'conditions', 'bloodGroup'],
      labels: { disability: 'Disability', conditions: 'Conditions', bloodGroup: 'Blood Group' },
    },
  ] as const;

  // Determine if a group is "locked" (field-group hidden from caller).
  //
  // Primary signal: the role-based grant from the server (computed from EMPLOYEE_FIELD_GROUPS.defaults).
  // Secondary signal: field presence in the emp response — if ANY key from the group appears,
  //   the group is definitely visible regardless of role (e.g. a future tenant override).
  //
  // NOTE: The API's serialize(userDto, empProfile) strips EmployeeProfile-specific fields since
  // they don't exist in the User schema. So field presence is {} even when the caller has access.
  // We therefore rely on the role grant as the primary source of truth.
  const groupAccess = $derived(data.groupAccess as Record<string, string>);

  function isGroupLocked(groupKey: string, groupFields: readonly string[]): boolean {
    // If any field from this group is actually present in the response, it's definitely accessible
    const hasFieldsInResponse = groupFields.some((f) => f in emp);
    if (hasFieldsInResponse) return false;
    // Otherwise use the role-based grant
    const access = groupAccess[groupKey] ?? 'none';
    return access === 'none';
  }

  // Format a field value for display
  function formatVal(val: unknown): string {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  function getTeamName(teamId: string | null): string {
    if (!teamId) return '—';
    return teams.find((t) => t.teamId === teamId)?.name ?? teamId.slice(0, 8) + '…';
  }

  function getLocationName(locationId: string | null): string {
    if (!locationId) return '—';
    return locations.find((l) => l.id === locationId)?.name ?? locationId.slice(0, 8) + '…';
  }

  let editMode = $state(false);

  // Editable fields based on role
  const editableFields = $derived(
    data.isSelf
      ? ['personalEmail', 'personalPhone', 'address', 'gender', 'maritalStatus', 'nationality', 'dateOfBirth']
      : data.isHrAdmin
        ? ['designation', 'employeeCode', 'workLocation', 'employmentType', 'employmentStatus', 'gender', 'maritalStatus', 'nationality', 'dateOfBirth']
        : []
  );

  function isEditable(field: string): boolean {
    return editMode && editableFields.includes(field);
  }

  // Status badge
  const statusColors: Record<string, string> = {
    ACTIVE: 'var(--green)',
    PROBATION: 'var(--amber)',
    NOTICE_PERIOD: 'var(--amber)',
    RESIGNED: 'var(--red)',
    TERMINATED: 'var(--red)',
    ON_LONG_LEAVE: 'var(--blue)',
  };

  function statusColor(s: string | null): string {
    if (!s) return 'var(--muted)';
    return statusColors[s] ?? 'var(--muted)';
  }
</script>

<div class="profile-page">
  <!-- Back nav -->
  <div class="breadcrumb">
    <a href="/employees" class="breadcrumb-link">← Employee Directory</a>
    <span class="breadcrumb-sep">/</span>
    <span class="breadcrumb-current">{subject.name}</span>
  </div>

  <!-- Profile header -->
  <div class="profile-header">
    <div class="profile-avatar">
      {subject.name.slice(0, 2).toUpperCase()}
    </div>
    <div class="profile-meta">
      <h1 class="profile-name">{subject.name}</h1>
      <div class="profile-sub">
        <span class="profile-email">{subject.email}</span>
        <span class="profile-role role-{subject.role.toLowerCase()}">{subject.role}</span>
        {#if emp.employmentStatus}
          <span class="status-chip" style="color: {statusColor(emp.employmentStatus as string)}">
            {emp.employmentStatus}
          </span>
        {/if}
      </div>
      <div class="profile-org">
        {#if subject.teamId}
          <span class="org-chip">Team: {getTeamName(subject.teamId)}</span>
        {/if}
        {#if subject.locationId}
          <span class="org-chip">Location: {getLocationName(subject.locationId)}</span>
        {/if}
        {#if subject.joinedOn}
          <span class="org-chip">Joined: {subject.joinedOn}</span>
        {/if}
      </div>
    </div>
    {#if data.canEdit}
      <div class="profile-actions">
        {#if editMode}
          <button class="btn-secondary" onclick={() => { editMode = false; }}>Cancel</button>
        {:else}
          <button class="btn-primary" onclick={() => { editMode = true; }}>Edit Profile</button>
        {/if}
        {#if data.isSelf}
          <span class="self-badge">Your profile</span>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Success/error banners -->
  {#if form?.updateSuccess}
    <div class="success-banner">Profile updated successfully.</div>
  {/if}
  {#if form?.updateError}
    <ErrorBanner error={form.updateError} />
  {/if}

  <!-- Field group sections -->
  <form method="post" action="?/updateProfile" use:enhance>
    <input type="hidden" name="_etag" value={data.etag ?? ''} />

    <div class="sections">
      {#each GROUPS as group (group.key)}
        {@const locked = isGroupLocked(group.key, group.fields)}
        <div class="section" class:section--locked={locked}>
          <div class="section-header">
            <span class="section-icon">{group.icon}</span>
            <span class="section-label">{group.label}</span>
            {#if locked}
              <span class="locked-badge">🔒 Not visible to your role — field-group: {group.key}</span>
            {/if}
          </div>

          {#if locked}
            <!-- Locked state: the API returned no keys for this group -->
            <div class="locked-body">
              <p class="locked-desc">
                The <strong>{group.label}</strong> group is not accessible to your role.
                {#if group.key === 'compensation'}
                  Compensation data (salary, bank details) requires <code>hr_admin</code> or <code>subject</code> relation.
                {:else if group.key === 'identity'}
                  Identity / DPDP data (PAN, Aadhaar, passport) requires <code>hr_admin</code> relation. Reads are audited.
                {:else if group.key === 'medical'}
                  Medical data requires <code>hr_admin</code> relation. Reads are audited.
                {:else}
                  This field group is restricted by the current field-policy configuration.
                {/if}
              </p>
              <p class="locked-hint">
                An ADMIN can change field-group access in
                <a href="/admin/field-policies" class="locked-link">Admin → Field Policies</a>.
              </p>
            </div>
          {:else}
            <!-- Visible section: render fields -->
            <div class="fields-grid">
              {#each group.fields as field}
                {#if field in emp}
                  <div class="field-row">
                    <span class="field-label">{group.labels[field as keyof typeof group.labels] ?? field}</span>
                    {#if isEditable(field)}
                      <input
                        class="field-input"
                        type={field === 'dateOfBirth' ? 'date' : 'text'}
                        name={field}
                        value={emp[field] != null ? String(emp[field]) : ''}
                        placeholder="—"
                      />
                    {:else}
                      <span class="field-value">{formatVal(emp[field])}</span>
                    {/if}
                  </div>
                {:else if group.key === 'basic'}
                  <!-- Basic group fields may simply be empty (no profile row yet) -->
                  <div class="field-row">
                    <span class="field-label">{group.labels[field as keyof typeof group.labels] ?? field}</span>
                    {#if isEditable(field)}
                      <input class="field-input" type="text" name={field} value="" placeholder="—" />
                    {:else}
                      <span class="field-value field-value--empty">—</span>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    {#if editMode}
      <div class="edit-footer">
        <button type="submit" class="btn-primary">Save Changes</button>
        <button type="button" class="btn-secondary" onclick={() => { editMode = false; }}>Cancel</button>
      </div>
    {/if}
  </form>

  <!-- FGA / field-group explainer for the demo -->
  {#if data.user.role !== 'ADMIN' && data.user.role !== 'OWNER' && !data.isSelf}
    <div class="demo-note">
      <span class="demo-note-icon">ℹ️</span>
      <div class="demo-note-text">
        <strong>Field-group visibility:</strong> Your role ({data.user.role}) determines which sections are visible.
        Locked sections have their fields <em>absent</em> (not null) in the API response — the web client infers the locked state from the missing keys.
        This is the Plan 51 DPDP field-group enforcement in action.
      </div>
    </div>
  {/if}
</div>

<style>
  .profile-page { animation: fadeInUp 0.2s ease forwards; max-width: 820px; }

  /* Breadcrumb */
  .breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-size: 13px; }
  .breadcrumb-link { color: var(--blue); text-decoration: none; }
  .breadcrumb-link:hover { text-decoration: underline; }
  .breadcrumb-sep { color: var(--muted); }
  .breadcrumb-current { color: var(--text); font-weight: 500; }

  /* Profile header */
  .profile-header {
    display: flex; gap: 20px; align-items: flex-start;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 24px;
    margin-bottom: 24px;
  }
  .profile-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--surface2); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700; color: var(--text);
    flex-shrink: 0;
  }
  .profile-meta { flex: 1; min-width: 0; }
  .profile-name { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
  .profile-sub { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
  .profile-email { font-size: 13px; color: var(--muted); }
  .profile-role {
    font-family: var(--font-mono); font-size: 9px; font-weight: 700;
    padding: 2px 7px; border-radius: var(--r-sm); text-transform: uppercase; letter-spacing: 0.06em;
  }
  .profile-role.role-admin { background: rgba(188,140,255,0.15); color: var(--purple); }
  .profile-role.role-manager { background: rgba(88,166,255,0.15); color: var(--blue); }
  .profile-role.role-user { background: var(--surface2); color: var(--muted); }
  .status-chip { font-size: 11px; font-weight: 600; }

  .profile-org { display: flex; gap: 8px; flex-wrap: wrap; }
  .org-chip {
    font-size: 11px; color: var(--muted);
    background: var(--surface2); border: 1px solid var(--border);
    padding: 2px 8px; border-radius: var(--r-pill);
  }

  .profile-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
  .self-badge {
    font-size: 10px; color: var(--green);
    background: rgba(63,185,80,0.1); border: 1px solid rgba(63,185,80,0.3);
    padding: 2px 8px; border-radius: var(--r-pill);
  }

  /* Buttons */
  .btn-primary {
    background: var(--blue); color: #000; font-size: 12px; font-weight: 600;
    border: none; padding: 7px 14px; border-radius: var(--r-sm); cursor: pointer;
  }
  .btn-primary:hover { opacity: 0.85; }
  .btn-secondary {
    background: transparent; color: var(--muted); font-size: 12px;
    border: 1px solid var(--border); padding: 7px 14px; border-radius: var(--r-sm); cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }
  .btn-secondary:hover { color: var(--text); border-color: var(--text); }

  /* Banners */
  .success-banner {
    background: rgba(63,185,80,0.1); border: 1px solid rgba(63,185,80,0.3);
    color: var(--green); font-size: 13px; padding: 10px 16px;
    border-radius: var(--r-sm); margin-bottom: 16px;
  }

  /* Sections */
  .sections { display: flex; flex-direction: column; gap: 16px; }
  .section {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; overflow: hidden;
    transition: border-color 0.15s;
  }
  .section--locked {
    border-color: var(--border);
    opacity: 0.8;
  }

  .section-header {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--surface2);
  }
  .section-icon { font-size: 16px; }
  .section-label { font-size: 13px; font-weight: 600; color: var(--text); flex: 1; }
  .locked-badge {
    font-size: 11px; color: var(--amber);
    background: rgba(210,153,34,0.1); border: 1px solid rgba(210,153,34,0.3);
    padding: 2px 10px; border-radius: var(--r-pill);
    font-family: var(--font-mono); letter-spacing: 0.02em;
  }

  /* Locked body */
  .locked-body {
    padding: 20px 24px;
    background: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 10px,
      rgba(255,255,255,0.01) 10px,
      rgba(255,255,255,0.01) 20px
    );
  }
  .locked-desc {
    font-size: 13px; color: var(--muted); margin-bottom: 10px; line-height: 1.6;
  }
  .locked-desc strong { color: var(--text); }
  .locked-desc code {
    font-family: var(--font-mono); font-size: 11px;
    background: var(--surface2); border: 1px solid var(--border);
    padding: 1px 5px; border-radius: var(--r-sm); color: var(--blue);
  }
  .locked-hint { font-size: 12px; color: var(--muted); }
  .locked-link { color: var(--blue); }

  /* Fields grid */
  .fields-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 0;
  }
  .field-row {
    display: flex; flex-direction: column; gap: 4px;
    padding: 14px 20px; border-bottom: 1px solid var(--border);
  }
  .field-row:nth-last-child(-n+2) { border-bottom: none; }
  .field-label {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--muted);
  }
  .field-value { font-size: 13px; color: var(--text); }
  .field-value--empty { color: var(--muted); font-style: italic; }
  .field-input {
    font-size: 13px; background: var(--surface2); border: 1px solid var(--blue);
    color: var(--text); padding: 5px 8px; border-radius: var(--r-sm);
    outline: none; font-family: inherit; width: 100%;
  }
  .field-input:focus { border-color: var(--blue); box-shadow: 0 0 0 2px rgba(88,166,255,0.15); }

  /* Edit footer */
  .edit-footer {
    display: flex; gap: 10px; margin-top: 20px;
  }

  /* Demo note */
  .demo-note {
    display: flex; gap: 12px; align-items: flex-start;
    margin-top: 24px; padding: 16px 20px;
    background: rgba(88,166,255,0.05); border: 1px solid rgba(88,166,255,0.2);
    border-radius: 8px;
  }
  .demo-note-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .demo-note-text { font-size: 12px; color: var(--muted); line-height: 1.6; }
  .demo-note-text strong { color: var(--text); }
  .demo-note-text em { color: var(--blue); font-style: normal; }
</style>

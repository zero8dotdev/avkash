<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import ErrorBanner from '$components/ErrorBanner.svelte';
  import StatusBadge from '$components/StatusBadge.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  interface Transfer {
    id: string; userId: string; fromLocationId: string; toLocationId: string;
    fromDepartmentId: string | null; toDepartmentId: string | null;
    type: string; startDate: string; endDate: string | null;
    status: string; authorizedBy: string | null; notes: string | null;
    createdAt: string;
  }
  interface Location { id: string; name: string; }
  interface Department { id: string; name: string; }
  interface UserRow { id: string; name: string; email: string; role: string; teamId: string | null; }

  const transfers = $derived(data.transfers as Transfer[]);
  const locations = $derived(data.locations as Location[]);
  const departments = $derived(data.departments as Department[]);
  const users = $derived(data.users as UserRow[]);

  // Local mutable state for tab switching — INITIAL value from the URL is intentional.
  // svelte-ignore state_referenced_locally
  let activeTab = $state<string>(data.tab ?? 'list');

  function getLocationName(id: string | null): string {
    if (!id) return '—';
    return locations.find((l) => l.id === id)?.name ?? id.slice(0, 8) + '…';
  }

  function getDeptName(id: string | null): string {
    if (!id) return '—';
    return departments.find((d) => d.id === id)?.name ?? id.slice(0, 8) + '…';
  }

  function getUserName(id: string): string {
    return users.find((u) => u.id === id)?.name ?? id.slice(0, 8) + '…';
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Status color mapping
  const statusMap: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'> = {
    PENDING: 'PENDING',
    ACTIVE: 'APPROVED',
    COMPLETED: 'APPROVED',
    CANCELLED: 'CANCELLED',
  };

  // Show revocation note after an approval
  let justApprovedId = $state<string | null>(null);
  $effect(() => {
    if (form?.approveSuccess && form?.approvedTransferId) {
      justApprovedId = form.approvedTransferId as string;
    }
  });


  const isAdmin = $derived(data.user.role === 'ADMIN' || data.user.role === 'OWNER');
</script>

<div class="transfers-page">
  <div class="page-header">
    <h1 class="page-title">Transfers</h1>
    <div class="tab-row">
      <button
        class="tab" class:tab--active={activeTab === 'list'}
        onclick={() => { activeTab = 'list'; }}
      >Transfer List</button>
      {#if data.isManager}
        <button
          class="tab" class:tab--active={activeTab === 'request'}
          onclick={() => { activeTab = 'request'; }}
        >Request Transfer</button>
      {/if}
    </div>
  </div>

  <!-- Success banners -->
  {#if form?.requestSuccess}
    <div class="success-banner">Transfer initiated successfully. It is now PENDING approval.</div>
  {/if}
  {#if form?.approveSuccess}
    <div class="success-banner">
      Transfer approved.
      <strong class="revoke-note">
        ⚡ FGA fast-lane: <code>syncOrgTuples</code> was called synchronously — the previous manager
        should immediately lose /employees visibility for the transferred employee.
        The outbox relay is the reliability guarantee behind this.
      </strong>
    </div>
  {/if}
  {#if form?.cancelSuccess}
    <div class="success-banner">Transfer cancelled.</div>
  {/if}
  {#if form?.requestError}
    <ErrorBanner error={form.requestError} />
  {/if}
  {#if form?.approveError}
    <ErrorBanner error={form.approveError} />
  {/if}
  {#if form?.cancelError}
    <ErrorBanner error={form.cancelError} />
  {/if}

  <!-- Transfer list -->
  {#if activeTab === 'list'}
    <div class="transfers-list">
      {#if transfers.length === 0}
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <p class="empty-title">No transfers found</p>
          <p class="empty-desc">No transfers have been initiated for your org.</p>
          {#if data.isManager}
            <button class="btn-primary mt-12" onclick={() => { activeTab = 'request'; }}>
              + Request a Transfer
            </button>
          {/if}
        </div>
      {:else}
        {#each transfers as t (t.id)}
          {@const isJustApproved = justApprovedId === t.id}
          <div class="transfer-card" class:transfer-card--approved={isJustApproved}>
            <div class="transfer-top">
              <div class="transfer-left">
                <span class="transfer-user">{getUserName(t.userId)}</span>
                <span class="transfer-type">{t.type}</span>
              </div>
              <div class="transfer-right">
                <StatusBadge status={statusMap[t.status] ?? 'PENDING'} />
              </div>
            </div>

            <div class="transfer-route">
              <span class="route-loc">{getLocationName(t.fromLocationId)}</span>
              {#if t.fromDepartmentId}
                <span class="route-dept">({getDeptName(t.fromDepartmentId)})</span>
              {/if}
              <span class="route-arrow">→</span>
              <span class="route-loc">{getLocationName(t.toLocationId)}</span>
              {#if t.toDepartmentId}
                <span class="route-dept">({getDeptName(t.toDepartmentId)})</span>
              {/if}
            </div>

            <div class="transfer-meta">
              <span>Start: {formatDate(t.startDate)}</span>
              {#if t.endDate}
                <span>End: {formatDate(t.endDate)}</span>
              {/if}
              {#if t.notes}
                <span class="transfer-notes">Note: {t.notes}</span>
              {/if}
            </div>

            {#if isJustApproved}
              <div class="revoke-inline">
                <span class="revoke-dot"></span>
                FGA access revocation propagated — old manager's /employees list no longer contains this employee.
              </div>
            {/if}

            {#if isAdmin && t.status === 'PENDING'}
              <div class="transfer-actions">
                <form method="post" action="?/approve" use:enhance>
                  <input type="hidden" name="transferId" value={t.id} />
                  <button type="submit" class="btn-approve">Approve</button>
                </form>
                <form method="post" action="?/cancel" use:enhance>
                  <input type="hidden" name="transferId" value={t.id} />
                  <button type="submit" class="btn-cancel">Cancel</button>
                </form>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  {/if}

  <!-- Request form -->
  {#if activeTab === 'request'}
    <div class="request-section">
      <div class="request-header">
        <h2 class="request-title">Request a Transfer</h2>
        <p class="request-desc">Initiate an employee transfer between locations. Requires ADMIN approval.</p>
      </div>

      <form class="request-form" method="post" action="?/request" use:enhance>
        <div class="form-row">
          <label class="form-label" for="userId">Employee</label>
          <select class="form-select" name="userId" id="userId" required>
            <option value="">— Select employee —</option>
            {#each users.filter((u) => u.id !== data.user.id) as u (u.id)}
              <option value={u.id}>{u.name} ({u.role})</option>
            {/each}
          </select>
        </div>

        <div class="form-grid">
          <div class="form-row">
            <label class="form-label" for="fromLocationId">From Location</label>
            <select class="form-select" name="fromLocationId" id="fromLocationId" required>
              <option value="">— Select —</option>
              {#each locations as loc (loc.id)}
                <option value={loc.id}>{loc.name}</option>
              {/each}
            </select>
          </div>
          <div class="form-row">
            <label class="form-label" for="toLocationId">To Location</label>
            <select class="form-select" name="toLocationId" id="toLocationId" required>
              <option value="">— Select —</option>
              {#each locations as loc (loc.id)}
                <option value={loc.id}>{loc.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-row">
            <label class="form-label" for="fromDepartmentId">From Department (optional)</label>
            <select class="form-select" name="fromDepartmentId" id="fromDepartmentId">
              <option value="">— None —</option>
              {#each departments as dept (dept.id)}
                <option value={dept.id}>{dept.name}</option>
              {/each}
            </select>
          </div>
          <div class="form-row">
            <label class="form-label" for="toDepartmentId">To Department (optional)</label>
            <select class="form-select" name="toDepartmentId" id="toDepartmentId">
              <option value="">— None —</option>
              {#each departments as dept (dept.id)}
                <option value={dept.id}>{dept.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-row">
            <label class="form-label" for="type">Transfer Type</label>
            <select class="form-select" name="type" id="type" required>
              <option value="PERMANENT">Permanent</option>
              <option value="TEMPORARY">Temporary</option>
            </select>
          </div>
          <div class="form-row">
            <label class="form-label" for="startDate">Start Date</label>
            <input class="form-input" type="date" name="startDate" id="startDate" required />
          </div>
        </div>

        <div class="form-grid">
          <div class="form-row">
            <label class="form-label" for="endDate">End Date (optional, for temporary)</label>
            <input class="form-input" type="date" name="endDate" id="endDate" />
          </div>
          <div class="form-row">
            <label class="form-label" for="notes">Notes (optional)</label>
            <input class="form-input" type="text" name="notes" id="notes" placeholder="Reason, instructions…" maxlength="1000" />
          </div>
        </div>

        <div class="form-footer">
          <button type="submit" class="btn-primary">Initiate Transfer</button>
          <div class="form-note">
            A transfer is PENDING until an ADMIN approves it. On approval, the FGA
            <code>syncOrgTuples</code> fast-lane runs synchronously to revoke the old
            manager's viewer relation immediately.
          </div>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .transfers-page { animation: fadeInUp 0.2s ease forwards; }

  /* Page header */
  .page-header { margin-bottom: 20px; }
  .page-title { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 16px; }

  /* Tabs */
  .tab-row { display: flex; gap: 2px; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
  .tab {
    background: transparent; border: none; color: var(--muted);
    font-size: 13px; padding: 8px 16px; cursor: pointer;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s;
  }
  .tab:hover { color: var(--text); }
  .tab--active { color: var(--blue); border-bottom-color: var(--blue); font-weight: 600; }

  /* Banners */
  .success-banner {
    background: rgba(63,185,80,0.1); border: 1px solid rgba(63,185,80,0.3);
    color: var(--green); font-size: 13px; padding: 12px 16px;
    border-radius: var(--r-sm); margin-bottom: 16px; line-height: 1.6;
  }
  .revoke-note {
    display: block; margin-top: 6px; color: var(--blue); font-size: 12px;
  }
  .revoke-note code {
    font-family: var(--font-mono); font-size: 11px;
    background: rgba(88,166,255,0.1); padding: 1px 5px; border-radius: 3px;
  }

  /* Transfer cards */
  .transfers-list { display: flex; flex-direction: column; gap: 12px; }
  .transfer-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 16px 20px;
  }
  .transfer-card--approved { border-color: var(--green); }
  .transfer-top {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 10px;
  }
  .transfer-left { display: flex; align-items: center; gap: 10px; }
  .transfer-user { font-size: 14px; font-weight: 600; color: var(--text); }
  .transfer-type {
    font-size: 10px; font-family: var(--font-mono); font-weight: 600;
    background: var(--surface2); border: 1px solid var(--border);
    padding: 2px 7px; border-radius: var(--r-pill); color: var(--muted);
    text-transform: uppercase;
  }

  .transfer-route {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    margin-bottom: 8px; font-size: 13px;
  }
  .route-loc { color: var(--text); font-weight: 500; }
  .route-dept { color: var(--muted); font-size: 11px; }
  .route-arrow { color: var(--blue); font-weight: 700; }

  .transfer-meta {
    display: flex; gap: 12px; font-size: 12px; color: var(--muted);
    flex-wrap: wrap;
  }
  .transfer-notes { color: var(--muted); }

  .revoke-inline {
    display: flex; align-items: center; gap: 8px;
    margin-top: 10px; font-size: 12px; color: var(--blue);
    background: rgba(88,166,255,0.06); border: 1px solid rgba(88,166,255,0.2);
    padding: 8px 12px; border-radius: var(--r-sm);
  }
  .revoke-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--green); animation: pulse 1.5s infinite;
    flex-shrink: 0;
  }

  .transfer-actions {
    display: flex; gap: 10px; margin-top: 12px;
    padding-top: 12px; border-top: 1px solid var(--border);
  }
  .btn-approve {
    background: var(--green); color: #000; font-size: 12px; font-weight: 600;
    border: none; padding: 6px 14px; border-radius: var(--r-sm); cursor: pointer;
  }
  .btn-approve:hover { opacity: 0.85; }
  .btn-cancel {
    background: transparent; color: var(--red); font-size: 12px;
    border: 1px solid var(--red); padding: 6px 14px; border-radius: var(--r-sm); cursor: pointer;
  }
  .btn-cancel:hover { background: rgba(248,81,73,0.1); }

  /* Empty state */
  .empty-state {
    text-align: center; padding: 60px 20px;
    border: 1px dashed var(--border); border-radius: 8px;
    background: var(--surface);
  }
  .empty-icon { font-size: 32px; margin-bottom: 12px; }
  .empty-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
  .empty-desc { font-size: 13px; color: var(--muted); }
  .mt-12 { margin-top: 12px; }

  /* Request form */
  .request-section {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 24px;
  }
  .request-header { margin-bottom: 24px; }
  .request-title { font-size: 17px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
  .request-desc { font-size: 13px; color: var(--muted); }

  .request-form { display: flex; flex-direction: column; gap: 16px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-row { display: flex; flex-direction: column; gap: 6px; }
  .form-label {
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--muted);
  }
  .form-input, .form-select {
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); font-size: 13px; padding: 8px 10px;
    border-radius: var(--r-sm); outline: none; font-family: inherit;
    transition: border-color 0.15s;
  }
  .form-input:focus, .form-select:focus { border-color: var(--blue); }

  .form-footer { display: flex; align-items: flex-start; gap: 16px; margin-top: 8px; flex-wrap: wrap; }
  .form-note {
    font-size: 12px; color: var(--muted); line-height: 1.6; flex: 1;
  }
  .form-note code {
    font-family: var(--font-mono); font-size: 11px;
    background: var(--surface2); border: 1px solid var(--border);
    padding: 1px 5px; border-radius: 3px; color: var(--blue);
  }
  .btn-primary {
    background: var(--blue); color: #000; font-size: 12px; font-weight: 600;
    border: none; padding: 9px 18px; border-radius: var(--r-sm); cursor: pointer;
    flex-shrink: 0;
  }
  .btn-primary:hover { opacity: 0.85; }
</style>

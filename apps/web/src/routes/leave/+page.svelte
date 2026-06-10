<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { PageData, ActionData } from './$types';
  import StatusBadge from '$components/StatusBadge.svelte';
  import ErrorBanner from '$components/ErrorBanner.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // ── Tab state ─────────────────────────────────────────────────────────────
  // Initialize from URL param (server load passes it in data.tab); use 'my' as fallback.
  let activeTab = $state<string>('my');
  // Sync once on mount from the URL param passed by the server
  $effect(() => { if (data.tab) activeTab = data.tab as string; });

  function setTab(tab: string) {
    activeTab = tab;
    void goto(`/leave?tab=${tab}`, { replaceState: true });
  }

  // ── Leave type helpers ────────────────────────────────────────────────────
  interface LeaveType {
    leaveTypeId: string;
    name: string;
    color: string | null;
    kind: string;
    isPaid: boolean;
    isActive: boolean;
  }

  interface LeaveBalance {
    leaveTypeId: string;
    year: number;
    entitlement: number;
    balance: number;
    available: number;
    taken: number;
    planned: number;
  }

  interface LeaveRequest {
    leaveId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    duration: string;
    isApproved: string;
    workingDays: string;
    reason: string | null;
    userId: string;
    createdOn: string;
  }

  function typeName(typeId: string): string {
    const t = (data.leaveTypes as LeaveType[]).find((lt) => lt.leaveTypeId === typeId);
    return t?.name ?? typeId.slice(0, 8);
  }

  function available(typeId: string): number {
    const b = (data.balances as LeaveBalance[]).find((b) => b.leaveTypeId === typeId);
    return b?.available ?? 0;
  }

  // Leaf-type options for the apply form (LEAVE kind only, active only)
  let leaveOptions = $derived(
    (data.leaveTypes as LeaveType[]).filter((lt) => lt.kind === 'LEAVE' && lt.isActive)
  );

  // ── Apply form state ──────────────────────────────────────────────────────
  let applying = $state(false);
  let applyError = $state<{ code: string; message: string; details?: Record<string, unknown> } | null>(null);
  let applySuccess = $state(false);

  // Reset on form action results
  $effect(() => {
    if (form?.applyError) {
      applyError = form.applyError as typeof applyError;
      applySuccess = false;
    } else if (form?.applySuccess) {
      applyError = null;
      applySuccess = true;
    }
  });

  // ── My leaves table ───────────────────────────────────────────────────────
  let myLeaves = $derived(data.myLeaves as LeaveRequest[]);

  function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Approval queue ────────────────────────────────────────────────────────
  let pendingApprovals = $derived(data.pendingApprovals as LeaveRequest[]);
  let isManager = $derived(data.user?.role === 'MANAGER' || data.user?.role === 'ADMIN');

  let decisionError = $state<{ code: string; message: string } | null>(null);
  let decisionSuccess = $state<string | null>(null);

  $effect(() => {
    if (form?.decisionError) {
      decisionError = form.decisionError as typeof decisionError;
    } else if (form?.decisionSuccess) {
      decisionError = null;
      decisionSuccess = `Leave ${(form.action as string) ?? 'processed'}`;
    }
  });
</script>

<svelte:head>
  <title>Leave — Avkash</title>
</svelte:head>

<div class="leave-page">
  <header class="page-header">
    <h1>Leave</h1>
    <p class="subtitle">Manage your leave requests and balances</p>
  </header>

  <!-- Tabs -->
  <div class="tabs" role="tablist">
    <button
      class="tab-btn"
      class:active={activeTab === 'my'}
      role="tab"
      aria-selected={activeTab === 'my'}
      onclick={() => setTab('my')}
    >My Requests</button>
    <button
      class="tab-btn"
      class:active={activeTab === 'apply'}
      role="tab"
      aria-selected={activeTab === 'apply'}
      onclick={() => setTab('apply')}
    >Apply Leave</button>
    {#if isManager}
      <button
        class="tab-btn"
        class:active={activeTab === 'queue'}
        role="tab"
        aria-selected={activeTab === 'queue'}
        onclick={() => setTab('queue')}
      >Approval Queue
        {#if pendingApprovals.length > 0}
          <span class="tab-count">{pendingApprovals.length}</span>
        {/if}
      </button>
    {/if}
  </div>

  <!-- Tab: My Requests -->
  {#if activeTab === 'my'}
    <div class="tab-panel" role="tabpanel">
      <div class="panel-header">
        <!-- Balance pills -->
        <div class="balance-pills">
          {#each data.leaveTypes as lt (lt.leaveTypeId)}
            {@const bal = (data.balances as LeaveBalance[]).find((b) => b.leaveTypeId === lt.leaveTypeId)}
            {#if bal && (lt.name === 'Casual Leave' || lt.name === 'Sick Leave' || lt.name === 'Earned Leave')}
              <div class="balance-pill">
                <span class="bp-name">{lt.name.replace(' Leave', '')}</span>
                <span class="bp-val mono">{bal.available}</span>
                <span class="bp-sep">/</span>
                <span class="bp-total mono muted">{bal.entitlement}</span>
              </div>
            {/if}
          {/each}
        </div>
      </div>

      {#if myLeaves.length === 0}
        <div class="empty-state">No leave requests yet. <button class="link-btn" onclick={() => setTab('apply')}>Apply for leave →</button></div>
      {:else}
        <div class="leaves-list">
          {#each myLeaves as leave (leave.leaveId)}
            <div class="leave-card">
              <div class="leave-card-left">
                <div class="leave-type-name">{typeName(leave.leaveTypeId)}</div>
                <div class="leave-dates">
                  {formatDate(leave.startDate)}
                  {#if leave.startDate !== leave.endDate} – {formatDate(leave.endDate)}{/if}
                  · <span class="mono">{leave.workingDays} days</span>
                </div>
                {#if leave.reason}
                  <div class="leave-reason">{leave.reason}</div>
                {/if}
              </div>
              <div class="leave-card-right">
                <StatusBadge status={leave.isApproved} />
                <div class="leave-applied-on">Applied {formatDate(leave.createdOn)}</div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Tab: Apply Leave -->
  {#if activeTab === 'apply'}
    <div class="tab-panel" role="tabpanel">
      {#if applySuccess}
        <div class="success-banner">
          Leave application submitted successfully.
          <button class="link-btn" onclick={() => { applySuccess = false; setTab('my'); }}>View My Requests →</button>
        </div>
      {/if}

      <ErrorBanner error={applyError} onDismiss={() => { applyError = null; }} />

      <form
        method="POST"
        action="?/apply"
        class="apply-form"
        use:enhance={() => {
          applying = true;
          applyError = null;
          applySuccess = false;
          return async ({ update }) => {
            await update();
            applying = false;
          };
        }}
      >
        <div class="form-row">
          <div class="form-field">
            <label class="form-label" for="leaveTypeId">Leave Type</label>
            <select id="leaveTypeId" name="leaveTypeId" class="form-select" required>
              <option value="">Select type…</option>
              {#each leaveOptions as lt (lt.leaveTypeId)}
                <option value={lt.leaveTypeId}>
                  {lt.name} (available: {available(lt.leaveTypeId)})
                </option>
              {/each}
            </select>
          </div>
        </div>

        <div class="form-row two-col">
          <div class="form-field">
            <label class="form-label" for="startDate">Start Date</label>
            <input type="date" id="startDate" name="startDate" class="form-input" required />
          </div>
          <div class="form-field">
            <label class="form-label" for="endDate">End Date</label>
            <input type="date" id="endDate" name="endDate" class="form-input" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <span class="form-label" role="group" aria-label="Duration">Duration</span>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="duration" value="FULL_DAY" checked />
                Full Day
              </label>
              <label class="radio-label">
                <input type="radio" name="duration" value="HALF_DAY" />
                Half Day
              </label>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="form-label" for="reason">Reason <span class="optional">(optional)</span></label>
            <textarea id="reason" name="reason" class="form-textarea" rows="3" placeholder="Brief reason for leave…"></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="action-btn primary" disabled={applying}>
            {applying ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </form>

      <!-- Demo hint: blackout test -->
      <div class="demo-hint">
        <span class="hint-label">Demo beat:</span>
        Try applying for <strong>2026-09-28</strong> (Coimbatore plant blackout "Q2 FY2027 Quarter-End Freeze"). The API returns <code>LEAVE_BLACKOUT_PERIOD</code>.
      </div>
    </div>
  {/if}

  <!-- Tab: Approval Queue (MANAGER+) -->
  {#if activeTab === 'queue' && isManager}
    <div class="tab-panel" role="tabpanel">
      <ErrorBanner error={decisionError} onDismiss={() => { decisionError = null; }} />
      {#if decisionSuccess}
        <div class="success-banner">{decisionSuccess} successfully.</div>
      {/if}

      {#if pendingApprovals.length === 0}
        <div class="empty-state">No pending leave requests in your queue.</div>
      {:else}
        <div class="approvals-list">
          {#each pendingApprovals as leave (leave.leaveId)}
            <div class="approval-card">
              <div class="approval-info">
                <div class="approval-name">
                  <span class="type-pill" style="background: rgba(88,166,255,0.1); color: var(--blue)">{typeName(leave.leaveTypeId)}</span>
                  <span class="emp-id mono muted">uid: {leave.userId.slice(0, 8)}…</span>
                </div>
                <div class="approval-dates">
                  {formatDate(leave.startDate)}
                  {#if leave.startDate !== leave.endDate} – {formatDate(leave.endDate)}{/if}
                  · <span class="mono">{leave.workingDays} days</span>
                </div>
                {#if leave.reason}
                  <div class="approval-reason">{leave.reason}</div>
                {/if}
              </div>
              <div class="approval-actions">
                <form method="POST" action="?/approve" use:enhance={() => {
                  decisionError = null;
                  decisionSuccess = null;
                  return async ({ update }) => { await update(); };
                }}>
                  <input type="hidden" name="leaveId" value={leave.leaveId} />
                  <button type="submit" class="action-btn approve-btn">✓ Approve</button>
                </form>
                <form method="POST" action="?/reject" use:enhance={() => {
                  decisionError = null;
                  decisionSuccess = null;
                  return async ({ update }) => { await update(); };
                }}>
                  <input type="hidden" name="leaveId" value={leave.leaveId} />
                  <button type="submit" class="action-btn reject-btn">✕ Reject</button>
                </form>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Demo hint: 403 FORBIDDEN_RELATION -->
      <div class="demo-hint">
        <span class="hint-label">Demo beat:</span>
        Dev (Logistics manager) trying to approve Sara's leave → <code>403 FORBIDDEN_RELATION</code> — not their report.
      </div>
    </div>
  {/if}
</div>

<style>
  .leave-page {
    max-width: 860px;
    margin: 0 auto;
    animation: fadeInUp 0.3s ease forwards;
  }

  .page-header {
    margin-bottom: 28px;
  }
  h1 {
    font-size: 22px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
  }
  .subtitle {
    font-size: 13px;
    color: var(--muted);
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 24px;
  }
  .tab-btn {
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    cursor: pointer;
    transition: all var(--dur-fast) var(--ease);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tab-btn:hover { color: var(--text); }
  .tab-btn.active {
    color: var(--blue);
    border-bottom-color: var(--blue);
  }
  .tab-count {
    background: rgba(210,153,34,0.15);
    color: var(--amber);
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: var(--r-pill);
  }

  /* Tab panels */
  .tab-panel { animation: fadeInUp 0.2s ease forwards; }

  /* Panel header with balance pills */
  .panel-header { margin-bottom: 16px; }
  .balance-pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .balance-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    padding: 4px 10px;
    font-size: 12px;
  }
  .bp-name { color: var(--muted); font-weight: 500; }
  .bp-val { font-size: 14px; font-weight: 700; color: var(--text); }
  .bp-sep { color: var(--border); }
  .bp-total { font-size: 12px; }
  .mono { font-family: var(--font-mono); }
  .muted { color: var(--muted); }

  /* Leave cards */
  .leaves-list { display: flex; flex-direction: column; gap: 8px; }
  .leave-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 14px 18px;
  }
  .leave-card-left { flex: 1; }
  .leave-type-name { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
  .leave-dates { font-size: 12px; color: var(--muted); margin-bottom: 2px; }
  .leave-reason { font-size: 12px; color: var(--muted); font-style: italic; }
  .leave-card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .leave-applied-on { font-size: 11px; color: var(--muted); }

  /* Apply form */
  .apply-form {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 24px;
    max-width: 560px;
  }
  .form-row { margin-bottom: 18px; }
  .form-row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-field { display: flex; flex-direction: column; gap: 6px; }
  .form-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .optional { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--muted); }
  .form-select, .form-input, .form-textarea {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 8px 10px;
    color: var(--text);
    font-size: 13px;
    font-family: var(--font-sans);
    transition: border-color var(--dur-fast) var(--ease);
  }
  .form-select:focus, .form-input:focus, .form-textarea:focus {
    outline: none;
    border-color: var(--blue);
  }
  .form-textarea { resize: vertical; }
  .radio-group { display: flex; gap: 16px; }
  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text);
    cursor: pointer;
  }
  .form-actions { margin-top: 4px; }

  /* Action buttons */
  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: var(--r-md);
    font-size: 12px;
    font-weight: 500;
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    transition: all var(--dur-fast) var(--ease);
    cursor: pointer;
  }
  .action-btn:hover { background: var(--surface); border-color: var(--blue); color: var(--blue); }
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .action-btn.primary { background: var(--blue); color: #000; border-color: var(--blue); }
  .action-btn.primary:hover { background: #79b8ff; }
  .approve-btn { color: var(--green); border-color: rgba(63,185,80,0.4); }
  .approve-btn:hover { background: rgba(63,185,80,0.1); border-color: var(--green); }
  .reject-btn { color: var(--red); border-color: rgba(248,81,73,0.4); }
  .reject-btn:hover { background: rgba(248,81,73,0.1); border-color: var(--red); }

  /* Approval queue */
  .approvals-list { display: flex; flex-direction: column; gap: 10px; }
  .approval-card {
    display: flex;
    align-items: center;
    gap: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 14px 18px;
  }
  .approval-info { flex: 1; }
  .approval-name { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .type-pill {
    padding: 2px 8px;
    border-radius: var(--r-sm);
    font-size: 12px;
    font-weight: 600;
  }
  .emp-id { font-size: 11px; }
  .approval-dates { font-size: 12px; color: var(--muted); margin-bottom: 2px; }
  .approval-reason { font-size: 12px; color: var(--muted); font-style: italic; }
  .approval-actions { display: flex; gap: 8px; align-items: center; }

  /* Banners */
  .success-banner {
    background: rgba(63,185,80,0.08);
    border: 1px solid rgba(63,185,80,0.3);
    border-radius: var(--r-md);
    padding: 12px 16px;
    font-size: 13px;
    color: var(--green);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .link-btn {
    background: none;
    border: none;
    color: var(--blue);
    font-size: 13px;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }
  .demo-hint {
    margin-top: 20px;
    padding: 12px 16px;
    background: rgba(88,166,255,0.04);
    border: 1px dashed var(--border);
    border-radius: var(--r-md);
    font-size: 12px;
    color: var(--muted);
  }
  .hint-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--purple);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: 6px;
  }
  code {
    font-family: var(--font-mono);
    font-size: 11px;
    background: var(--surface2);
    padding: 1px 4px;
    border-radius: 3px;
    color: var(--red);
  }

  .empty-state {
    font-size: 13px;
    color: var(--muted);
    padding: 24px;
    text-align: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
  }
</style>

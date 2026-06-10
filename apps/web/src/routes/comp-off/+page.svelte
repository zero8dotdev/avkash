<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { PageData, ActionData } from './$types';
  import StatusBadge from '$components/StatusBadge.svelte';
  import ErrorBanner from '$components/ErrorBanner.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // ── Tab state ─────────────────────────────────────────────────────────────
  let activeTab = $state<string>('my');
  $effect(() => { if (data.tab) activeTab = data.tab as string; });

  function setTab(t: string) {
    activeTab = t;
    void goto(`/comp-off?tab=${t}`, { replaceState: true });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function formatDate(s: string | null | undefined) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function daysFromNow(s: string): number {
    const expiry = new Date(s);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // ── Approval result tracking ─────────────────────────────────────────────
  interface ApprovedResult {
    status: string;
    expiresOn: string | null;
    approvedBy: string | null;
  }
  let lastApproved = $state<ApprovedResult | null>(null);

  $effect(() => {
    if (form && 'decisionSuccess' in form && form.decisionSuccess && form.action === 'approved') {
      const approved = (form as { approved?: ApprovedResult }).approved;
      if (approved) lastApproved = approved;
    }
  });

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const isManager = $derived(data.user?.role === 'MANAGER' || data.user?.role === 'ADMIN');
</script>

<svelte:head><title>Comp-off — Avkash</title></svelte:head>

<div class="page">
  <header class="page-header">
    <div class="header-row">
      <div>
        <h1>Comp-off</h1>
        <p class="subtitle">Compensatory leave credits for working on off days</p>
      </div>
      {#if data.compOffBalance}
        <div class="balance-chip">
          <span class="balance-num">{Number(data.compOffBalance.available).toFixed(2)}</span>
          <span class="balance-label">days available</span>
        </div>
      {/if}
    </div>
  </header>

  <!-- Tabs -->
  <div class="tabs" role="tablist">
    <button
      class="tab"
      class:active={activeTab === 'my'}
      onclick={() => setTab('my')}
      role="tab"
      aria-selected={activeTab === 'my'}
    >My Comp-offs</button>

    <button
      class="tab"
      class:active={activeTab === 'request'}
      onclick={() => setTab('request')}
      role="tab"
      aria-selected={activeTab === 'request'}
    >Request</button>

    {#if isManager}
      <button
        class="tab"
        class:active={activeTab === 'queue'}
        onclick={() => setTab('queue')}
        role="tab"
        aria-selected={activeTab === 'queue'}
      >
        Approval Queue
        {#if data.pendingQueue.length > 0}
          <span class="badge">{data.pendingQueue.length}</span>
        {/if}
      </button>
    {/if}

    <button
      class="tab"
      class:active={activeTab === 'encash'}
      onclick={() => setTab('encash')}
      role="tab"
      aria-selected={activeTab === 'encash'}
    >Encashment</button>
  </div>

  <!-- ── My Comp-offs tab ─────────────────────────────────────────────────── -->
  {#if activeTab === 'my'}
    <div class="tab-panel">
      {#if data.myCompOffs.length === 0}
        <div class="empty-state">No comp-off records yet.</div>
      {:else}
        <div class="co-list">
          {#each data.myCompOffs as co (co.id)}
            {@const expDays = co.expiresOn ? daysFromNow(co.expiresOn) : null}
            <div class="co-card" class:approved={co.status === 'APPROVED'} class:expired={expDays !== null && expDays <= 0}>
              <div class="co-info">
                <div class="co-date">Worked on: <strong>{formatDate(co.workedOn)}</strong></div>
                <div class="co-days mono">{Number(co.days).toFixed(2)} day(s)</div>
                {#if co.expiresOn && co.status === 'APPROVED'}
                  <div class="co-expiry" class:expiring-soon={expDays !== null && expDays <= 14 && expDays > 0} class:expired={expDays !== null && expDays <= 0}>
                    {#if expDays !== null && expDays <= 0}
                      Expired {formatDate(co.expiresOn)}
                    {:else if expDays !== null && expDays <= 14}
                      ⚠ Expires {formatDate(co.expiresOn)} ({expDays}d left)
                    {:else}
                      Expires {formatDate(co.expiresOn)}
                    {/if}
                  </div>
                {/if}
              </div>
              <StatusBadge status={co.status} />
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- ── Request tab ──────────────────────────────────────────────────────── -->
  {#if activeTab === 'request'}
    <div class="tab-panel">
      {#if form && 'earnSuccess' in form && form.earnSuccess}
        <div class="success-banner">Comp-off request submitted successfully. Awaiting manager approval.</div>
      {/if}
      {#if form && 'earnError' in form && form.earnError}
        <ErrorBanner error={form.earnError} />
      {/if}

      <div class="form-card">
        <h2 class="form-title">Request Comp-off</h2>
        <p class="form-hint">
          Submit a compensatory off claim for working on a weekly off day or holiday.
          Your manager will approve or reject the request.
        </p>

        <form method="POST" action="?/earn" use:enhance>
          <div class="field">
            <label for="workedOn">Date Worked</label>
            <input
              id="workedOn"
              name="workedOn"
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div class="field">
            <label for="leaveTypeId">Comp-off Type</label>
            <select id="leaveTypeId" name="leaveTypeId" required>
              {#each data.leaveTypes.filter((lt) => lt.kind === 'COMP_OFF') as lt (lt.leaveTypeId)}
                <option value={lt.leaveTypeId}>{lt.name}</option>
              {:else}
                <option disabled>No comp-off leave type configured</option>
              {/each}
            </select>
          </div>

          <div class="field">
            <label for="days">Days</label>
            <input
              id="days"
              name="days"
              type="number"
              min="0.5"
              max="1"
              step="0.5"
              value="1"
            />
            <span class="field-hint">Usually 1 full day or 0.5 for a half-day shift</span>
          </div>

          <button type="submit" class="btn-primary">Submit Request</button>
        </form>
      </div>
    </div>
  {/if}

  <!-- ── Approval Queue tab (MANAGER+) ──────────────────────────────────── -->
  {#if activeTab === 'queue' && isManager}
    <div class="tab-panel">
      {#if lastApproved}
        <div class="approval-result">
          <div class="result-label">Comp-off approved</div>
          <div class="result-details">
            <span class="result-status"><StatusBadge status="APPROVED" /></span>
            {#if lastApproved.expiresOn}
              <span class="result-expiry">
                Expires: <strong>{formatDate(lastApproved.expiresOn)}</strong>
                <span class="expiry-note">(90-day policy — India compliance)</span>
              </span>
            {/if}
          </div>
        </div>
      {/if}

      {#if form && 'decisionError' in form && form.decisionError}
        <ErrorBanner error={form.decisionError} />
      {/if}

      {#if data.pendingQueue.length === 0}
        <div class="empty-state">No pending comp-off requests.</div>
      {:else}
        <div class="queue-list">
          {#each data.pendingQueue as co (co.id)}
            <div class="queue-card">
              <div class="queue-info">
                <div class="queue-date">Worked on: <strong>{formatDate(co.workedOn)}</strong></div>
                <div class="queue-days mono">{Number(co.days).toFixed(2)} day(s)</div>
                <div class="queue-uid muted">uid: {co.userId.slice(0, 8)}…</div>
              </div>
              <div class="queue-actions">
                <form method="POST" action="?/approve" use:enhance>
                  <input type="hidden" name="compOffId" value={co.id} />
                  <button type="submit" class="btn-approve">Approve</button>
                </form>
                <form method="POST" action="?/reject" use:enhance>
                  <input type="hidden" name="compOffId" value={co.id} />
                  <button type="submit" class="btn-reject">Reject</button>
                </form>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- ── Encashment tab ──────────────────────────────────────────────────── -->
  {#if activeTab === 'encash'}
    {@const encashableTypes = data.leaveTypes.filter((lt: { kind: string; name: string }) => lt.kind === 'LEAVE' && lt.name !== 'Compensatory Off')}
    <div class="tab-panel">
      {#if form && 'encashSuccess' in form && form.encashSuccess}
        <div class="success-banner">Encashment request submitted. HR will review and process it.</div>
      {/if}
      {#if form && 'encashError' in form && form.encashError}
        <ErrorBanner error={form.encashError} />
      {/if}

      <div class="form-card">
        <h2 class="form-title">Request Encashment</h2>
        <p class="form-hint">
          Convert unused Earned Leave days to cash. The payout is processed at year-end or
          at Full &amp; Final settlement. Maximum encashable days are set per policy.
        </p>

        {#if encashableTypes.length === 0}
          <p class="muted-note">No encashable leave types found in your org.</p>
        {:else}
          <form method="POST" action="?/requestEncashment" use:enhance>
            <div class="field">
              <label for="encash-leaveType">Leave Type</label>
              <select id="encash-leaveType" name="leaveTypeId" required>
                {#each encashableTypes as lt (lt.leaveTypeId)}
                  <option value={lt.leaveTypeId}>{lt.name}</option>
                {/each}
              </select>
            </div>

            <div class="field">
              <label for="encash-days">Days to Encash</label>
              <input
                id="encash-days"
                name="days"
                type="number"
                min="1"
                step="1"
                required
                placeholder="e.g. 5"
              />
              <span class="field-hint">
                EL policy: max 15 days encashable (Assembly team). Check your policy for your limit.
              </span>
            </div>

            <button type="submit" class="btn-primary">Request Encashment</button>
          </form>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .page { max-width: 780px; margin: 0 auto; animation: fadeInUp 0.3s ease forwards; }
  .page-header { margin-bottom: 24px; }
  .header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  h1 { font-size: 22px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: var(--muted); }

  /* Balance chip */
  .balance-chip {
    display: flex; flex-direction: column; align-items: flex-end;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-md); padding: 8px 14px;
  }
  .balance-num { font-size: 22px; font-weight: 700; color: var(--blue); font-family: var(--font-mono); }
  .balance-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }

  /* Tabs */
  .tabs {
    display: flex; gap: 4px; margin-bottom: 20px;
    border-bottom: 1px solid var(--border); padding-bottom: 0;
  }
  .tab {
    padding: 8px 14px; background: transparent; color: var(--muted);
    border: none; border-bottom: 2px solid transparent;
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all var(--dur-fast) var(--ease);
    display: flex; align-items: center; gap: 6px;
  }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--blue); border-bottom-color: var(--blue); }
  .badge {
    background: var(--amber); color: #000; font-size: 10px;
    font-weight: 700; padding: 1px 5px; border-radius: 9999px;
  }

  /* Tab panel */
  .tab-panel { animation: fadeInUp 0.2s ease forwards; }

  /* Comp-off list */
  .co-list { display: flex; flex-direction: column; gap: 8px; }
  .co-card {
    display: flex; align-items: center; gap: 16px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-md); padding: 14px 18px;
    transition: border-color var(--dur-fast) var(--ease);
  }
  .co-card.approved { border-left: 3px solid var(--green); }
  .co-card.expired { opacity: 0.6; }
  .co-info { flex: 1; }
  .co-date { font-size: 13px; color: var(--text); }
  .co-days { font-size: 13px; color: var(--blue); margin-top: 2px; }
  .co-expiry { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .co-expiry.expiring-soon { color: var(--amber); font-weight: 600; }
  .co-expiry.expired { color: var(--red); }
  .mono { font-family: var(--font-mono); }
  .muted { color: var(--muted); }

  /* Queue */
  .queue-list { display: flex; flex-direction: column; gap: 8px; }
  .queue-card {
    display: flex; align-items: center; gap: 16px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-md); padding: 14px 18px;
  }
  .queue-info { flex: 1; }
  .queue-date { font-size: 13px; color: var(--text); }
  .queue-days { font-size: 13px; color: var(--blue); margin-top: 2px; font-family: var(--font-mono); }
  .queue-uid { font-size: 11px; margin-top: 2px; font-family: var(--font-mono); }
  .queue-actions { display: flex; gap: 8px; }

  /* Approval result */
  .approval-result {
    background: rgba(63,185,80,0.06); border: 1px solid var(--green);
    border-radius: var(--r-md); padding: 14px 18px; margin-bottom: 16px;
  }
  .result-label { font-size: 13px; font-weight: 600; color: var(--green); margin-bottom: 8px; }
  .result-details { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .result-expiry { font-size: 13px; color: var(--text); }
  .expiry-note { font-size: 11px; color: var(--muted); margin-left: 4px; }

  /* Form */
  .form-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-md); padding: 20px 24px; max-width: 480px;
  }
  .form-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
  .form-hint { font-size: 12px; color: var(--muted); margin-bottom: 20px; line-height: 1.6; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
  label { font-size: 12px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  input, select {
    background: var(--surface2); border: 1px solid var(--border); color: var(--text);
    border-radius: var(--r-sm); padding: 8px 10px; font-size: 13px;
    font-family: inherit; transition: border-color var(--dur-fast) var(--ease);
  }
  input:focus, select:focus { outline: none; border-color: var(--blue); }
  .field-hint { font-size: 11px; color: var(--muted); }

  /* Buttons */
  .btn-primary {
    background: var(--blue); color: #000; border: none;
    padding: 8px 18px; border-radius: var(--r-sm);
    font-size: 13px; font-weight: 600;
    cursor: pointer; margin-top: 4px;
    transition: opacity var(--dur-fast) var(--ease);
  }
  .btn-primary:hover { opacity: 0.85; }
  .btn-approve {
    background: rgba(63,185,80,0.12); color: var(--green);
    border: 1px solid var(--green); padding: 6px 14px;
    border-radius: var(--r-sm); font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all var(--dur-fast) var(--ease);
  }
  .btn-approve:hover { background: rgba(63,185,80,0.2); }
  .btn-reject {
    background: rgba(248,81,73,0.08); color: var(--red);
    border: 1px solid var(--red); padding: 6px 14px;
    border-radius: var(--r-sm); font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all var(--dur-fast) var(--ease);
  }
  .btn-reject:hover { background: rgba(248,81,73,0.16); }

  /* Misc */
  .empty-state {
    font-size: 13px; color: var(--muted); padding: 32px; text-align: center;
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-md);
  }
  .success-banner {
    background: rgba(63,185,80,0.06); border: 1px solid var(--green);
    border-radius: var(--r-md); padding: 12px 16px;
    font-size: 13px; color: var(--green); margin-bottom: 16px;
  }
  .muted-note { font-size: 13px; color: var(--muted); padding: 12px 0; }
</style>

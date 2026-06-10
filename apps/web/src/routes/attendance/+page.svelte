<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { PageData, ActionData } from './$types';
  import StatusBadge from '$components/StatusBadge.svelte';
  import ErrorBanner from '$components/ErrorBanner.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // ── Tab state ─────────────────────────────────────────────────────────────
  // Initialize with 'today' as fallback; sync from server-passed URL param.
  let activeTab = $state<string>('today');
  $effect(() => { if (data.tab) activeTab = data.tab as string; });

  function setTab(tab: string) {
    activeTab = tab;
    void goto(`/attendance?tab=${tab}`, { replaceState: true });
  }

  // ── Types ─────────────────────────────────────────────────────────────────
  interface AttendanceDay {
    date: string;
    status: string;
    firstIn: string | null;
    lastOut: string | null;
    hours: number;
    overtimeHours: number;
    wfh: boolean;
  }

  interface Regularization {
    id: string;
    userId: string;
    date: string;
    requestedIn: string | null;
    requestedOut: string | null;
    reason: string;
    status: string;
    decisionNote: string | null;
    createdAt: string;
  }

  // ── Today's attendance ────────────────────────────────────────────────────
  let todayAttendance = $derived(data.todayAttendance as AttendanceDay | null);
  let checkedIn = $derived(!!todayAttendance?.firstIn);
  let checkedOut = $derived(!!todayAttendance?.lastOut);

  let punching = $state(false);
  let punchError = $state<{ code: string; message: string } | null>(null);

  $effect(() => {
    if (form?.punchError) {
      punchError = form.punchError as typeof punchError;
    } else if (form?.punchSuccess) {
      punchError = null;
    }
  });

  function formatTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });
  }

  function formatDate(s: string): string {
    return new Date(s).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });
  }

  // ── Week strip ────────────────────────────────────────────────────────────
  let weekDays = $derived(data.weekAttendance as AttendanceDay[]);

  const STATUS_COLOR: Record<string, string> = {
    PRESENT:    'var(--green)',
    ABSENT:     'var(--red)',
    HALF_DAY:   'var(--amber)',
    WEEKLY_OFF: 'var(--border)',
    HOLIDAY:    'var(--purple)',
    ON_LEAVE:   'var(--blue)',
  };

  function dayLabel(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short' });
  }
  function dayNum(iso: string): number {
    return new Date(iso).getDate();
  }
  function isToday(iso: string): boolean {
    return iso === data.today;
  }

  // ── Regularizations ───────────────────────────────────────────────────────
  let myRegs = $derived(data.regularizations as Regularization[]);
  let pendingRegQueue = $derived(data.pendingRegQueue as Regularization[]);
  let isManager = $derived(data.user?.role === 'MANAGER' || data.user?.role === 'ADMIN');

  let regError = $state<{ code: string; message: string } | null>(null);
  let regSuccess = $state(false);
  let regSubmitting = $state(false);

  $effect(() => {
    if (form?.regError) {
      regError = form.regError as typeof regError;
      regSuccess = false;
    } else if (form?.regSuccess) {
      regError = null;
      regSuccess = true;
    }
  });

  let regDecisionError = $state<{ code: string; message: string } | null>(null);
  let regDecisionSuccess = $state<string | null>(null);

  $effect(() => {
    if (form?.regDecisionError) {
      regDecisionError = form.regDecisionError as typeof regDecisionError;
    } else if (form?.regDecisionSuccess) {
      regDecisionError = null;
      regDecisionSuccess = `Regularization ${(form.regAction as string) ?? 'processed'}`;
    }
  });
</script>

<svelte:head>
  <title>Attendance — Avkash</title>
</svelte:head>

<div class="attendance-page">
  <header class="page-header">
    <h1>Attendance</h1>
    <p class="subtitle">Track your daily punches and manage regularizations</p>
  </header>

  <!-- Tabs -->
  <div class="tabs" role="tablist">
    <button class="tab-btn" class:active={activeTab === 'today'} onclick={() => setTab('today')}>Today</button>
    <button class="tab-btn" class:active={activeTab === 'week'} onclick={() => setTab('week')}>This Week</button>
    <button class="tab-btn" class:active={activeTab === 'regularize'} onclick={() => setTab('regularize')}>Regularization
      {#if myRegs.filter((r) => r.status === 'PENDING').length > 0}
        <span class="tab-count">{myRegs.filter((r) => r.status === 'PENDING').length}</span>
      {/if}
    </button>
    {#if isManager}
      <button class="tab-btn" class:active={activeTab === 'reg-queue'} onclick={() => setTab('reg-queue')}>Approval Queue
        {#if pendingRegQueue.length > 0}
          <span class="tab-count amber">{pendingRegQueue.length}</span>
        {/if}
      </button>
    {/if}
  </div>

  <!-- Today -->
  {#if activeTab === 'today'}
    <div class="tab-panel">
      <ErrorBanner error={punchError} onDismiss={() => { punchError = null; }} />

      <div class="today-card">
        <div class="today-header">
          <div class="today-date-label">
            {new Date(data.today).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          {#if todayAttendance}
            <StatusBadge status={
              todayAttendance.status === 'WEEKLY_OFF' ? 'ACTIVE' :
              checkedIn ? 'APPROVED' : 'PENDING'
            } />
          {/if}
        </div>

        {#if todayAttendance?.status === 'WEEKLY_OFF'}
          <div class="off-day-state">
            <div class="off-icon">🏖</div>
            <div class="off-label">Weekly Off</div>
          </div>
        {:else if todayAttendance?.status === 'HOLIDAY'}
          <div class="off-day-state">
            <div class="off-icon">🎉</div>
            <div class="off-label">Holiday</div>
          </div>
        {:else}
          <!-- Punch times -->
          <div class="punch-times">
            <div class="punch-time-block">
              <span class="pt-label">Check-In</span>
              <span class="pt-value mono">{formatTime(todayAttendance?.firstIn ?? null)}</span>
            </div>
            <div class="pt-arrow">→</div>
            <div class="punch-time-block">
              <span class="pt-label">Check-Out</span>
              <span class="pt-value mono">{formatTime(todayAttendance?.lastOut ?? null)}</span>
            </div>
            {#if todayAttendance && todayAttendance.hours > 0}
              <div class="pt-arrow"></div>
              <div class="punch-time-block">
                <span class="pt-label">Hours</span>
                <span class="pt-value mono blue">{todayAttendance.hours.toFixed(1)}h</span>
              </div>
            {/if}
          </div>

          <!-- Punch buttons -->
          <div class="punch-btns">
            {#if !checkedIn}
              <form method="POST" action="?/checkIn" use:enhance={() => {
                punching = true;
                punchError = null;
                return async ({ update }) => { await update(); punching = false; };
              }}>
                <button type="submit" class="punch-btn check-in-btn" disabled={punching}>
                  <span class="punch-dot-btn in"></span>
                  {punching ? 'Recording…' : 'Check In'}
                </button>
              </form>
            {:else if !checkedOut}
              <form method="POST" action="?/checkOut" use:enhance={() => {
                punching = true;
                punchError = null;
                return async ({ update }) => { await update(); punching = false; };
              }}>
                <button type="submit" class="punch-btn check-out-btn" disabled={punching}>
                  <span class="punch-dot-btn out"></span>
                  {punching ? 'Recording…' : 'Check Out'}
                </button>
              </form>
            {:else}
              <div class="day-complete">
                <span class="complete-icon">✓</span>
                Day complete · {todayAttendance?.hours?.toFixed(1) ?? 0}h worked
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="demo-hint">
        <span class="hint-label">Note:</span>
        Check-in/out calls <code>POST /attendance/check-in</code> and <code>/check-out</code> — the API will record the punch and return the punch record.
      </div>
    </div>
  {/if}

  <!-- This Week -->
  {#if activeTab === 'week'}
    <div class="tab-panel">
      <div class="week-header">
        <span class="week-range mono muted">
          {formatDate(data.weekRange.from)} – {formatDate(data.weekRange.to)}
        </span>
        <span class="week-note">Alternate Saturdays visible for Assembly team</span>
      </div>

      <div class="week-strip">
        {#each weekDays as day (day.date)}
          <div class="day-cell" class:today={isToday(day.date)} class:off={day.status === 'WEEKLY_OFF'}>
            <div class="day-weekday">{dayLabel(day.date)}</div>
            <div class="day-num">{dayNum(day.date)}</div>
            <div class="day-status-dot" style="background: {STATUS_COLOR[day.status] ?? 'var(--muted)'}"></div>
            <div class="day-status-label">{day.status.replace('_', ' ')}</div>
            {#if day.hours > 0}
              <div class="day-hours mono">{day.hours.toFixed(1)}h</div>
            {/if}
            {#if day.firstIn}
              <div class="day-in mono">{formatTime(day.firstIn)}</div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="demo-hint">
        <span class="hint-label">Demo beat:</span>
        Alternate-Saturday pattern: Sara (Assembly team) works 1st/3rd Saturdays. The week strip shows <code>WEEKLY_OFF</code> on 2nd/4th Saturdays vs <code>ABSENT/PRESENT</code> on working Saturdays.
      </div>
    </div>
  {/if}

  <!-- Regularization -->
  {#if activeTab === 'regularize'}
    <div class="tab-panel">
      <!-- My regularizations list -->
      <div class="section-label">My Regularization Requests</div>

      {#if myRegs.length === 0}
        <div class="empty-state">No regularization requests yet.</div>
      {:else}
        <div class="reg-list">
          {#each myRegs as reg (reg.id)}
            <div class="reg-card">
              <div class="reg-info">
                <div class="reg-date">{formatDate(reg.date)}</div>
                <div class="reg-times">
                  {#if reg.requestedIn}In: <span class="mono">{formatDateTime(reg.requestedIn)}</span>{/if}
                  {#if reg.requestedOut} · Out: <span class="mono">{formatDateTime(reg.requestedOut)}</span>{/if}
                </div>
                <div class="reg-reason">{reg.reason}</div>
              </div>
              <StatusBadge status={reg.status} />
            </div>
          {/each}
        </div>
      {/if}

      <!-- Request regularization form -->
      <div class="section-label" style="margin-top: 24px;">Request Regularization</div>

      {#if regSuccess}
        <div class="success-banner">Regularization request submitted.</div>
      {/if}
      <ErrorBanner error={regError} onDismiss={() => { regError = null; }} />

      <form
        method="POST"
        action="?/regularize"
        class="reg-form"
        use:enhance={() => {
          regSubmitting = true;
          regError = null;
          regSuccess = false;
          return async ({ update }) => { await update(); regSubmitting = false; };
        }}
      >
        <div class="form-row two-col">
          <div class="form-field">
            <label class="form-label" for="reg-date">Date</label>
            <input type="date" id="reg-date" name="date" class="form-input" required />
          </div>
        </div>
        <div class="form-row two-col">
          <div class="form-field">
            <label class="form-label" for="reg-in">Punch-In Time</label>
            <input type="time" id="reg-in" name="requestedIn" class="form-input" />
          </div>
          <div class="form-field">
            <label class="form-label" for="reg-out">Punch-Out Time</label>
            <input type="time" id="reg-out" name="requestedOut" class="form-input" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="form-label" for="reg-reason">Reason</label>
            <textarea id="reg-reason" name="reason" class="form-textarea" rows="2" placeholder="e.g. Badge reader offline…" required></textarea>
          </div>
        </div>
        <button type="submit" class="action-btn primary" disabled={regSubmitting}>
          {regSubmitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  {/if}

  <!-- Regularization Approval Queue (MANAGER+) -->
  {#if activeTab === 'reg-queue' && isManager}
    <div class="tab-panel">
      <ErrorBanner error={regDecisionError} onDismiss={() => { regDecisionError = null; }} />
      {#if regDecisionSuccess}
        <div class="success-banner">{regDecisionSuccess} successfully.</div>
      {/if}

      {#if pendingRegQueue.length === 0}
        <div class="empty-state">No pending regularization requests.</div>
      {:else}
        <div class="reg-list">
          {#each pendingRegQueue as reg (reg.id)}
            <div class="reg-card approval">
              <div class="reg-info">
                <div class="reg-employee mono">{reg.userId.slice(0, 8)}…</div>
                <div class="reg-date">{formatDate(reg.date)}</div>
                <div class="reg-times">
                  {#if reg.requestedIn}In: <span class="mono">{formatDateTime(reg.requestedIn)}</span>{/if}
                  {#if reg.requestedOut} · Out: <span class="mono">{formatDateTime(reg.requestedOut)}</span>{/if}
                </div>
                <div class="reg-reason">{reg.reason}</div>
              </div>
              <div class="approval-actions">
                <form method="POST" action="?/approveReg" use:enhance={() => {
                  regDecisionError = null;
                  regDecisionSuccess = null;
                  return async ({ update }) => { await update(); };
                }}>
                  <input type="hidden" name="regId" value={reg.id} />
                  <button type="submit" class="action-btn approve-btn">✓ Approve</button>
                </form>
                <form method="POST" action="?/rejectReg" use:enhance={() => {
                  regDecisionError = null;
                  regDecisionSuccess = null;
                  return async ({ update }) => { await update(); };
                }}>
                  <input type="hidden" name="regId" value={reg.id} />
                  <button type="submit" class="action-btn reject-btn">✕ Reject</button>
                </form>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <div class="demo-hint">
        <span class="hint-label">Demo beat:</span>
        Sara's seeded regularization for <strong>2026-06-05</strong> — "Badge reader offline at factory gate — forgot to tap out" — appears here for Rohan to approve.
      </div>
    </div>
  {/if}
</div>

<style>
  .attendance-page {
    max-width: 860px;
    margin: 0 auto;
    animation: fadeInUp 0.3s ease forwards;
  }

  .page-header { margin-bottom: 28px; }
  h1 { font-size: 22px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: var(--muted); }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 24px;
    flex-wrap: wrap;
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
  .tab-btn.active { color: var(--blue); border-bottom-color: var(--blue); }
  .tab-count {
    background: rgba(210,153,34,0.15);
    color: var(--amber);
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: var(--r-pill);
  }
  .tab-count.amber { color: var(--amber); }

  .tab-panel { animation: fadeInUp 0.2s ease forwards; }

  /* Today card */
  .today-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 24px;
    margin-bottom: 16px;
  }
  .today-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .today-date-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }
  .punch-times {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }
  .punch-time-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .pt-label {
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .pt-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--text);
  }
  .pt-value.blue { color: var(--blue); }
  .pt-arrow { font-size: 14px; color: var(--border); }

  .punch-btns { display: flex; gap: 12px; align-items: center; }
  .punch-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: var(--r-md);
    font-size: 14px;
    font-weight: 600;
    border: 1px solid;
    cursor: pointer;
    transition: all var(--dur-fast) var(--ease);
  }
  .check-in-btn {
    background: rgba(63,185,80,0.1);
    color: var(--green);
    border-color: rgba(63,185,80,0.4);
  }
  .check-in-btn:hover { background: rgba(63,185,80,0.2); }
  .check-in-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .check-out-btn {
    background: rgba(248,81,73,0.1);
    color: var(--red);
    border-color: rgba(248,81,73,0.4);
  }
  .check-out-btn:hover { background: rgba(248,81,73,0.2); }
  .check-out-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .punch-dot-btn {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .punch-dot-btn.in { background: var(--green); }
  .punch-dot-btn.out { background: var(--red); }
  .day-complete {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--green);
    font-weight: 500;
  }
  .complete-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(63,185,80,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
  .off-day-state {
    text-align: center;
    padding: 20px 0;
  }
  .off-icon { font-size: 32px; margin-bottom: 8px; }
  .off-label { font-size: 14px; color: var(--muted); font-weight: 500; }

  /* Week strip */
  .week-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .week-note { font-size: 11px; color: var(--muted); }
  .week-strip {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }
  .day-cell {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 10px 6px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }
  .day-cell.today {
    border-color: var(--blue);
    background: rgba(88,166,255,0.05);
  }
  .day-cell.off {
    opacity: 0.5;
  }
  .day-weekday { font-size: 10px; color: var(--muted); text-transform: uppercase; }
  .day-num { font-size: 18px; font-weight: 700; color: var(--text); line-height: 1.2; }
  .day-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin: 2px 0;
  }
  .day-status-label { font-size: 9px; color: var(--muted); line-height: 1.2; word-break: break-word; text-align: center; }
  .day-hours { font-size: 10px; color: var(--blue); }
  .day-in { font-size: 10px; color: var(--muted); }

  /* Regularization */
  .reg-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
  .reg-card {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 14px 18px;
  }
  .reg-card.approval { align-items: center; }
  .reg-info { flex: 1; }
  .reg-employee { font-size: 11px; color: var(--muted); margin-bottom: 2px; }
  .reg-date { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .reg-times { font-size: 12px; color: var(--muted); margin-bottom: 2px; }
  .reg-reason { font-size: 12px; color: var(--muted); font-style: italic; }
  .approval-actions { display: flex; gap: 8px; flex-shrink: 0; }

  /* Reg form */
  .reg-form {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
    max-width: 480px;
    margin-bottom: 16px;
  }
  .form-row { margin-bottom: 16px; }
  .form-row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-field { display: flex; flex-direction: column; gap: 6px; }
  .form-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .form-input, .form-textarea {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 8px 10px;
    color: var(--text);
    font-size: 13px;
    font-family: var(--font-sans);
  }
  .form-input:focus, .form-textarea:focus {
    outline: none;
    border-color: var(--blue);
  }
  .form-textarea { resize: vertical; }

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

  /* Section label */
  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 12px;
  }

  /* Misc */
  .success-banner {
    background: rgba(63,185,80,0.08);
    border: 1px solid rgba(63,185,80,0.3);
    border-radius: var(--r-md);
    padding: 12px 16px;
    font-size: 13px;
    color: var(--green);
    margin-bottom: 16px;
  }
  .demo-hint {
    margin-top: 16px;
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
    color: var(--blue);
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
  .mono { font-family: var(--font-mono); }
  .muted { color: var(--muted); }
  .blue { color: var(--blue); }
</style>

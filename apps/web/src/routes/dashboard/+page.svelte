<script lang="ts">
  import type { PageData } from './$types';
  import StatusBadge from '$components/StatusBadge.svelte';

  let { data }: { data: PageData } = $props();

  // ── Leave balances with type names ─────────────────────────────────────────
  // Focus on CL/SL/EL for the primary cards; show rest in a secondary list
  const PRIMARY_TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave'];
  const LEAVE_COLORS: Record<string, string> = {
    'Casual Leave': 'var(--amber)',
    'Sick Leave': 'var(--green)',
    'Earned Leave': 'var(--blue)',
    'Maternity Leave': '#ec4899',
    'Compensatory Off': 'var(--purple)',
  };

  interface LeaveType {
    leaveTypeId: string;
    name: string;
    color: string | null;
    kind: string;
    isPaid: boolean;
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
    isApproved: string;
    workingDays: string;
    reason: string | null;
  }

  interface CompOff {
    id: string;
    workedOn: string;
    days: string;
    status: string;
  }

  interface Regularization {
    id: string;
    date: string;
    reason: string;
    status: string;
  }

  interface Holiday {
    holidayId: string;
    name: string;
    date: string;
    location: string | null;
    isRecurring: boolean;
  }

  interface AttendanceDay {
    date: string;
    status: string;
    firstIn: string | null;
    lastOut: string | null;
    hours: number;
  }

  function typeName(typeId: string): string {
    const t = (data.leaveTypes as LeaveType[]).find((lt) => lt.leaveTypeId === typeId);
    return t?.name ?? typeId.slice(0, 8);
  }

  function typeColor(typeId: string): string {
    const t = (data.leaveTypes as LeaveType[]).find((lt) => lt.leaveTypeId === typeId);
    if (!t) return 'var(--blue)';
    return LEAVE_COLORS[t.name] ?? `#${t.color ?? '58a6ff'}`;
  }

  // Combined balances with type info
  interface BalanceCard {
    name: string;
    color: string;
    entitlement: number;
    taken: number;
    available: number;
    planned: number;
  }

  let primaryBalances = $derived(
    (data.leaveTypes as LeaveType[])
      .filter((lt) => PRIMARY_TYPES.includes(lt.name))
      .map((lt): BalanceCard => {
        const bal = (data.balances as LeaveBalance[]).find(
          (b) => b.leaveTypeId === lt.leaveTypeId
        );
        return {
          name: lt.name,
          color: LEAVE_COLORS[lt.name] ?? `#${lt.color ?? '58a6ff'}`,
          entitlement: bal?.entitlement ?? 0,
          taken: bal?.taken ?? 0,
          available: bal?.available ?? 0,
          planned: bal?.planned ?? 0,
        };
      })
  );

  // Pending items
  let pendingLeaves = $derived(
    (data.leaveRequests as LeaveRequest[]).filter((l) => l.isApproved === 'PENDING')
  );
  let pendingCompOffs = $derived(
    (data.compOffs as CompOff[]).filter((c) => c.status === 'PENDING')
  );
  let pendingRegularizations = $derived(
    (data.regularizations as Regularization[]).filter((r) => r.status === 'PENDING')
  );
  let hasPending = $derived(
    pendingLeaves.length + pendingCompOffs.length + pendingRegularizations.length > 0
  );

  // Upcoming holidays (next 90 days)
  let today = new Date();
  let ninetyDaysOut = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  let upcomingHolidays = $derived(
    (data.holidays as Holiday[])
      .filter((h) => {
        const d = new Date(h.date);
        return d >= today && d <= ninetyDaysOut;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
  );

  // Today's attendance
  let todayAttendance = $derived(data.attendanceToday as AttendanceDay | null);
  let checkedIn = $derived(!!todayAttendance?.firstIn);
  let checkedOut = $derived(!!todayAttendance?.lastOut);

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  function formatTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });
  }

  function usedPct(bal: BalanceCard): number {
    if (bal.entitlement === 0) return 0;
    return Math.min(100, Math.round((bal.taken / bal.entitlement) * 100));
  }
</script>

<svelte:head>
  <title>Dashboard — Avkash</title>
</svelte:head>

<div class="dashboard">
  <!-- Header -->
  <header class="dash-header">
    <div>
      <h1>My Space</h1>
      <p class="subtitle">
        {data.user?.name ?? 'Welcome'} ·
        <span class="role-chip">{data.user?.role ?? ''}</span>
      </p>
    </div>
    <div class="header-date">
      {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
    </div>
  </header>

  <!-- Top row: Attendance today + Leave balances -->
  <section class="section">
    <div class="section-label">Today's Attendance</div>
    <div class="attendance-today-card">
      <div class="at-status-col">
        <div class="at-status-dot" class:in={checkedIn} class:out={checkedOut && !checkedIn}></div>
        <div class="at-status-text">
          {#if todayAttendance?.status === 'WEEKLY_OFF'}
            <span class="at-label muted">Weekly Off</span>
          {:else if todayAttendance?.status === 'HOLIDAY'}
            <span class="at-label muted">Holiday</span>
          {:else if checkedIn && checkedOut}
            <span class="at-label green">Checked Out</span>
          {:else if checkedIn}
            <span class="at-label green">Checked In</span>
          {:else}
            <span class="at-label muted">Not Punched</span>
          {/if}
        </div>
      </div>
      <div class="at-times">
        <div class="at-time-block">
          <span class="at-time-label">In</span>
          <span class="at-time-value mono">{formatTime(todayAttendance?.firstIn ?? null)}</span>
        </div>
        <div class="at-time-sep">→</div>
        <div class="at-time-block">
          <span class="at-time-label">Out</span>
          <span class="at-time-value mono">{formatTime(todayAttendance?.lastOut ?? null)}</span>
        </div>
      </div>
      <div class="at-hours">
        {#if todayAttendance && todayAttendance.hours > 0}
          <span class="at-hours-num">{todayAttendance.hours.toFixed(1)}</span>
          <span class="at-hours-label">hrs today</span>
        {:else}
          <span class="at-hours-label muted">—</span>
        {/if}
      </div>
      <a href="/attendance" class="at-link action-btn">View Attendance →</a>
    </div>
  </section>

  <!-- Leave balances -->
  <section class="section">
    <div class="section-label">Leave Balances</div>
    <div class="balance-grid">
      {#each primaryBalances as bal (bal.name)}
        <div class="balance-card" style="--accent: {bal.color}">
          <div class="balance-name">{bal.name}</div>
          <div class="balance-nums">
            <span class="balance-avail mono">{bal.available}</span>
            <span class="balance-sep">/</span>
            <span class="balance-total mono muted">{bal.entitlement}</span>
          </div>
          <div class="balance-meta">
            {bal.taken} used · {bal.planned > 0 ? `${bal.planned} planned` : ''}
          </div>
          <div class="balance-bar-wrap">
            <div class="balance-bar" style="width: {usedPct(bal)}%; background: {bal.color}"></div>
          </div>
        </div>
      {/each}
    </div>
    <a href="/leave?tab=apply" class="apply-leave-btn action-btn primary" style="margin-top: 12px; display: inline-flex">
      Apply Leave
    </a>
  </section>

  <!-- Pending requests + Upcoming holidays in a 2-col layout -->
  <div class="two-col">
    <!-- Pending requests -->
    <section class="section">
      <div class="section-label">Pending Requests</div>
      {#if !hasPending}
        <div class="empty-state">No pending requests</div>
      {:else}
        <div class="pending-list">
          {#each pendingLeaves as leave (leave.leaveId)}
            <div class="pending-item">
              <div class="pending-icon" style="background: {typeColor(leave.leaveTypeId)}22; color: {typeColor(leave.leaveTypeId)}">L</div>
              <div class="pending-info">
                <div class="pending-title">{typeName(leave.leaveTypeId)}</div>
                <div class="pending-dates">{formatDate(leave.startDate)} – {formatDate(leave.endDate)} · {leave.workingDays} days</div>
              </div>
              <StatusBadge status={leave.isApproved} size="sm" />
            </div>
          {/each}
          {#each pendingCompOffs as co (co.id)}
            <div class="pending-item">
              <div class="pending-icon" style="background: rgba(188,140,255,0.15); color: var(--purple)">C</div>
              <div class="pending-info">
                <div class="pending-title">Comp-off</div>
                <div class="pending-dates">Worked: {formatDate(co.workedOn)} · {co.days} day(s)</div>
              </div>
              <StatusBadge status={co.status} size="sm" />
            </div>
          {/each}
          {#each pendingRegularizations as reg (reg.id)}
            <div class="pending-item">
              <div class="pending-icon" style="background: rgba(88,166,255,0.15); color: var(--blue)">R</div>
              <div class="pending-info">
                <div class="pending-title">Regularization</div>
                <div class="pending-dates">{formatDate(reg.date)} · {reg.reason.slice(0, 40)}{reg.reason.length > 40 ? '…' : ''}</div>
              </div>
              <StatusBadge status={reg.status} size="sm" />
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Upcoming holidays -->
    <section class="section">
      <div class="section-label">Upcoming Holidays
        {#if data.locationId}
          <span class="loc-tag">{data.locationId === '4990b22b-3693-4bb5-8c22-2894d569b4a8' ? 'Coimbatore' : 'Bengaluru'}</span>
        {/if}
      </div>
      {#if upcomingHolidays.length === 0}
        <div class="empty-state">No holidays in the next 90 days</div>
      {:else}
        <div class="holiday-list">
          {#each upcomingHolidays as h (h.holidayId)}
            {@const d = new Date(h.date)}
            <div class="holiday-item">
              <div class="holiday-date">
                <span class="h-day mono">{d.getDate()}</span>
                <span class="h-mon">{d.toLocaleString('en', { month: 'short' })}</span>
              </div>
              <div class="holiday-info">
                <div class="holiday-name">{h.name}</div>
                <div class="holiday-day">{d.toLocaleString('en', { weekday: 'long' })}</div>
              </div>
              {#if h.location}
                <span class="h-scoped">location-specific</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .dashboard {
    max-width: 1040px;
    margin: 0 auto;
    animation: fadeInUp 0.3s ease forwards;
  }

  /* Header */
  .dash-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 8px;
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
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .role-chip {
    font-family: var(--font-mono);
    font-size: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    padding: 2px 6px;
    border-radius: var(--r-sm);
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .header-date {
    font-size: 12px;
    color: var(--muted);
    font-family: var(--font-mono);
    align-self: center;
  }

  /* Section */
  .section {
    margin-bottom: 28px;
  }
  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .loc-tag {
    font-size: 10px;
    background: rgba(88,166,255,0.1);
    color: var(--blue);
    padding: 1px 6px;
    border-radius: var(--r-sm);
    letter-spacing: 0;
    font-weight: 500;
    text-transform: none;
  }

  /* Attendance today */
  .attendance-today-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }
  .at-status-col {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .at-status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--border);
    flex-shrink: 0;
  }
  .at-status-dot.in  { background: var(--green); box-shadow: 0 0 6px rgba(63,185,80,0.4); }
  .at-status-dot.out { background: var(--muted); }
  .at-label {
    font-size: 13px;
    font-weight: 500;
  }
  .at-label.green { color: var(--green); }
  .at-label.muted { color: var(--muted); }
  .at-times {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .at-time-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .at-time-label {
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .at-time-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
  }
  .at-time-sep {
    font-size: 12px;
    color: var(--border);
  }
  .at-hours {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .at-hours-num {
    font-size: 22px;
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--blue);
  }
  .at-hours-label {
    font-size: 11px;
    color: var(--muted);
  }
  .at-link {
    margin-left: auto;
  }

  /* Balance grid */
  .balance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
  .balance-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-top: 3px solid var(--accent, var(--blue));
    border-radius: 10px;
    padding: 16px 18px;
  }
  .balance-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .balance-nums {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 4px;
  }
  .balance-avail {
    font-size: 28px;
    font-weight: 700;
    color: var(--accent, var(--blue));
  }
  .balance-sep {
    font-size: 14px;
    color: var(--border);
  }
  .balance-total {
    font-size: 18px;
    font-weight: 500;
  }
  .balance-meta {
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 10px;
    min-height: 16px;
  }
  .balance-bar-wrap {
    height: 3px;
    background: var(--surface2);
    border-radius: 2px;
    overflow: hidden;
  }
  .balance-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.6s ease;
  }

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
    text-decoration: none;
  }
  .action-btn:hover { background: var(--surface); border-color: var(--blue); color: var(--blue); }
  .action-btn.primary { background: var(--blue); color: #000; border-color: var(--blue); }
  .action-btn.primary:hover { background: #79b8ff; }

  /* Two-column layout */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  @media (max-width: 700px) {
    .two-col { grid-template-columns: 1fr; }
  }

  /* Pending list */
  .pending-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pending-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 10px 14px;
  }
  .pending-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--r-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .pending-info { flex: 1; min-width: 0; }
  .pending-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
  }
  .pending-dates {
    font-size: 11px;
    color: var(--muted);
    margin-top: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Holiday list */
  .holiday-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .holiday-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 10px 14px;
  }
  .holiday-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 36px;
  }
  .h-day {
    font-size: 20px;
    font-weight: 700;
    color: var(--blue);
    line-height: 1;
  }
  .h-mon {
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
  }
  .holiday-info { flex: 1; }
  .holiday-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
  }
  .holiday-day {
    font-size: 11px;
    color: var(--muted);
    margin-top: 1px;
  }
  .h-scoped {
    font-size: 10px;
    color: var(--purple);
    background: rgba(188,140,255,0.1);
    padding: 2px 6px;
    border-radius: var(--r-sm);
    white-space: nowrap;
  }

  /* Empty state */
  .empty-state {
    font-size: 13px;
    color: var(--muted);
    padding: 20px;
    text-align: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
  }

  /* Utilities */
  .mono { font-family: var(--font-mono); }
  .muted { color: var(--muted); }
  .green { color: var(--green); }

  .apply-leave-btn {
    display: inline-flex;
  }
</style>

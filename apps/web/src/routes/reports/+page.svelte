<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  interface BalanceEntry {
    userId: string; name: string;
    balances: { leaveTypeId: string; year: number; entitlement: number; balance: number; available: number; taken: number; planned: number; }[];
  }
  interface UtilizationEntry { leaveTypeId: string; name: string; taken: number; planned: number; }
  interface MusterRow {
    userId: string; name: string;
    days: { date: string; status: string; firstIn: string | null; lastOut: string | null; hours: number; }[];
  }
  interface LeaveType { leaveTypeId: string; name: string; isActive: boolean; }
  interface Team { teamId: string; name: string; }

  const balanceReport = $derived(data.balanceReport as BalanceEntry[]);
  const utilizationReport = $derived(data.utilizationReport as UtilizationEntry[]);
  const musterReport = $derived(data.musterReport as MusterRow[]);
  const teams = $derived(data.teams as Team[]);
  const leaveTypes = $derived(data.leaveTypes as LeaveType[]);

  function getLeaveTypeName(id: string): string {
    return leaveTypes.find((lt) => lt.leaveTypeId === id)?.name ?? id.slice(0, 8) + '…';
  }

  // Status color for muster cells
  function musterStatusClass(status: string): string {
    if (status === 'PRESENT') return 'ms-present';
    if (status === 'ABSENT') return 'ms-absent';
    if (status === 'WEEKLY_OFF') return 'ms-off';
    if (status === 'HOLIDAY') return 'ms-holiday';
    if (status === 'ON_LEAVE') return 'ms-leave';
    if (status === 'ON_COMP_OFF') return 'ms-leave';
    return 'ms-default';
  }

  // For balance report: collect all leave type IDs across all users for column headers
  const balanceLeaveTypeIds = $derived(() => {
    const ids = new Set<string>();
    for (const e of balanceReport) {
      for (const b of e.balances) ids.add(b.leaveTypeId);
    }
    return [...ids];
  });

  function getBalance(entry: BalanceEntry, ltId: string) {
    return entry.balances.find((b) => b.leaveTypeId === ltId);
  }

  // Derive muster date range columns (distinct dates across all rows)
  const musterDates = $derived(() => {
    const dates = new Set<string>();
    for (const row of musterReport) {
      for (const d of row.days) dates.add(d.date);
    }
    return [...dates].sort();
  });

  function getMusterDay(row: MusterRow, date: string) {
    return row.days.find((d) => d.date === date);
  }

  // Years for utilization filter
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
</script>

<div class="reports-page">
  <div class="page-header">
    <h1 class="page-title">Reports</h1>
    <p class="page-desc">Leave balance, utilization, and attendance muster for your org.</p>
  </div>

  <!-- Report type tabs + filters -->
  <form class="filter-bar" method="get" action="/reports">
    <div class="report-tabs">
      <a
        href="/reports?report=balance{data.teamId ? `&teamId=${data.teamId}` : ''}"
        class="report-tab" class:tab--active={data.report === 'balance'}
      >Leave Balance</a>
      <a
        href="/reports?report=utilization{data.teamId ? `&teamId=${data.teamId}` : ''}&year={data.year}"
        class="report-tab" class:tab--active={data.report === 'utilization'}
      >Leave Utilization</a>
      <a
        href="/reports?report=muster{data.teamId ? `&teamId=${data.teamId}` : ''}&from={data.fromDate}&to={data.toDate}"
        class="report-tab" class:tab--active={data.report === 'muster'}
      >Attendance Muster</a>
    </div>

    <input type="hidden" name="report" value={data.report} />

    <div class="filter-row">
      <div class="filter-field">
        <label class="filter-label" for="filter-team">Team</label>
        <select id="filter-team" class="filter-select" name="teamId" onchange={(e) => (e.target as HTMLSelectElement).form!.submit()}>
          <option value="">All teams</option>
          {#each teams as t (t.teamId)}
            <option value={t.teamId} selected={data.teamId === t.teamId}>{t.name}</option>
          {/each}
        </select>
      </div>

      {#if data.report === 'utilization'}
        <div class="filter-field">
          <label class="filter-label" for="filter-year">Year</label>
          <select id="filter-year" class="filter-select" name="year" onchange={(e) => (e.target as HTMLSelectElement).form!.submit()}>
            {#each years as y (y)}
              <option value={y} selected={String(data.year) === String(y)}>{y}</option>
            {/each}
          </select>
        </div>
      {/if}

      {#if data.report === 'muster'}
        <div class="filter-field">
          <label class="filter-label" for="filter-from">From</label>
          <input id="filter-from" class="filter-input" type="date" name="from" value={data.fromDate} />
        </div>
        <div class="filter-field">
          <label class="filter-label" for="filter-to">To</label>
          <input id="filter-to" class="filter-input" type="date" name="to" value={data.toDate} />
        </div>
        <button type="submit" class="filter-btn">Apply</button>
      {/if}
    </div>
  </form>

  <!-- Leave Balance Report -->
  {#if data.report === 'balance'}
    <div class="report-section">
      <h2 class="section-title">Leave Balance {data.teamId ? `— ${teams.find((t) => t.teamId === data.teamId)?.name ?? ''}` : '— All Teams'}</h2>
      {#if balanceReport.length === 0}
        <p class="empty-msg">No data available.</p>
      {:else}
        <div class="table-wrapper">
          <table class="report-table">
            <thead>
              <tr>
                <th class="col-name">Employee</th>
                {#each balanceLeaveTypeIds() as ltId (ltId)}
                  <th class="col-lt" colspan="3">
                    <div class="lt-header">{getLeaveTypeName(ltId)}</div>
                    <div class="lt-sub-row">
                      <span>Entl.</span><span>Avail.</span><span>Taken</span>
                    </div>
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each balanceReport as entry (entry.userId)}
                <tr>
                  <td class="cell-name">{entry.name}</td>
                  {#each balanceLeaveTypeIds() as ltId (ltId)}
                    {@const b = getBalance(entry, ltId)}
                    <td class="cell-num">{b?.entitlement ?? 0}</td>
                    <td class="cell-num" class:cell-negative={b && b.available < 0}>{b?.available ?? 0}</td>
                    <td class="cell-num">{b?.taken ?? 0}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <p class="table-note">
          Field-group discipline: only fields present in the API response are shown.
          User IDs are resolved to names via the /reports/leave-balance response.
        </p>
      {/if}
    </div>
  {/if}

  <!-- Leave Utilization Report -->
  {#if data.report === 'utilization'}
    <div class="report-section">
      <h2 class="section-title">Leave Utilization — {data.year}</h2>
      {#if utilizationReport.length === 0}
        <p class="empty-msg">No utilization data for {data.year}.</p>
      {:else}
        <div class="util-cards">
          {#each utilizationReport as u (u.leaveTypeId)}
            {@const total = u.taken + u.planned}
            <div class="util-card">
              <div class="util-name">{u.name}</div>
              <div class="util-numbers">
                <span class="util-taken">{u.taken} taken</span>
                <span class="util-planned">{u.planned} planned</span>
              </div>
              {#if total > 0}
                <div class="util-bar-bg">
                  <div class="util-bar-taken" style="width: {total > 0 ? Math.round((u.taken / total) * 100) : 0}%"></div>
                  <div class="util-bar-planned" style="width: {total > 0 ? Math.round((u.planned / total) * 100) : 0}%"></div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Attendance Muster -->
  {#if data.report === 'muster'}
    <div class="report-section">
      <h2 class="section-title">
        Attendance Muster
        {#if data.teamId}
          — {teams.find((t) => t.teamId === data.teamId)?.name}
        {:else}
          — Select a team
        {/if}
      </h2>
      {#if data.musterError}
        <div class="error-msg">{data.musterError}</div>
      {:else if musterReport.length === 0}
        <p class="empty-msg">No data for the selected range.</p>
      {:else}
        <div class="table-wrapper">
          <table class="muster-table">
            <thead>
              <tr>
                <th class="muster-name-col">Employee</th>
                {#each musterDates() as date (date)}
                  <th class="muster-date-col">{date.slice(5)}</th>
                {/each}
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {#each musterReport as row (row.userId)}
                {@const totalHours = row.days.reduce((sum, d) => sum + d.hours, 0)}
                <tr>
                  <td class="muster-name">{row.name}</td>
                  {#each musterDates() as date (date)}
                    {@const day = getMusterDay(row, date)}
                    <td class="muster-cell {musterStatusClass(day?.status ?? '')}">
                      {day?.status?.slice(0, 2) ?? '?'}
                    </td>
                  {/each}
                  <td class="muster-hours">{totalHours.toFixed(1)}h</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="muster-legend">
          <span class="ms-legend ms-present">PR</span><span>Present</span>
          <span class="ms-legend ms-absent">AB</span><span>Absent</span>
          <span class="ms-legend ms-off">WO</span><span>Weekly Off</span>
          <span class="ms-legend ms-holiday">HO</span><span>Holiday</span>
          <span class="ms-legend ms-leave">OL</span><span>On Leave</span>
        </div>
        <p class="table-note">
          Muster requires teamId + date range. The response shape includes day-level status, firstIn/lastOut, and hours.
          Field-group discipline: only fields in the API muster response are rendered (no compensation/identity columns in attendance context).
        </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .reports-page { animation: fadeInUp 0.2s ease forwards; }
  .page-header { margin-bottom: 20px; }
  .page-title { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .page-desc { font-size: 13px; color: var(--muted); }

  /* Filter bar */
  .filter-bar { margin-bottom: 24px; }
  .report-tabs {
    display: flex; gap: 2px; border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
  }
  .report-tab {
    background: transparent; color: var(--muted);
    font-size: 13px; padding: 8px 16px;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s; text-decoration: none;
    display: inline-block;
  }
  .report-tab:hover { color: var(--text); }
  .tab--active { color: var(--blue) !important; border-bottom-color: var(--blue) !important; font-weight: 600; }

  .filter-row { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
  .filter-field { display: flex; flex-direction: column; gap: 5px; }
  .filter-label {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--muted);
  }
  .filter-select, .filter-input {
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); font-size: 12px; padding: 6px 10px;
    border-radius: var(--r-sm); outline: none; min-width: 140px;
    transition: border-color 0.15s;
  }
  .filter-select:focus, .filter-input:focus { border-color: var(--blue); }
  .filter-btn {
    background: var(--blue); color: #000; font-size: 12px; font-weight: 600;
    border: none; padding: 7px 14px; border-radius: var(--r-sm); cursor: pointer;
  }
  .filter-btn:hover { opacity: 0.85; }

  /* Report section */
  .report-section {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 24px;
  }
  .section-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 16px; }
  .empty-msg { font-size: 13px; color: var(--muted); }
  .error-msg {
    font-size: 13px; color: var(--amber);
    background: rgba(210,153,34,0.08); border: 1px solid rgba(210,153,34,0.25);
    padding: 10px 14px; border-radius: var(--r-sm);
  }

  /* Balance table */
  .table-wrapper { overflow-x: auto; border: 1px solid var(--border); border-radius: 6px; }
  .report-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .report-table th {
    background: var(--surface2); padding: 8px 10px;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--muted);
    border-bottom: 1px solid var(--border); text-align: center;
  }
  .col-name { text-align: left !important; min-width: 140px; }
  .lt-header { font-size: 10px; margin-bottom: 4px; }
  .lt-sub-row {
    display: flex; gap: 4px; justify-content: center; font-size: 9px; color: var(--muted);
  }
  .lt-sub-row span { width: 30px; text-align: center; }
  .report-table td {
    padding: 8px 10px; border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }
  .report-table tr:last-child td { border-bottom: none; }
  .cell-name { color: var(--text); font-weight: 500; }
  .cell-num { text-align: center; color: var(--muted); font-family: var(--font-mono); font-size: 11px; }
  .cell-negative { color: var(--red) !important; }
  .table-note { font-size: 11px; color: var(--muted); margin-top: 10px; line-height: 1.5; }

  /* Utilization cards */
  .util-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
  .util-card {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 6px; padding: 14px 16px;
  }
  .util-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
  .util-numbers { display: flex; gap: 12px; font-size: 12px; margin-bottom: 8px; }
  .util-taken { color: var(--blue); }
  .util-planned { color: var(--amber); }
  .util-bar-bg {
    height: 4px; background: var(--surface); border-radius: 2px;
    display: flex; overflow: hidden;
  }
  .util-bar-taken { height: 4px; background: var(--blue); }
  .util-bar-planned { height: 4px; background: var(--amber); }

  /* Muster table */
  .muster-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .muster-table th {
    background: var(--surface2); padding: 6px 8px;
    font-size: 9px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--muted);
    border-bottom: 1px solid var(--border); text-align: center;
    white-space: nowrap;
  }
  .muster-name-col { text-align: left !important; min-width: 100px; }
  .muster-date-col { min-width: 32px; }
  .muster-table td { padding: 6px 8px; border-bottom: 1px solid var(--border); text-align: center; }
  .muster-table tr:last-child td { border-bottom: none; }
  .muster-name { text-align: left !important; font-weight: 500; color: var(--text); font-size: 12px; }
  .muster-hours { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }

  /* Muster cell statuses */
  .muster-cell {
    font-family: var(--font-mono); font-size: 9px; font-weight: 700; border-radius: 3px;
  }
  .ms-present { background: rgba(63,185,80,0.15); color: var(--green); }
  .ms-absent { background: rgba(248,81,73,0.12); color: var(--red); }
  .ms-off { background: var(--surface2); color: var(--muted); }
  .ms-holiday { background: rgba(188,140,255,0.15); color: var(--purple); }
  .ms-leave { background: rgba(88,166,255,0.15); color: var(--blue); }
  .ms-default { color: var(--muted); }

  .muster-legend {
    display: flex; gap: 10px; align-items: center; margin-top: 12px;
    flex-wrap: wrap; font-size: 11px; color: var(--muted);
  }
  .ms-legend {
    font-family: var(--font-mono); font-size: 9px; font-weight: 700;
    padding: 1px 4px; border-radius: 3px;
  }
</style>

<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

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
  }

  interface Team {
    teamId: string;
    name: string;
  }

  interface Location {
    id: string;
    name: string;
  }

  const employees = $derived(data.employees as UserRow[]);
  const teams = $derived(data.teams as Team[]);
  const locations = $derived(data.locations as Location[]);

  function getTeamName(teamId: string | null): string {
    if (!teamId) return '—';
    return teams.find((t) => t.teamId === teamId)?.name ?? teamId.slice(0, 8) + '…';
  }

  function getLocationName(locationId: string | null): string {
    if (!locationId) return '—';
    return locations.find((l) => l.id === locationId)?.name ?? locationId.slice(0, 8) + '…';
  }

  function roleClass(role: string): string {
    if (role === 'ADMIN' || role === 'OWNER') return 'role-admin';
    if (role === 'MANAGER') return 'role-manager';
    return 'role-user';
  }

  // Local mutable state for filter inputs — capturing the INITIAL value from the
  // load data is intentional (controlled inputs seeded from URL params).
  // svelte-ignore state_referenced_locally
  let searchVal = $state<string>(data.search ?? '');
  // svelte-ignore state_referenced_locally
  let teamFilterVal = $state<string>(data.teamFilter ?? '');
</script>

<div class="employees-page">
  <div class="page-header">
    <div class="header-left">
      <h1 class="page-title">Employee Directory</h1>
      <span class="count-badge">
        {data.totalVisible} visible
        {#if data.fgaCount !== data.totalVisible}
          <span class="fga-note">(FGA-filtered: {data.fgaCount})</span>
        {/if}
      </span>
    </div>
    <div class="header-right">
      {#if data.user.role !== 'MANAGER' && data.user.role !== 'ADMIN' && data.user.role !== 'OWNER'}
        <div class="access-note">
          <span class="lock-icon">🔒</span>
          Directory filtered by role — viewing own profile only
        </div>
      {:else}
        <div class="access-note access-note--ok">
          FGA-filtered: {data.fgaCount} of all org members visible to your role
        </div>
      {/if}
    </div>
  </div>

  <!-- Filters -->
  <form class="filter-bar" method="get" action="/employees">
    <input
      class="filter-input"
      type="text"
      name="search"
      placeholder="Search by name or email…"
      value={searchVal}
      oninput={(e) => { searchVal = (e.target as HTMLInputElement).value; }}
    />
    <select
      class="filter-select"
      name="teamId"
      value={teamFilterVal}
      onchange={(e) => { teamFilterVal = (e.target as HTMLSelectElement).value; }}
    >
      <option value="">All teams</option>
      {#each teams as team (team.teamId)}
        <option value={team.teamId}>{team.name}</option>
      {/each}
    </select>
    <button type="submit" class="filter-btn">Filter</button>
    {#if data.search || data.teamFilter}
      <a href="/employees" class="filter-clear">Clear</a>
    {/if}
  </form>

  {#if employees.length === 0}
    <div class="empty-state">
      {#if data.fgaCount === 0 && (data.user.role === 'MANAGER' || data.user.role === 'ADMIN')}
        <div class="empty-icon">🔒</div>
        <p class="empty-title">No employees accessible</p>
        <p class="empty-desc">
          FGA found no employees under your management chain.
        </p>
      {:else}
        <div class="empty-icon">🔍</div>
        <p class="empty-title">No results</p>
        <p class="empty-desc">Try adjusting the search or team filter.</p>
      {/if}
    </div>
  {:else}
    <div class="employee-grid">
      {#each employees as emp (emp.id)}
        <a href="/employees/{emp.id}" class="employee-card">
          <div class="emp-avatar">
            {emp.name.slice(0, 2).toUpperCase()}
          </div>
          <div class="emp-body">
            <div class="emp-top">
              <span class="emp-name">{emp.name}</span>
              <span class="emp-role {roleClass(emp.role)}">{emp.role}</span>
            </div>
            <div class="emp-email">{emp.email}</div>
            <div class="emp-meta">
              <span class="emp-team">
                <span class="meta-label">Team</span>
                {getTeamName(emp.teamId)}
              </span>
              {#if emp.locationId}
                <span class="emp-loc">
                  <span class="meta-label">Loc</span>
                  {getLocationName(emp.locationId)}
                </span>
              {/if}
              {#if emp.joinedOn}
                <span class="emp-joined">
                  <span class="meta-label">Joined</span>
                  {emp.joinedOn}
                </span>
              {/if}
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .employees-page { animation: fadeInUp 0.2s ease forwards; }

  /* Header */
  .page-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 20px; gap: 16px; flex-wrap: wrap;
  }
  .header-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .page-title { font-size: 20px; font-weight: 600; color: var(--text); }
  .count-badge {
    font-size: 12px; font-family: var(--font-mono);
    background: var(--surface2); border: 1px solid var(--border);
    padding: 2px 8px; border-radius: var(--r-pill); color: var(--muted);
  }
  .fga-note { color: var(--blue); margin-left: 4px; }
  .access-note {
    font-size: 12px; color: var(--muted);
    background: var(--surface2); border: 1px solid var(--border);
    padding: 5px 10px; border-radius: var(--r-sm);
    display: flex; align-items: center; gap: 6px;
  }
  .access-note--ok { border-color: rgba(63,185,80,0.3); color: var(--green); }
  .lock-icon { font-size: 14px; }

  /* Filter bar */
  .filter-bar {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px; flex-wrap: wrap;
  }
  .filter-input {
    flex: 1; min-width: 200px; max-width: 320px;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); font-size: 13px; padding: 7px 12px;
    border-radius: var(--r-sm); outline: none;
    transition: border-color 0.15s ease;
  }
  .filter-input:focus { border-color: var(--blue); }
  .filter-select {
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); font-size: 13px; padding: 7px 10px;
    border-radius: var(--r-sm); outline: none; cursor: pointer;
    transition: border-color 0.15s ease;
  }
  .filter-select:focus { border-color: var(--blue); }
  .filter-btn {
    background: var(--blue); color: #000; font-size: 12px; font-weight: 600;
    border: none; padding: 7px 14px; border-radius: var(--r-sm); cursor: pointer;
    transition: opacity 0.15s ease;
  }
  .filter-btn:hover { opacity: 0.85; }
  .filter-clear {
    font-size: 12px; color: var(--muted); border: 1px solid var(--border);
    padding: 7px 10px; border-radius: var(--r-sm);
    transition: color 0.15s ease, border-color 0.15s ease; text-decoration: none;
  }
  .filter-clear:hover { color: var(--red); border-color: var(--red); }

  /* Empty state */
  .empty-state {
    text-align: center; padding: 60px 20px;
    border: 1px dashed var(--border); border-radius: 8px;
    background: var(--surface);
  }
  .empty-icon { font-size: 32px; margin-bottom: 12px; }
  .empty-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
  .empty-desc { font-size: 13px; color: var(--muted); }

  /* Employee grid */
  .employee-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }
  .employee-card {
    display: flex; gap: 14px; align-items: flex-start;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 16px;
    text-decoration: none; color: inherit;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .employee-card:hover {
    border-color: var(--blue); background: rgba(88,166,255,0.03);
  }

  /* Avatar */
  .emp-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--surface2); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: var(--text);
    flex-shrink: 0;
  }

  /* Card body */
  .emp-body { flex: 1; min-width: 0; }
  .emp-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; }
  .emp-name { font-size: 14px; font-weight: 600; color: var(--text); }
  .emp-role {
    font-family: var(--font-mono); font-size: 9px; font-weight: 600;
    padding: 2px 6px; border-radius: var(--r-sm); text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .role-admin { background: rgba(188,140,255,0.15); color: var(--purple); }
  .role-manager { background: rgba(88,166,255,0.15); color: var(--blue); }
  .role-user { background: var(--surface2); color: var(--muted); }

  .emp-email { font-size: 11px; color: var(--muted); margin-bottom: 8px; }
  .emp-meta {
    display: flex; gap: 10px; flex-wrap: wrap; font-size: 11px; color: var(--muted);
  }
  .meta-label {
    font-size: 9px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--muted); margin-right: 3px;
    opacity: 0.6;
  }
  .emp-team, .emp-loc, .emp-joined {
    display: flex; align-items: center;
  }
</style>

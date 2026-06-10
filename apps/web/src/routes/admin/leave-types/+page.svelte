<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();

  interface LeaveType {
    leaveTypeId: string;
    name: string;
    color: string | null;
    kind: string;
    isPaid: boolean;
    isActive: boolean;
    emoji: string | null;
  }

  interface LeavePolicy {
    leavePolicyId: string;
    leaveTypeId: string;
    teamId: string;
    maxLeaves: number | null;
    unlimited: boolean;
    accruals: boolean;
    accrualFrequency: string | null;
    rollOver: boolean;
    rollOverLimit: number | null;
    rollOverExpiry: string | null;
    encashable: boolean;
    encashmentMaxDays: number | null;
    compOffExpiryDays: number | null;
    probationMaxLeaves: number | null;
    probationAccruals: boolean | null;
    isActive: boolean;
  }

  interface Team {
    teamId: string;
    name: string;
    locationId: string | null;
  }

  const leaveTypes = $derived(data.leaveTypes as LeaveType[]);
  const policies = $derived(data.policies as LeavePolicy[]);
  const teams = $derived(data.teams as Team[]);

  // Only show LEAVE-kind types in the policy matrix (not COMP_OFF which is separate)
  const leaveTypesCategorized = $derived(leaveTypes.filter((lt) => lt.isActive));

  function getPoliciesFor(teamId: string, leaveTypeId: string): LeavePolicy[] {
    return policies.filter((p) => p.teamId === teamId && p.leaveTypeId === leaveTypeId && p.isActive);
  }

  function formatCap(p: LeavePolicy): string {
    if (p.unlimited) return 'Unlimited';
    return p.maxLeaves != null ? `${p.maxLeaves}/yr` : '—';
  }

  function formatAccrual(p: LeavePolicy): string {
    if (!p.accruals) return 'No';
    return p.accrualFrequency ? `Yes (${p.accrualFrequency.toLowerCase()})` : 'Yes';
  }

</script>

<svelte:head><title>Leave Types & Policies — Admin — Avkash</title></svelte:head>

<div class="section-header">
  <h1>Leave Types &amp; Policies</h1>
  <p class="subtitle">
    CL / SL / EL / ML policy matrix — caps, accrual, rollover, encashment, and probation rules per team.
  </p>
</div>

<!-- Leave Types Overview -->
<div class="card">
  <div class="card-header">Leave Types</div>
  <table class="data-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Kind</th>
        <th>Paid</th>
        <th>Active</th>
      </tr>
    </thead>
    <tbody>
      {#each leaveTypesCategorized as lt (lt.leaveTypeId)}
        <tr>
          <td>
            {#if lt.emoji}<span class="lt-emoji">{lt.emoji}</span>{/if}
            <span class="lt-name">{lt.name}</span>
            {#if lt.color}
              <span class="lt-swatch" style="background: #{lt.color};"></span>
            {/if}
          </td>
          <td><span class="kind-badge" class:comp-off={lt.kind === 'COMP_OFF'}>{lt.kind}</span></td>
          <td>{lt.isPaid ? 'Yes' : 'No'}</td>
          <td>
            <span class:dot-active={lt.isActive} class:dot-inactive={!lt.isActive} class="status-dot">
              {lt.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
        </tr>
      {:else}
        <tr><td colspan="4" class="empty-cell">No leave types found.</td></tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- Policy Matrix per Team -->
{#each teams as team (team.teamId)}
  {@const teamPolicies = policies.filter((p) => p.teamId === team.teamId && p.isActive)}
  {#if teamPolicies.length > 0}
    <div class="card" style="margin-top: 24px;">
      <div class="card-header">
        {team.name}
        <span class="team-badge">team</span>
      </div>

      <table class="data-table policy-table">
        <thead>
          <tr>
            <th>Leave Type</th>
            <th>Cap</th>
            <th>Accrues</th>
            <th>Carry-forward</th>
            <th>Encashable</th>
            <th>Probation</th>
          </tr>
        </thead>
        <tbody>
          {#each leaveTypesCategorized as lt (lt.leaveTypeId)}
            {@const pol = getPoliciesFor(team.teamId, lt.leaveTypeId)[0]}
            {#if pol}
              <tr>
                <td>
                  {#if lt.emoji}<span class="lt-emoji">{lt.emoji}</span>{/if}
                  {lt.name}
                </td>
                <td class="mono">{formatCap(pol)}</td>
                <td>{formatAccrual(pol)}</td>
                <td>
                  {#if pol.rollOver}
                    <span class="rollover-detail">
                      {#if pol.rollOverLimit != null}up to {pol.rollOverLimit}{/if}
                      {#if pol.rollOverExpiry}
                        <span class="rollover-expiry">, expires {pol.rollOverExpiry}</span>
                      {/if}
                    </span>
                  {:else}
                    <span class="muted">No</span>
                  {/if}
                </td>
                <td>
                  {#if pol.encashable}
                    {#if pol.encashmentMaxDays != null}
                      Yes (max {pol.encashmentMaxDays}d)
                    {:else}
                      Yes
                    {/if}
                  {:else if pol.compOffExpiryDays != null}
                    <span class="comp-expiry">Expires in {pol.compOffExpiryDays}d</span>
                  {:else}
                    <span class="muted">No</span>
                  {/if}
                </td>
                <td class="probation-cell">
                  {#if pol.probationAccruals === false}
                    <span class="probation-no">No accrual</span>
                  {:else if pol.probationMaxLeaves != null}
                    <span class="probation-cap">Cap {pol.probationMaxLeaves}</span>
                  {:else}
                    <span class="muted">—</span>
                  {/if}
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>

      <!-- India FY note if any EL policy with 03/31 rollover -->
      {#each teamPolicies as p}
        {#if p.rollOverExpiry === '03/31'}
          <div class="fy-note">
            EL carry-forward reckon date is <strong>03/31</strong> — Indian financial year boundary (April–March).
          </div>
        {/if}
      {/each}
    </div>
  {/if}
{/each}

{#if teams.length === 0}
  <div class="empty-state">No teams found. Create teams first to attach leave policies.</div>
{/if}

<style>
  h1 { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: var(--muted); margin-bottom: 24px; }
  .section-header { margin-bottom: 20px; }

  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-md); overflow: hidden;
  }
  .card-header {
    padding: 12px 18px; font-size: 13px; font-weight: 600; color: var(--text);
    background: var(--surface2); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 8px;
  }
  .team-badge {
    font-size: 10px; color: var(--muted); background: var(--surface);
    border: 1px solid var(--border); padding: 1px 6px; border-radius: 9999px;
    text-transform: uppercase; letter-spacing: 0.04em;
  }

  /* Table */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table th {
    text-align: left; padding: 9px 18px; font-size: 11px; font-weight: 600;
    color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em;
    border-bottom: 1px solid var(--border);
  }
  .data-table td {
    padding: 10px 18px; border-bottom: 1px solid rgba(48,54,61,0.5);
    color: var(--text); vertical-align: middle;
  }
  .data-table tr:last-child td { border-bottom: none; }

  /* Leave type cells */
  .lt-emoji { margin-right: 4px; }
  .lt-name { font-weight: 500; }
  .lt-swatch {
    display: inline-block; width: 10px; height: 10px;
    border-radius: 50%; margin-left: 6px; vertical-align: middle;
  }
  .kind-badge {
    font-size: 10px; padding: 2px 6px; border-radius: 9999px;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--muted); text-transform: uppercase;
  }
  .kind-badge.comp-off { color: var(--purple); border-color: var(--purple); background: rgba(188,140,255,0.06); }

  .dot-active { color: var(--green); }
  .dot-inactive { color: var(--red); }

  /* Policy table */
  .policy-table .rollover-detail { color: var(--text); }
  .rollover-expiry { color: var(--amber); font-weight: 600; }
  .comp-expiry { color: var(--amber); font-size: 12px; }
  .probation-no { color: var(--red); font-size: 12px; }
  .probation-cap { color: var(--amber); font-size: 12px; }
  .muted { color: var(--muted); }
  .mono { font-family: var(--font-mono); }

  /* India FY note */
  .fy-note {
    padding: 10px 18px; font-size: 12px; color: var(--muted);
    background: rgba(210,153,34,0.04); border-top: 1px solid var(--border);
  }
  .fy-note strong { color: var(--amber); }

  .empty-cell { text-align: center; color: var(--muted); padding: 24px; }
  .empty-state {
    padding: 32px; text-align: center; color: var(--muted); font-size: 13px;
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-md);
    margin-top: 16px;
  }
</style>

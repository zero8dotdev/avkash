<script lang="ts">
  import type { PageData } from './$types';
  import StatusBadge from '$components/StatusBadge.svelte';

  let { data }: { data: PageData } = $props();

  interface CompOff {
    id: string;
    userId: string;
    leaveTypeId: string;
    workedOn: string;
    days: string;
    status: string;
    expiresOn: string | null;
    approvedBy: string | null;
    createdAt: string;
  }

  let compOffs = $derived(data.compOffs as CompOff[]);

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<svelte:head><title>Comp-off — Avkash</title></svelte:head>

<div class="page">
  <header class="page-header">
    <h1>Comp-off</h1>
    <p class="subtitle">Compensatory leave credits for working on off days</p>
  </header>

  {#if compOffs.length === 0}
    <div class="empty-state">No comp-off records.</div>
  {:else}
    <div class="co-list">
      {#each compOffs as co (co.id)}
        <div class="co-card">
          <div class="co-info">
            <div class="co-date">Worked on: {formatDate(co.workedOn)}</div>
            <div class="co-days mono">{co.days} day(s)</div>
            {#if co.expiresOn}<div class="co-expiry muted">Expires: {formatDate(co.expiresOn)}</div>{/if}
          </div>
          <StatusBadge status={co.status} />
        </div>
      {/each}
    </div>
  {/if}

  <div class="stub-note">
    Full comp-off management (request, approve, redeem) is coming in W2.
    Demo beat: Sara has 1.00 day PENDING for working 2026-06-07.
  </div>
</div>

<style>
  .page { max-width: 700px; margin: 0 auto; animation: fadeInUp 0.3s ease forwards; }
  .page-header { margin-bottom: 28px; }
  h1 { font-size: 22px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: var(--muted); }
  .co-list { display: flex; flex-direction: column; gap: 8px; }
  .co-card {
    display: flex; align-items: center; gap: 16px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 14px 18px;
  }
  .co-info { flex: 1; }
  .co-date { font-size: 13px; font-weight: 600; color: var(--text); }
  .co-days { font-size: 13px; color: var(--blue); }
  .co-expiry { font-size: 11px; color: var(--muted); }
  .mono { font-family: var(--font-mono); }
  .muted { color: var(--muted); }
  .empty-state {
    font-size: 13px; color: var(--muted); padding: 24px; text-align: center;
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  }
  .stub-note {
    margin-top: 24px; padding: 12px 16px;
    background: rgba(88,166,255,0.04); border: 1px dashed var(--border);
    border-radius: 8px; font-size: 12px; color: var(--muted);
  }
</style>

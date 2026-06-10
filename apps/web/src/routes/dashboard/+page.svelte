<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Dashboard — Avkash</title>
</svelte:head>

<div class="dashboard">
  <header class="dash-header">
    <h1>Dashboard</h1>
    <p class="subtitle">Welcome back, {data.user?.name ?? 'there'}.</p>
  </header>

  <div class="placeholder-grid">
    {#each ['Leave Balances', 'Attendance Today', 'Pending Approvals', 'Team Overview'] as card (card)}
      <div class="placeholder-card">
        <span class="card-label">{card}</span>
        <span class="card-soon">Coming in W1</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .dashboard {
    max-width: 960px;
    margin: 0 auto;
    animation: fadeInUp 0.3s ease forwards;
  }

  .dash-header {
    margin-bottom: 32px;
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

  .placeholder-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  .placeholder-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .card-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
  }
  .card-soon {
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--muted);
    opacity: 0.6;
  }
</style>

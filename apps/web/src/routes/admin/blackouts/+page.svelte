<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import ErrorBanner from '$components/ErrorBanner.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  interface LeaveBlackout {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    leaveTypeId: string | null;
    locationId: string | null;
    isActive: boolean;
    createdAt: string;
  }

  interface Location {
    id: string;
    name: string;
    isActive: boolean;
  }

  interface LeaveType {
    leaveTypeId: string;
    name: string;
    kind: string;
    isActive: boolean;
  }

  const blackouts = $derived(data.blackouts as LeaveBlackout[]);
  const locations = $derived(data.locations as Location[]);
  const leaveTypes = $derived((data.leaveTypes as LeaveType[]).filter((lt) => lt.isActive && lt.kind === 'LEAVE'));

  let showCreateForm = $state(false);

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function getLocationName(id: string | null): string {
    if (!id) return 'All locations';
    return locations.find((l) => l.id === id)?.name ?? id.slice(0, 8) + '…';
  }

  function getLeaveTypeName(id: string | null): string {
    if (!id) return 'All leave types';
    return leaveTypes.find((lt) => lt.leaveTypeId === id)?.name ?? id.slice(0, 8) + '…';
  }

  // Auto-close form on success
  $effect(() => {
    if (form && 'createSuccess' in form && form.createSuccess) {
      showCreateForm = false;
    }
  });
</script>

<svelte:head><title>Blackouts — Admin — Avkash</title></svelte:head>

<div class="section-header">
  <div class="section-row">
    <div>
      <h1>Blackout Periods</h1>
      <p class="subtitle">
        Date windows during which leave applications are blocked at submission.
        Scope to a location or leave type to enforce quarter-end, peak-season, or compliance freezes.
      </p>
    </div>
    <button class="btn-new" onclick={() => { showCreateForm = !showCreateForm; }}>
      {showCreateForm ? 'Cancel' : '+ New Blackout'}
    </button>
  </div>
</div>

<!-- Create form -->
{#if showCreateForm}
  <div class="create-card">
    <div class="create-title">Create Blackout Period</div>

    {#if form && 'createError' in form && form.createError}
      <ErrorBanner error={form.createError} />
    {/if}

    <form method="POST" action="?/create" use:enhance>
      <div class="form-grid">
        <div class="field full">
          <label for="bl-name">Name</label>
          <input
            id="bl-name" name="name" type="text"
            placeholder="e.g. Q3 FY2027 Quarter-End Freeze"
            required
          />
        </div>

        <div class="field">
          <label for="bl-start">Start Date</label>
          <input id="bl-start" name="startDate" type="date" required />
        </div>

        <div class="field">
          <label for="bl-end">End Date</label>
          <input id="bl-end" name="endDate" type="date" required />
        </div>

        <div class="field">
          <label for="bl-location">Location (optional)</label>
          <select id="bl-location" name="locationId">
            <option value="">All locations</option>
            {#each locations as loc (loc.id)}
              <option value={loc.id}>{loc.name}</option>
            {/each}
          </select>
          <span class="field-hint">Leave blank to block org-wide</span>
        </div>

        <div class="field">
          <label for="bl-type">Leave Type (optional)</label>
          <select id="bl-type" name="leaveTypeId">
            <option value="">All leave types</option>
            {#each leaveTypes as lt (lt.leaveTypeId)}
              <option value={lt.leaveTypeId}>{lt.name}</option>
            {/each}
          </select>
          <span class="field-hint">Leave blank to block all types</span>
        </div>
      </div>

      <button type="submit" class="btn-primary">Create Blackout</button>
    </form>
  </div>
{/if}

{#if form && 'createSuccess' in form && form.createSuccess}
  <div class="success-banner">Blackout period created successfully.</div>
{/if}

{#if form && 'deleteSuccess' in form && form.deleteSuccess}
  <div class="success-banner">Blackout deleted.</div>
{/if}

<!-- Blackout list -->
{#if blackouts.length === 0}
  <div class="empty-state">No blackout periods configured.</div>
{:else}
  <div class="blackout-list">
    {#each blackouts as b (b.id)}
      {#if b.isActive}
        <div class="blackout-card">
          <div class="blackout-info">
            <div class="blackout-name">{b.name}</div>
            <div class="blackout-dates mono">
              {formatDate(b.startDate)} → {formatDate(b.endDate)}
            </div>
            <div class="blackout-scope">
              <span class="scope-chip">{getLocationName(b.locationId)}</span>
              <span class="scope-sep">·</span>
              <span class="scope-chip">{getLeaveTypeName(b.leaveTypeId)}</span>
            </div>
          </div>
          <div class="blackout-actions">
            <form method="POST" action="?/delete" use:enhance>
              <input type="hidden" name="id" value={b.id} />
              <button
                type="submit"
                class="btn-delete"
                onclick={(e) => {
                  if (!confirm('Delete this blackout period?')) e.preventDefault();
                }}
              >Delete</button>
            </form>
          </div>
        </div>
      {/if}
    {/each}
  </div>
{/if}

<style>
  h1 { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: var(--muted); margin-bottom: 16px; line-height: 1.6; max-width: 560px; }
  .section-header { margin-bottom: 16px; }
  .section-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }

  /* Create form */
  .create-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-md); padding: 20px 24px; margin-bottom: 20px;
    animation: fadeInUp 0.2s ease forwards;
  }
  .create-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 16px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .field.full { grid-column: 1 / -1; }
  label { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  input, select {
    background: var(--surface2); border: 1px solid var(--border); color: var(--text);
    border-radius: var(--r-sm); padding: 8px 10px; font-size: 13px;
    font-family: inherit; transition: border-color var(--dur-fast) var(--ease);
  }
  input:focus, select:focus { outline: none; border-color: var(--blue); }
  .field-hint { font-size: 11px; color: var(--muted); }

  /* Blackout list */
  .blackout-list { display: flex; flex-direction: column; gap: 8px; }
  .blackout-card {
    display: flex; align-items: center; gap: 16px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-md); padding: 14px 18px;
  }
  .blackout-info { flex: 1; }
  .blackout-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
  .blackout-dates { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
  .blackout-scope { display: flex; align-items: center; gap: 6px; }
  .scope-chip {
    font-size: 11px; padding: 2px 8px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 9999px; color: var(--muted);
  }
  .scope-sep { color: var(--border); }

  /* Buttons */
  .btn-new {
    background: var(--blue); color: #000; border: none;
    padding: 7px 16px; border-radius: var(--r-sm);
    font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;
    transition: opacity var(--dur-fast) var(--ease);
  }
  .btn-new:hover { opacity: 0.85; }
  .btn-primary {
    background: var(--blue); color: #000; border: none;
    padding: 8px 18px; border-radius: var(--r-sm);
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: opacity var(--dur-fast) var(--ease);
  }
  .btn-primary:hover { opacity: 0.85; }
  .btn-delete {
    background: rgba(248,81,73,0.08); color: var(--red);
    border: 1px solid var(--red); padding: 5px 12px;
    border-radius: var(--r-sm); font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all var(--dur-fast) var(--ease);
  }
  .btn-delete:hover { background: rgba(248,81,73,0.16); }

  /* Misc */
  .mono { font-family: var(--font-mono); }
  .success-banner {
    background: rgba(63,185,80,0.06); border: 1px solid var(--green);
    border-radius: var(--r-md); padding: 12px 16px;
    font-size: 13px; color: var(--green); margin-bottom: 16px;
  }
  .empty-state {
    padding: 32px; text-align: center; color: var(--muted); font-size: 13px;
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-md);
  }
</style>

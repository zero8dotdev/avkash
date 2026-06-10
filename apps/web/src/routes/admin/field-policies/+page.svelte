<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import ErrorBanner from '$components/ErrorBanner.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  interface FieldPolicy {
    id: string; resource: string; fieldGroup: string; relation: string;
    access: 'read' | 'write' | 'none'; version: number; createdAt: string; updatedAt: string;
  }

  const policies = $derived(data.policies as FieldPolicy[]);

  // Build an override map: resource:group:relation → policy row
  const overrideMap = $derived(() => {
    const m = new Map<string, FieldPolicy>();
    for (const p of policies) {
      m.set(`${p.resource}:${p.fieldGroup}:${p.relation}`, p);
    }
    return m;
  });

  function getOverride(group: string, relation: string): FieldPolicy | undefined {
    return overrideMap().get(`employee:${group}:${relation}`);
  }

  function getEffective(group: string, relation: string): string {
    const override = getOverride(group, relation);
    if (override) return override.access;
    const defaults = data.defaults as Record<string, Record<string, string>>;
    return defaults[relation]?.[group] ?? '—';
  }

  function accessClass(access: string): string {
    if (access === 'write') return 'access-write';
    if (access === 'read') return 'access-read';
    if (access === 'none') return 'access-none';
    return '';
  }

  // New policy form
  let showUpsertForm = $state(false);
  let newGroup = $state('compensation');
  let newRelation = $state('hrbp');
  let newAccess = $state('read');

  // Inline edit modal
  let editingPolicy = $state<FieldPolicy | null>(null);
  let editAccess = $state<string>('read');

  function startEdit(p: FieldPolicy) {
    editingPolicy = p;
    editAccess = p.access;
  }

  function closeEdit() {
    editingPolicy = null;
  }

  const groups = $derived(data.fieldGroups as string[]);
  const relations = $derived(data.relations as string[]);
  const accessValues = $derived((data.accessValues as string[]) ?? ['read', 'write', 'none']);

  // Track if a policy just changed (for the live demo beat 4 indicator)
  let lastChanged = $state<string | null>(null);
  $effect(() => {
    if (form?.upsertSuccess) {
      const p = form?.upsertedPolicy as FieldPolicy | undefined;
      if (p) lastChanged = `${p.fieldGroup}:${p.relation}`;
    }
    if (form?.patchSuccess) {
      const p = form?.patchedPolicy as FieldPolicy | undefined;
      if (p) lastChanged = `${p.fieldGroup}:${p.relation}`;
    }
  });
</script>

<div class="fp-page">
  <div class="page-header">
    <div class="header-left">
      <h2 class="page-title">Field Policies</h2>
      <span class="subtitle">resource: employee</span>
    </div>
    <button class="btn-primary" onclick={() => { showUpsertForm = !showUpsertForm; }}>
      {showUpsertForm ? 'Cancel' : '+ Add / Override Policy'}
    </button>
  </div>

  <!-- Demo beat 4 callout -->
  <div class="beat-callout">
    <span class="beat-icon">⚡</span>
    <div class="beat-text">
      <strong>Demo Beat 4 — live field-group visibility.</strong>
      Flipping a row here invalidates the resolver cache immediately (no deploy).
      Rohan's view of Sara has <em>no compensation section</em> (MANAGER → compensation: none).
      Grant <code>hrbp → compensation: read</code> and Anita sees salary/bank fields on the next profile fetch.
    </div>
  </div>

  <!-- Success / error banners -->
  {#if form?.upsertSuccess}
    <div class="success-banner">
      Policy saved. Cache invalidated — next profile fetch reflects the change.
      {#if form?.upsertedPolicy}
        {@const p = form.upsertedPolicy as FieldPolicy}
        <code class="inline-code">{p.fieldGroup} × {p.relation} → {p.access}</code>
      {/if}
    </div>
  {/if}
  {#if form?.patchSuccess}
    <div class="success-banner">
      Policy updated.
      {#if form?.patchedPolicy}
        {@const p = form.patchedPolicy as FieldPolicy}
        <code class="inline-code">{p.fieldGroup} × {p.relation} → {p.access}</code>
      {/if}
    </div>
  {/if}
  {#if form?.deleteSuccess}
    <div class="success-banner">Policy deleted — defaults restored for that row.</div>
  {/if}
  {#if form?.upsertError}
    <ErrorBanner error={form.upsertError} />
  {/if}
  {#if form?.patchError}
    <ErrorBanner error={form.patchError} />
  {/if}
  {#if form?.deleteError}
    <ErrorBanner error={form.deleteError} />
  {/if}

  <!-- Add/override form -->
  {#if showUpsertForm}
    <div class="upsert-form-container">
      <h3 class="upsert-title">Add or Override a Policy Row</h3>
      <p class="upsert-desc">
        Creating a row with an existing resource × group × relation will replace it (upsert).
        Deleting a row reverts to the compiled default.
      </p>
      <form class="upsert-form" method="post" action="?/upsert" use:enhance onsubmit={() => { showUpsertForm = false; }}>
        <input type="hidden" name="resource" value="employee" />
        <div class="form-row-inline">
          <div class="form-field">
            <label class="form-label" for="upsert-group">Field Group</label>
            <select id="upsert-group" class="form-select" name="fieldGroup" bind:value={newGroup}>
              {#each groups as g (g)}
                <option value={g}>{g}</option>
              {/each}
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="upsert-relation">Relation</label>
            <select id="upsert-relation" class="form-select" name="relation" bind:value={newRelation}>
              {#each relations as r (r)}
                <option value={r}>{r}</option>
              {/each}
            </select>
          </div>
          <div class="form-field">
            <label class="form-label" for="upsert-access">Access</label>
            <select id="upsert-access" class="form-select" name="access" bind:value={newAccess}>
              {#each accessValues as v (v)}
                <option value={v}>{v}</option>
              {/each}
            </select>
          </div>
          <button type="submit" class="btn-save">Save</button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Inline edit modal -->
  {#if editingPolicy}
    <div class="edit-overlay">
      <div class="edit-modal">
        <div class="edit-modal-header">
          <h3 class="edit-modal-title">Edit Policy</h3>
          <button class="edit-close" onclick={closeEdit}>✕</button>
        </div>
        <div class="edit-info">
          <code>{editingPolicy.resource} × {editingPolicy.fieldGroup} × {editingPolicy.relation}</code>
        </div>
        <form method="post" action="?/patch" use:enhance onsubmit={closeEdit}>
          <input type="hidden" name="id" value={editingPolicy.id} />
          <input type="hidden" name="version" value={editingPolicy.version} />
          <div class="edit-form-row">
            <label class="form-label" for="edit-access">Access</label>
            <select id="edit-access" class="form-select" name="access" bind:value={editAccess}>
              {#each accessValues as v (v)}
                <option value={v}>{v}</option>
              {/each}
            </select>
          </div>
          <div class="edit-footer">
            <button type="submit" class="btn-save">Update (ETag If-Match)</button>
            <button type="button" class="btn-cancel" onclick={closeEdit}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Full matrix table -->
  <div class="matrix-section">
    <h3 class="matrix-title">Access Matrix — employee resource</h3>
    <p class="matrix-desc">
      Effective access = tenant override (field_policy row) OR compiled default. Overrides are highlighted.
      Cells with a pen icon have a DB row you can edit. Cells without revert to the compiled default on delete.
    </p>

    <div class="table-wrapper">
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="col-group">Field Group</th>
            {#each relations as rel (rel)}
              <th class="col-rel">{rel}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each groups as grp (grp)}
            <tr>
              <td class="cell-group">
                <span class="grp-name">{grp}</span>
                {#if grp === 'compensation' || grp === 'identity' || grp === 'medical'}
                  <span class="grp-tag">DPDP</span>
                {/if}
                {#if grp === 'identity' || grp === 'medical'}
                  <span class="grp-tag grp-tag--audit">AUDITED</span>
                {/if}
              </td>
              {#each relations as rel (rel)}
                {@const override = getOverride(grp, rel)}
                {@const effective = getEffective(grp, rel)}
                {@const isChanged = lastChanged === `${grp}:${rel}`}
                <td class="cell-access" class:cell-override={!!override} class:cell-changed={isChanged}>
                  <div class="cell-inner">
                    <span class="access-badge {accessClass(effective)}">{effective}</span>
                    {#if override}
                      <button
                        class="cell-edit-btn"
                        title="Edit override (ETag If-Match)"
                        onclick={() => startEdit(override)}
                      >✏️</button>
                      <form method="post" action="?/delete" use:enhance style="display:inline;">
                        <input type="hidden" name="id" value={override.id} />
                        <button type="submit" class="cell-delete-btn" title="Delete override (reverts to default)">✕</button>
                      </form>
                    {/if}
                  </div>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="legend">
      <span class="legend-item"><span class="access-badge access-write">write</span> read + write</span>
      <span class="legend-item"><span class="access-badge access-read">read</span> read only</span>
      <span class="legend-item"><span class="access-badge access-none">none</span> hidden (absent from wire)</span>
      <span class="legend-item override-legend">highlighted = tenant override in DB</span>
    </div>
  </div>

  <!-- Active overrides list -->
  <div class="overrides-section">
    <h3 class="overrides-title">Active DB Overrides ({policies.length})</h3>
    {#if policies.length === 0}
      <p class="overrides-empty">No tenant overrides. All access follows compiled defaults.</p>
    {:else}
      <div class="overrides-list">
        {#each policies as p (p.id)}
          <div class="override-row">
            <code class="override-key">{p.resource} × {p.fieldGroup} × {p.relation}</code>
            <span class="access-badge {accessClass(p.access)}">{p.access}</span>
            <span class="override-version">v{p.version}</span>
            <span class="override-date">{new Date(p.updatedAt).toLocaleString('en-IN')}</span>
            <div class="override-actions">
              <button class="cell-edit-btn" onclick={() => startEdit(p)} title="Edit">✏️</button>
              <form method="post" action="?/delete" use:enhance style="display:inline;">
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" class="cell-delete-btn" title="Delete">✕</button>
              </form>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .fp-page { animation: fadeInUp 0.2s ease forwards; }

  /* Header */
  .page-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 16px;
  }
  .header-left { display: flex; align-items: baseline; gap: 10px; }
  .page-title { font-size: 18px; font-weight: 600; color: var(--text); }
  .subtitle {
    font-family: var(--font-mono); font-size: 11px; color: var(--muted);
    background: var(--surface2); border: 1px solid var(--border);
    padding: 2px 7px; border-radius: var(--r-pill);
  }

  /* Demo beat callout */
  .beat-callout {
    display: flex; gap: 12px; align-items: flex-start;
    background: rgba(88,166,255,0.06); border: 1px solid rgba(88,166,255,0.2);
    border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;
  }
  .beat-icon { font-size: 18px; flex-shrink: 0; }
  .beat-text { font-size: 12px; color: var(--muted); line-height: 1.6; }
  .beat-text strong { color: var(--text); }
  .beat-text em { color: var(--blue); font-style: normal; }
  .beat-text code {
    font-family: var(--font-mono); font-size: 11px;
    background: var(--surface2); border: 1px solid var(--border);
    padding: 1px 5px; border-radius: 3px; color: var(--blue);
  }

  /* Banners */
  .success-banner {
    background: rgba(63,185,80,0.1); border: 1px solid rgba(63,185,80,0.3);
    color: var(--green); font-size: 13px; padding: 10px 16px;
    border-radius: var(--r-sm); margin-bottom: 16px;
  }
  .inline-code {
    font-family: var(--font-mono); font-size: 11px;
    background: rgba(63,185,80,0.1); padding: 1px 6px; border-radius: 3px; margin-left: 6px;
  }

  /* Upsert form */
  .upsert-form-container {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 20px; margin-bottom: 20px;
  }
  .upsert-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
  .upsert-desc { font-size: 12px; color: var(--muted); margin-bottom: 16px; line-height: 1.5; }
  .form-row-inline { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
  .form-field { display: flex; flex-direction: column; gap: 5px; }
  .form-label {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--muted);
  }
  .form-select {
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); font-size: 12px; padding: 6px 10px;
    border-radius: var(--r-sm); outline: none; cursor: pointer;
    transition: border-color 0.15s;
  }
  .form-select:focus { border-color: var(--blue); }
  .btn-save {
    background: var(--blue); color: #000; font-size: 12px; font-weight: 600;
    border: none; padding: 7px 14px; border-radius: var(--r-sm); cursor: pointer;
    height: 32px; align-self: flex-end;
  }
  .btn-save:hover { opacity: 0.85; }
  .btn-cancel {
    background: transparent; color: var(--muted); font-size: 12px;
    border: 1px solid var(--border); padding: 7px 14px; border-radius: var(--r-sm); cursor: pointer;
  }
  .btn-cancel:hover { color: var(--text); }

  /* Edit overlay */
  .edit-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    z-index: 200; display: flex; align-items: center; justify-content: center;
  }
  .edit-modal {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 24px; min-width: 340px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.4);
  }
  .edit-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .edit-modal-title { font-size: 15px; font-weight: 600; color: var(--text); }
  .edit-close {
    background: transparent; border: none; color: var(--muted); font-size: 16px; cursor: pointer;
  }
  .edit-info {
    background: var(--surface2); border: 1px solid var(--border);
    padding: 8px 12px; border-radius: var(--r-sm); margin-bottom: 16px;
    font-family: var(--font-mono); font-size: 12px; color: var(--text);
  }
  .edit-form-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .edit-footer { display: flex; gap: 10px; }

  /* Matrix */
  .matrix-section { margin-bottom: 24px; }
  .matrix-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
  .matrix-desc { font-size: 12px; color: var(--muted); margin-bottom: 14px; line-height: 1.5; }
  .table-wrapper { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; }
  .matrix-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .matrix-table th {
    background: var(--surface2); padding: 10px 14px;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--muted);
    border-bottom: 1px solid var(--border); white-space: nowrap;
    text-align: center;
  }
  .col-group { text-align: left !important; }
  .col-rel { min-width: 90px; }

  .matrix-table td {
    padding: 10px 14px; border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }
  .matrix-table tr:last-child td { border-bottom: none; }

  .cell-group { background: var(--surface); }
  .grp-name { font-weight: 600; color: var(--text); font-size: 12px; display: block; }
  .grp-tag {
    font-size: 9px; font-weight: 600; letter-spacing: 0.05em;
    background: rgba(210,153,34,0.15); color: var(--amber);
    padding: 1px 5px; border-radius: var(--r-pill); margin-top: 2px; display: inline-block;
  }
  .grp-tag--audit { background: rgba(248,81,73,0.1); color: var(--red); }

  .cell-access { text-align: center; }
  .cell-override { background: rgba(88,166,255,0.05); }
  .cell-changed { background: rgba(63,185,80,0.08) !important; }
  .cell-inner { display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap; }

  /* Access badges */
  .access-badge {
    font-family: var(--font-mono); font-size: 10px; font-weight: 600;
    padding: 2px 7px; border-radius: var(--r-pill); white-space: nowrap;
  }
  .access-write { background: rgba(188,140,255,0.15); color: var(--purple); }
  .access-read { background: rgba(88,166,255,0.15); color: var(--blue); }
  .access-none { background: var(--surface2); color: var(--muted); }

  .cell-edit-btn, .cell-delete-btn {
    background: transparent; border: none; cursor: pointer; font-size: 12px;
    padding: 2px 4px; opacity: 0.6; transition: opacity 0.15s;
  }
  .cell-edit-btn:hover, .cell-delete-btn:hover { opacity: 1; }

  /* Legend */
  .legend {
    display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px;
    font-size: 11px; color: var(--muted);
  }
  .legend-item { display: flex; align-items: center; gap: 6px; }
  .override-legend {
    background: rgba(88,166,255,0.05); border: 1px solid rgba(88,166,255,0.2);
    padding: 2px 8px; border-radius: var(--r-sm); color: var(--blue); font-size: 10px;
  }

  /* Overrides list */
  .overrides-section {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 20px;
  }
  .overrides-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
  .overrides-empty { font-size: 13px; color: var(--muted); }
  .overrides-list { display: flex; flex-direction: column; gap: 8px; }
  .override-row {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    background: var(--surface2); border: 1px solid var(--border);
    padding: 10px 14px; border-radius: var(--r-sm);
  }
  .override-key {
    font-family: var(--font-mono); font-size: 11px; color: var(--text); flex: 1;
  }
  .override-version {
    font-family: var(--font-mono); font-size: 10px; color: var(--muted);
    background: var(--surface); border: 1px solid var(--border);
    padding: 1px 5px; border-radius: var(--r-pill);
  }
  .override-date { font-size: 11px; color: var(--muted); }
  .override-actions { display: flex; gap: 4px; }
  .btn-primary {
    background: var(--blue); color: #000; font-size: 12px; font-weight: 600;
    border: none; padding: 7px 14px; border-radius: var(--r-sm); cursor: pointer;
  }
  .btn-primary:hover { opacity: 0.85; }
</style>

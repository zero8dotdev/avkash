<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Snippet } from 'svelte';

  interface Column<R> {
    key: string;
    label: string;
    render?: (row: R) => string;
    align?: 'left' | 'right' | 'center';
  }

  interface Props<R> {
    columns: Column<R>[];
    rows: R[];
    emptyMsg?: string;
    rowActions?: Snippet<[R]>;
  }

  let { columns, rows, emptyMsg = 'No data', rowActions }: Props<T> = $props();
</script>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        {#each columns as col (col.key)}
          <th class={col.align ?? 'left'}>{col.label}</th>
        {/each}
        {#if rowActions}<th class="right"></th>{/if}
      </tr>
    </thead>
    <tbody>
      {#if rows.length === 0}
        <tr>
          <td colspan={columns.length + (rowActions ? 1 : 0)} class="empty-row">{emptyMsg}</td>
        </tr>
      {:else}
        {#each rows as row, i (i)}
          <tr>
            {#each columns as col (col.key)}
              <td class={col.align ?? 'left'}>
                {col.render ? col.render(row) : (row[col.key] ?? '—')}
              </td>
            {/each}
            {#if rowActions}
              <td class="right actions-cell">
                {@render rowActions(row)}
              </td>
            {/if}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  thead {
    background: var(--surface2);
  }
  th, td {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }
  th {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }
  td {
    color: var(--text);
  }
  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }
  .right { text-align: right; }
  .center { text-align: center; }
  .empty-row {
    text-align: center;
    color: var(--muted);
    font-size: 12px;
    padding: 24px;
  }
  .actions-cell {
    white-space: nowrap;
  }
</style>

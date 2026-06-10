<script lang="ts">
  export interface ConsoleEntry {
    method: string;
    path: string;
    status: number | null;
    ms: number | null;
    response: string;
    isError: boolean;
    scripted?: boolean;
  }

  interface Props {
    entry: ConsoleEntry | null;
  }

  let { entry }: Props = $props();
</script>

<div class="console-strip">
  <span class="con-label">→ API</span>
  {#if entry}
    <span class="con-call">
      {entry.method} {entry.path}
      {#if entry.status !== null}
        <span class="con-status" class:ok={!entry.isError} class:err={entry.isError}>{entry.status}</span>
      {/if}
      {#if entry.ms !== null}
        <span class="con-ms">{entry.ms}ms</span>
      {/if}
    </span>
    <div class="con-sep"></div>
    {#if entry.scripted}
      <span class="con-resp scripted">scripted — feature seed data pending</span>
    {:else}
      <span class="con-resp" class:error={entry.isError}>{entry.response}</span>
    {/if}
  {:else}
    <span class="con-call">—</span>
    <div class="con-sep"></div>
    <span class="con-resp">Waiting for interaction…</span>
  {/if}
</div>

<style>
  .console-strip {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 100;
    height: 56px;
    background: var(--bg);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 0;
    font-family: var(--font-mono);
    font-size: 12px;
    overflow: hidden;
  }

  .con-label {
    color: var(--muted);
    margin-right: 12px;
    flex-shrink: 0;
    font-weight: 500;
  }

  .con-call {
    color: var(--blue);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .con-status {
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 600;
  }
  .con-status.ok  { background: rgba(63,185,80,0.2);  color: var(--green); }
  .con-status.err { background: rgba(248,81,73,0.2);  color: var(--red); }

  .con-ms {
    color: var(--muted);
    font-size: 10px;
  }

  .con-sep {
    width: 1px;
    background: var(--border);
    height: 24px;
    margin: 0 16px;
    flex-shrink: 0;
  }

  .con-resp {
    color: var(--green);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .con-resp.error   { color: var(--red); }
  .con-resp.scripted {
    color: var(--amber);
    font-style: italic;
  }
</style>

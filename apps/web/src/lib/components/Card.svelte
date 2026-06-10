<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    subtitle?: string;
    accent?: string; // CSS color value for a top border accent
    children: Snippet;
  }

  let { title, subtitle, accent, children }: Props = $props();
</script>

<div class="card" style={accent ? `--accent: ${accent}` : ''} class:accented={!!accent}>
  {#if title || subtitle}
    <div class="card-header">
      {#if title}<div class="card-title">{title}</div>{/if}
      {#if subtitle}<div class="card-subtitle">{subtitle}</div>{/if}
    </div>
  {/if}
  <div class="card-body">
    {@render children()}
  </div>
</div>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }
  .card.accented {
    border-top: 3px solid var(--accent, var(--blue));
  }
  .card-header {
    padding: 16px 18px 0;
  }
  .card-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }
  .card-subtitle {
    font-size: 11px;
    color: var(--muted);
    margin-top: 2px;
  }
  .card-body {
    padding: 16px 18px;
  }
</style>

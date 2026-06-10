<script lang="ts">
  import '../app.css';
  import TopNav from '$components/TopNav.svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

{#if data.user}
  <TopNav user={data.user} />
  <main class="shell-main">
    {@render children()}
  </main>
{:else}
  <!-- Public pages (login) render without the nav shell. -->
  {@render children()}
{/if}

<style>
  .shell-main {
    margin-top: var(--nav-h);
    min-height: calc(100dvh - var(--nav-h));
    padding: 32px 24px;
  }
</style>

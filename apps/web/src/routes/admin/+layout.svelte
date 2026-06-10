<script lang="ts">
  import { page } from '$app/stores';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

  const adminSections = [
    { label: 'Leave Types & Policies', href: '/admin/leave-types' },
    { label: 'Workweek Patterns', href: '/admin/workweek-patterns' },
    { label: 'Holidays & Locations', href: '/admin/holidays' },
    { label: 'Blackouts', href: '/admin/blackouts' },
  ];

  function isActive(href: string) {
    return $page.url.pathname.startsWith(href);
  }
</script>

{#if data.notAuthorized}
  <div class="not-authorized">
    <div class="na-icon">🔒</div>
    <h2 class="na-title">Not Authorized</h2>
    <p class="na-message">
      The Admin section is only accessible to <strong>ADMIN</strong> and <strong>OWNER</strong> roles.
      You are signed in as <code>{data.user?.role ?? 'ANON'}</code>.
    </p>
    <a href="/dashboard" class="na-link">← Back to Dashboard</a>
  </div>
{:else}
  <div class="admin-shell">
    <aside class="admin-nav">
      <div class="admin-nav-header">
        <span class="admin-label">Admin</span>
      </div>
      <nav>
        {#each adminSections as sec (sec.href)}
          <a
            class="admin-nav-item"
            class:active={isActive(sec.href)}
            href={sec.href}
          >
            {sec.label}
          </a>
        {/each}
      </nav>
    </aside>
    <div class="admin-content">
      {@render children()}
    </div>
  </div>
{/if}

<style>
  /* Not authorized */
  .not-authorized {
    max-width: 420px; margin: 80px auto; text-align: center;
    animation: fadeInUp 0.3s ease forwards;
  }
  .na-icon { font-size: 40px; margin-bottom: 12px; }
  .na-title { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
  .na-message {
    font-size: 13px; color: var(--muted); line-height: 1.6; margin-bottom: 20px;
  }
  .na-message code {
    font-family: var(--font-mono); font-size: 12px;
    background: var(--surface2); border: 1px solid var(--border);
    padding: 1px 6px; border-radius: var(--r-sm);
  }
  .na-link {
    font-size: 13px; color: var(--blue);
    border: 1px solid var(--border); padding: 6px 14px;
    border-radius: var(--r-sm); display: inline-block;
    transition: border-color var(--dur-fast) var(--ease);
  }
  .na-link:hover { border-color: var(--blue); }

  /* Admin shell */
  .admin-shell {
    display: flex; gap: 0; min-height: calc(100dvh - var(--nav-h));
    margin: calc(-32px) -24px; /* undo shell-main padding */
  }

  /* Sidebar */
  .admin-nav {
    width: 220px; flex-shrink: 0;
    background: var(--surface); border-right: 1px solid var(--border);
    padding: 24px 0;
  }
  .admin-nav-header {
    padding: 0 20px 16px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 8px;
  }
  .admin-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--muted);
  }
  .admin-nav-item {
    display: block; padding: 9px 20px;
    font-size: 13px; color: var(--muted);
    border-left: 2px solid transparent;
    transition: all var(--dur-fast) var(--ease);
    text-decoration: none;
  }
  .admin-nav-item:hover { color: var(--text); background: var(--surface2); }
  .admin-nav-item.active { color: var(--blue); border-left-color: var(--blue); background: rgba(88,166,255,0.04); }

  /* Content area */
  .admin-content {
    flex: 1; padding: 28px 32px;
    overflow-y: auto;
    animation: fadeInUp 0.2s ease forwards;
  }
</style>

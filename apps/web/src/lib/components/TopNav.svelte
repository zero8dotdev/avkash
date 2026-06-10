<script lang="ts">
  import { page } from '$app/stores';
  import { signOut } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  interface Props {
    user: { name: string; email: string; role: string } | null;
  }

  let { user }: Props = $props();

  // ── API status dot ──────────────────────────────────────────────────────────
  type ApiStatus = 'checking' | 'ready' | 'offline';
  let apiStatus = $state<ApiStatus>('checking');

  const API_BASE = typeof window !== 'undefined'
    ? (import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3001')
    : 'http://localhost:3001';

  async function pollApiStatus() {
    try {
      const res = await fetch(`${API_BASE}/health/ready`, { credentials: 'include' });
      apiStatus = res.ok ? 'ready' : 'offline';
    } catch {
      apiStatus = 'offline';
    }
  }

  onMount(() => {
    void pollApiStatus();
    const id = setInterval(() => void pollApiStatus(), 15_000);
    return () => clearInterval(id);
  });

  // ── Navigation pills ────────────────────────────────────────────────────────
  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Leave', href: '/leave' },
    { label: 'Attendance', href: '/attendance' },
    { label: 'Comp-off', href: '/comp-off' },
    { label: 'Employees', href: '/employees' },
    { label: 'Transfers', href: '/transfers' },
    { label: 'Reports', href: '/reports' },
    { label: 'Admin', href: '/admin' },
    { label: 'Demo', href: '/demo' },
  ];

  function isActive(href: string) {
    const path = $page.url.pathname;
    if (href === '/dashboard') return path === '/' || path.startsWith('/dashboard');
    return path.startsWith(href);
  }

  // ── Sign-out ────────────────────────────────────────────────────────────────
  async function handleSignOut() {
    await signOut();
    await goto('/login');
  }

  const statusLabel: Record<ApiStatus, string> = {
    checking: 'CHECKING',
    ready:    'SERVING',
    offline:  'OFFLINE',
  };
</script>

<nav class="top-nav">
  <!-- Logo -->
  <a class="logo" href="/dashboard" aria-label="Avkash home">
    avk<span>|</span>ash
  </a>

  <!-- Nav pills -->
  <div class="pills" role="navigation" aria-label="Main navigation">
    {#each navItems as item (item.href)}
      <a
        class="pill"
        class:active={isActive(item.href)}
        href={item.href}
      >
        {item.label}
      </a>
    {/each}
  </div>

  <!-- Right: API status + user -->
  <div class="right-cluster">
    <div class="api-status" aria-label="API status: {statusLabel[apiStatus]}">
      <span
        class="api-dot"
        class:connected={apiStatus === 'ready'}
        class:offline={apiStatus === 'offline'}
        aria-hidden="true"
      ></span>
      <span class="api-label">{statusLabel[apiStatus]}</span>
    </div>

    {#if user}
      <div class="persona">
        <span class="persona-name">{user.name}</span>
        <span class="persona-role">{user.role}</span>
        <button class="sign-out-btn" onclick={handleSignOut} aria-label="Sign out">
          Sign out
        </button>
      </div>
    {/if}
  </div>
</nav>

<style>
  .top-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    height: var(--nav-h);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 16px;
  }

  /* Logo */
  .logo {
    font-weight: 700;
    font-size: 16px;
    color: var(--blue);
    letter-spacing: -0.5px;
    white-space: nowrap;
    flex-shrink: 0;
    text-decoration: none;
  }
  .logo span {
    color: var(--purple);
  }

  /* Pill navigation */
  .pills {
    display: flex;
    gap: 4px;
    flex: 1;
    justify-content: center;
    overflow: hidden;
  }
  .pill {
    padding: 4px 10px;
    border-radius: var(--r-pill);
    font-size: 11px;
    font-weight: 500;
    background: transparent;
    color: var(--muted);
    border: 1px solid transparent;
    transition: all var(--dur-fast) var(--ease);
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;
  }
  .pill:hover {
    background: var(--surface2);
    color: var(--text);
  }
  .pill.active {
    background: var(--blue);
    color: #000;
    font-weight: 600;
    border-color: var(--blue);
  }

  /* Right cluster */
  .right-cluster {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }

  /* API status */
  .api-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
    font-family: var(--font-mono);
  }
  .api-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--amber);
    animation: pulse 2s infinite;
    display: inline-block;
  }
  .api-dot.connected {
    background: var(--green);
    animation: none;
  }
  .api-dot.offline {
    background: var(--red);
    animation: none;
  }

  /* Persona indicator */
  .persona {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .persona-name {
    color: var(--text);
    font-weight: 500;
  }
  .persona-role {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    background: var(--surface2);
    border: 1px solid var(--border);
    padding: 2px 6px;
    border-radius: var(--r-sm);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .sign-out-btn {
    font-size: 11px;
    color: var(--muted);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 3px 8px;
    cursor: pointer;
    transition: all var(--dur-fast) var(--ease);
  }
  .sign-out-btn:hover {
    color: var(--red);
    border-color: var(--red);
  }
</style>

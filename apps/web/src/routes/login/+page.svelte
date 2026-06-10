<script lang="ts">
  import { signIn } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    loading = true;

    const result = await signIn.email({ email, password });

    if (result.error) {
      error = result.error.message ?? 'Sign-in failed. Check your credentials.';
    } else {
      const next = $page.url.searchParams.get('next') ?? '/dashboard';
      await goto(next);
    }

    loading = false;
  }
</script>

<svelte:head>
  <title>Sign in — Avkash</title>
</svelte:head>

<div class="login-page">
  <div class="login-card" style="animation: fadeInUp 0.4s ease forwards;">
    <div class="login-logo">avk<span>|</span>ash</div>
    <p class="login-subtitle">HR Platform · Sign in to continue</p>

    <form onsubmit={handleSubmit} novalidate>
      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="you@company.com"
          autocomplete="email"
          required
        />
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="••••••••"
          autocomplete="current-password"
          required
        />
      </div>

      {#if error}
        <p class="error-msg" role="alert">{error}</p>
      {/if}

      <button type="submit" class="submit-btn" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>

    <p class="hint">Demo: priya@meridian-demo.example.com / AvkashDemo@2026</p>
  </div>
</div>

<style>
  .login-page {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    padding: 24px;
  }

  .login-card {
    width: 100%;
    max-width: 400px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 40px 32px;
    animation: fadeInUp 0.4s ease forwards;
  }

  .login-logo {
    font-size: 24px;
    font-weight: 700;
    color: var(--blue);
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }
  .login-logo span {
    color: var(--purple);
  }

  .login-subtitle {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 28px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }
  label {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
  }
  input {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 10px 12px;
    color: var(--text);
    font-size: 14px;
    font-family: var(--font-sans);
    outline: none;
    transition: border-color var(--dur-fast) var(--ease);
    width: 100%;
  }
  input:focus {
    border-color: var(--blue);
  }
  input::placeholder {
    color: var(--muted);
    opacity: 0.6;
  }

  .error-msg {
    font-size: 13px;
    color: var(--red);
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid rgba(248, 81, 73, 0.3);
    border-radius: var(--r-md);
    padding: 8px 12px;
    margin-bottom: 12px;
  }

  .submit-btn {
    width: 100%;
    background: var(--blue);
    color: #000;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: var(--r-md);
    padding: 11px 0;
    cursor: pointer;
    margin-top: 4px;
    transition: opacity var(--dur-fast) var(--ease);
  }
  .submit-btn:hover:not(:disabled) {
    opacity: 0.88;
  }
  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hint {
    font-size: 11px;
    color: var(--muted);
    font-family: var(--font-mono);
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    opacity: 0.7;
  }
</style>

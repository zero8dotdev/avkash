<script lang="ts">
  // ErrorBanner — renders the API error envelope faithfully.
  // Shape: { error: { code, message, details?, requestId? } }
  interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
  }

  interface Props {
    error: ApiError | string | null | undefined;
    onDismiss?: () => void;
  }

  let { error, onDismiss }: Props = $props();

  let parsed = $derived(
    typeof error === 'string' ? { code: 'ERROR', message: error } : error
  );
</script>

{#if parsed}
  <div class="error-banner" role="alert">
    <div class="error-inner">
      <div class="error-left">
        <span class="error-code">{parsed.code}</span>
        <span class="error-msg">{parsed.message}</span>
        {#if parsed.details && Object.keys(parsed.details).length > 0}
          <span class="error-details">
            {JSON.stringify(parsed.details)}
          </span>
        {/if}
      </div>
      {#if onDismiss}
        <button class="dismiss-btn" onclick={onDismiss} aria-label="Dismiss error">✕</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .error-banner {
    background: rgba(248, 81, 73, 0.08);
    border: 1px solid rgba(248, 81, 73, 0.3);
    border-radius: var(--r-md);
    padding: 12px 16px;
    margin-bottom: 16px;
  }
  .error-inner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .error-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .error-code {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--red);
    text-transform: uppercase;
  }
  .error-msg {
    font-size: 13px;
    color: var(--text);
  }
  .error-details {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    word-break: break-all;
  }
  .dismiss-btn {
    background: transparent;
    border: none;
    color: var(--muted);
    font-size: 12px;
    cursor: pointer;
    padding: 0 4px;
    flex-shrink: 0;
    transition: color var(--dur-fast) var(--ease);
  }
  .dismiss-btn:hover {
    color: var(--red);
  }
</style>

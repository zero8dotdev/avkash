<script lang="ts">
  // Chapter 8 — Leave (LIVE — blackout rejection beat with real API call)
  import { onMount } from 'svelte';
  import type { ConsoleEntry } from './DemoConsole.svelte';

  interface Props {
    saraBalance: number;
    onConsole: (entry: ConsoleEntry) => void;
  }

  let { saraBalance, onConsole }: Props = $props();

  let applyState = $state<'idle' | 'applying' | 'blocked' | 'approved'>('idle');
  // saraBalance is a prop used only for the initial display value; mutated locally by reset()
  let currentBalance = $state(0);
  $effect(() => { currentBalance = saraBalance; });
  let calDays = $state([
    { id: 'sep26', name: 'MON', num: 26, state: 'normal' as 'normal' | 'highlight' | 'blocked' },
    { id: 'sep27', name: 'TUE', num: 27, state: 'normal' as 'normal' | 'highlight' | 'blocked' },
    { id: 'sep28', name: 'WED', num: 28, state: 'normal' as 'normal' | 'highlight' | 'blocked' },
  ]);

  // Toast state
  let toastMsg = $state('');
  let toastVisible = $state(false);

  function showToast(msg: string) {
    toastMsg = msg;
    toastVisible = true;
    setTimeout(() => { toastVisible = false; }, 2200);
  }

  onMount(() => {
    onConsole({
      method: 'GET',
      path: `/balances/${'{'}saraId${'}'}`,
      status: 200,
      ms: null,
      response: `{ CL: { available: ${saraBalance}, entitlement: 12 } }`,
      isError: false,
    });
  });

  async function applyLeave() {
    if (applyState !== 'idle') return;
    applyState = 'applying';

    // Highlight the calendar days while applying
    calDays = calDays.map(d => ({ ...d, state: 'highlight' as const }));

    onConsole({
      method: 'POST',
      path: '/leaves',
      status: null,
      ms: null,
      response: 'Sending request…',
      isError: false,
    });

    const t0 = Date.now();
    try {
      const res = await fetch('/demo/api/apply-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: '2026-09-28',
          endDate: '2026-09-28',
          reason: 'Demo blackout test — chapter 8',
        }),
      });
      const data = await res.json() as Record<string, unknown>;
      const ms = Date.now() - t0;

      if (data.error) {
        const err = data.error as { code: string; message: string; details?: Record<string, unknown> };
        applyState = 'blocked';
        calDays = calDays.map(d =>
          d.id === 'sep28' ? { ...d, state: 'blocked' as const } : d
        );
        onConsole({
          method: 'POST',
          path: '/leaves { startDate: "2026-09-28" }',
          status: res.status,
          ms,
          response: `{ code: "${err.code}", details: { name: "${(err.details as { name?: string })?.name ?? ''}" } }`,
          isError: true,
        });
        showToast(`Blocked: ${err.code}`);
      } else {
        // Shouldn't happen — Sep 28 is always in the blackout
        applyState = 'approved';
        onConsole({
          method: 'POST',
          path: '/leaves',
          status: res.status,
          ms,
          response: JSON.stringify(data).slice(0, 80),
          isError: false,
        });
        // Cancel immediately
        if (data.leaveId) {
          await fetch('/demo/api/cancel-leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leaveId: data.leaveId }),
          });
        }
      }
    } catch {
      applyState = 'blocked';
      const ms = Date.now() - t0;
      onConsole({
        method: 'POST',
        path: '/leaves',
        status: 0,
        ms,
        response: 'NETWORK_ERROR — API unreachable',
        isError: true,
      });
    }
  }

  function reset() {
    applyState = 'idle';
    calDays = calDays.map(d => ({ ...d, state: 'normal' as const }));
    onConsole({
      method: 'GET',
      path: `/balances/${'{'}saraId${'}'}`,
      status: 200,
      ms: null,
      response: `{ CL: { available: ${saraBalance} } }`,
      isError: false,
    });
  }
</script>

<div class="scene">
  <div class="section-title">Leave Application · Casual Leave · September 2026</div>

  <!-- Calendar -->
  <div class="leave-cal">
    <div class="cal-header">September 2026 — Q2 Quarter-End Freeze</div>
    <div class="cal-grid">
      {#each calDays as day (day.id)}
        <div class="cal-day" class:highlight={day.state === 'highlight'} class:blocked={day.state === 'blocked'}>
          <div class="day-name">{day.name}</div>
          <div class="day-num">{day.num}</div>
          {#if day.id === 'sep28' && day.state === 'blocked'}
            <div class="day-badge red">BLOCKED</div>
          {:else if day.state === 'highlight'}
            <div class="day-badge blue">Selected</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- Balance -->
  <div class="balance-row">
    <div>
      <div class="balance-label">Sara Khan · CL Balance</div>
      <div class="balance-num">{currentBalance}</div>
    </div>
    <div class="badge blue">Casual Leave</div>
  </div>

  <!-- Blackout callout (when blocked) -->
  {#if applyState === 'blocked'}
    <div class="blackout-callout">
      <div class="blackout-title">🚫 LEAVE_BLACKOUT_PERIOD</div>
      <div class="blackout-detail">
        Q2 FY2027 Quarter-End Freeze · Sep 25–30, 2026<br>
        Leave applications blocked during blackout. Real API response — not scripted.
      </div>
    </div>
  {/if}

  <!-- Actions -->
  <div class="actions">
    {#if applyState === 'idle'}
      <button class="action-btn primary" onclick={applyLeave}>
        Apply CL for Sep 28 →
      </button>
    {:else if applyState === 'applying'}
      <button class="action-btn" disabled>Applying…</button>
    {:else}
      <button class="action-btn" onclick={reset}>↺ Reset</button>
    {/if}
  </div>

  <div class="live-note">
    <span class="live-badge">LIVE</span>
    <span>Real API call as Sara Khan. Sep 28 is inside the Q2 Quarter-End Freeze blackout window.</span>
  </div>
</div>

<div class="narration">
  <h3>Leave Day — and the Blackout</h3>
  <p>
    <span class="highlight">Sara Khan</span> (Assembly team) applies for Casual Leave on Sep 28, 2026.
  </p>
  <p>
    The Q2 FY2027 <span class="highlight" style="color:var(--red)">Quarter-End Freeze</span> covers Sep 25–30.
    The leave evaluator runs the blackout check <strong>before</strong> any ledger write —
    blocking is clean, not a cancellation.
  </p>
  <p>
    The <code>LEAVE_BLACKOUT_PERIOD</code> response is a <span class="highlight" style="color:var(--green)">real API call</span>
    — the console shows live HTTP status + response time.
  </p>
  <p>
    Blackout policies can be scoped to a location, leave type, or org-wide. Here it's scoped to
    the Assembly team's location for audit-week protection.
  </p>
  <p style="color:var(--muted);font-size:12px;margin-top:auto;">
    The policy evaluator runs before the ledger write — blocking is clean, not a cancellation.
    No leave row is created for blocked applications.
  </p>
</div>

{#if toastVisible}
  <div class="toast">{toastMsg}</div>
{/if}

<style>
  .scene {
    flex: 0 0 60%;
    padding: 40px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .leave-cal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
  }
  .cal-header { font-weight: 600; font-size: 13px; margin-bottom: 12px; color: var(--blue); }
  .cal-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }

  .cal-day {
    padding: 10px;
    border-radius: 6px;
    text-align: center;
    background: var(--surface2);
    border: 1px solid var(--border);
    transition: all 0.3s ease;
  }
  .cal-day.highlight { background: rgba(88,166,255,0.15); border-color: var(--blue); }
  .cal-day.blocked   { background: rgba(248,81,73,0.15);  border-color: var(--red); animation: shake 0.6s ease; }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }

  .day-name { font-size: 9px; color: var(--muted); }
  .day-num  { font-size: 20px; font-weight: 700; }
  .day-badge {
    margin-top: 4px;
    font-size: 9px;
    font-weight: 600;
    padding: 2px 4px;
    border-radius: 3px;
  }
  .day-badge.red  { background: rgba(248,81,73,0.2);  color: var(--red); }
  .day-badge.blue { background: rgba(88,166,255,0.2); color: var(--blue); }

  .balance-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--surface2);
    border-radius: 6px;
  }
  .balance-label { font-size: 11px; color: var(--muted); }
  .balance-num {
    font-size: 24px;
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--blue);
    transition: color 0.3s;
  }

  .badge {
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  .badge.blue { background: rgba(88,166,255,0.15); color: var(--blue); }

  .blackout-callout {
    background: rgba(248,81,73,0.08);
    border: 1px solid rgba(248,81,73,0.3);
    border-radius: 8px;
    padding: 14px 16px;
    animation: fadeInUp 0.4s ease;
  }
  .blackout-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--red);
    margin-bottom: 6px;
  }
  .blackout-detail { font-size: 12px; color: var(--muted); line-height: 1.6; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .actions { display: flex; gap: 8px; }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    transition: all 0.2s;
    cursor: pointer;
  }
  .action-btn:hover:not(:disabled) { background: var(--surface); border-color: var(--blue); color: var(--blue); }
  .action-btn:disabled { opacity: 0.4; cursor: default; pointer-events: none; }
  .action-btn.primary { background: var(--blue); color: #000; border-color: var(--blue); }
  .action-btn.primary:hover { background: #79b8ff; }

  .live-note {
    margin-top: auto;
    padding: 10px 14px;
    background: rgba(63,185,80,0.08);
    border: 1px solid rgba(63,185,80,0.2);
    border-radius: 6px;
    font-size: 12px;
    color: var(--green);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .live-badge {
    padding: 2px 6px;
    background: rgba(63,185,80,0.2);
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
  }

  code {
    background: var(--surface2);
    padding: 1px 4px;
    border-radius: 3px;
    font-family: var(--font-mono);
    font-size: 11px;
  }

  .toast {
    position: fixed;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--red);
    color: #fff;
    padding: 8px 20px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    animation: toastUp 2.2s ease forwards;
    z-index: 200;
  }

  @keyframes toastUp {
    0%   { opacity: 0; transform: translateX(-50%) translateY(10px); }
    20%  { opacity: 1; transform: translateX(-50%) translateY(0); }
    80%  { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  }

  .narration {
    flex: 0 0 40%;
    background: var(--surface);
    border-left: 1px solid var(--border);
    padding: 40px 32px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .narration h3 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--muted);
    margin-bottom: 4px;
  }
  .narration p { color: var(--text); line-height: 1.7; font-size: 14px; }
  .highlight   { color: var(--blue); font-weight: 500; }
</style>

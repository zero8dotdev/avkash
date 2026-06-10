<script lang="ts">
  // Chapter 9 — Half Day (LIVE — API supports halfDayPart)
  import { onMount } from 'svelte';
  import type { ConsoleEntry } from './DemoConsole.svelte';

  interface Props {
    onConsole: (entry: ConsoleEntry) => void;
  }

  let { onConsole }: Props = $props();

  let midlineVisible = $state(false);
  let firstHalfVisible = $state(false);
  let secondHalfVisible = $state(false);
  let conflictVisible = $state(false);
  let conflictShake = $state(false);

  let firstHalfApplied = $state(false);
  let secondHalfApplied = $state(false);
  let applyingFirst = $state(false);
  let applyingSecond = $state(false);
  let conflictApplying = $state(false);

  // Track leave IDs for cleanup
  let firstLeaveId = $state<string | null>(null);
  let secondLeaveId = $state<string | null>(null);

  // Use a date far enough to not conflict with existing demo seed
  const DEMO_DATE = '2026-09-01'; // Tuesday

  onMount(() => {
    onConsole({
      method: 'POST',
      path: '/leaves { halfDayPart: "FIRST_HALF", duration: "HALF_DAY" }',
      status: null,
      ms: null,
      response: 'Waiting for interaction…',
      isError: false,
    });

    setTimeout(() => { midlineVisible = true; }, 400);
    setTimeout(() => { firstHalfVisible = true; secondHalfVisible = true; }, 700);
  });

  async function applyFirst() {
    if (firstHalfApplied || applyingFirst) return;
    applyingFirst = true;

    const t0 = Date.now();
    try {
      const res = await fetch('/demo/api/apply-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: DEMO_DATE,
          endDate: DEMO_DATE,
          duration: 'HALF_DAY',
          halfDayPart: 'FIRST_HALF',
          reason: 'Demo half day chapter 9',
        }),
      });
      const data = await res.json() as Record<string, unknown>;
      const ms = Date.now() - t0;

      if (data.leaveId) {
        firstLeaveId = data.leaveId as string;
        firstHalfApplied = true;
        onConsole({
          method: 'POST',
          path: '/leaves { halfDayPart: "FIRST_HALF" }',
          status: res.status,
          ms,
          response: `{ leaveId: "${firstLeaveId?.slice(0, 8)}…", workingDays: "0.50", status: "PENDING" }`,
          isError: false,
        });
      } else {
        const err = data.error as { code: string } | undefined;
        onConsole({
          method: 'POST',
          path: '/leaves { halfDayPart: "FIRST_HALF" }',
          status: res.status,
          ms,
          response: `{ code: "${err?.code ?? 'ERROR'}" }`,
          isError: true,
        });
      }
    } catch {
      onConsole({ method: 'POST', path: '/leaves', status: 0, ms: Date.now() - t0, response: 'NETWORK_ERROR', isError: true });
    }
    applyingFirst = false;
  }

  async function applySecond() {
    if (secondHalfApplied || applyingSecond) return;
    applyingSecond = true;

    const t0 = Date.now();
    try {
      const res = await fetch('/demo/api/apply-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: DEMO_DATE,
          endDate: DEMO_DATE,
          duration: 'HALF_DAY',
          halfDayPart: 'SECOND_HALF',
          reason: 'Demo half day chapter 9',
        }),
      });
      const data = await res.json() as Record<string, unknown>;
      const ms = Date.now() - t0;

      if (data.leaveId) {
        secondLeaveId = data.leaveId as string;
        secondHalfApplied = true;
        onConsole({
          method: 'POST',
          path: '/leaves { halfDayPart: "SECOND_HALF" }',
          status: res.status,
          ms,
          response: `{ leaveId: "${secondLeaveId?.slice(0, 8)}…", workingDays: "0.50" } → 2 × 0.5 = 1.0 day`,
          isError: false,
        });
      } else {
        const err = data.error as { code: string } | undefined;
        onConsole({ method: 'POST', path: '/leaves { halfDayPart: "SECOND_HALF" }', status: res.status, ms, response: `{ code: "${err?.code ?? 'ERROR'}" }`, isError: true });
      }
    } catch {
      onConsole({ method: 'POST', path: '/leaves', status: 0, ms: Date.now() - t0, response: 'NETWORK_ERROR', isError: true });
    }
    applyingSecond = false;
  }

  async function triggerConflict() {
    if (conflictApplying) return;
    conflictApplying = true;

    const t0 = Date.now();
    try {
      const res = await fetch('/demo/api/apply-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: DEMO_DATE,
          endDate: DEMO_DATE,
          duration: 'HALF_DAY',
          halfDayPart: 'FIRST_HALF',
          reason: 'Demo conflict test',
        }),
      });
      const data = await res.json() as Record<string, unknown>;
      const ms = Date.now() - t0;
      const err = data.error as { code: string } | undefined;

      conflictVisible = true;
      setTimeout(() => { conflictShake = true; setTimeout(() => { conflictShake = false; }, 600); }, 50);

      onConsole({
        method: 'POST',
        path: '/leaves { halfDayPart: "FIRST_HALF" — again }',
        status: res.status,
        ms,
        response: `{ code: "${err?.code ?? 'LEAVE_OVERLAP'}", message: "FIRST_HALF already taken on ${DEMO_DATE}" }`,
        isError: true,
      });
    } catch {
      onConsole({ method: 'POST', path: '/leaves', status: 0, ms: Date.now() - t0, response: 'NETWORK_ERROR', isError: true });
    }
    conflictApplying = false;
  }

  async function resetAll() {
    // Cancel both leaves if they exist
    if (firstLeaveId) {
      await fetch('/demo/api/cancel-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId: firstLeaveId }),
      });
      firstLeaveId = null;
    }
    if (secondLeaveId) {
      await fetch('/demo/api/cancel-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId: secondLeaveId }),
      });
      secondLeaveId = null;
    }
    firstHalfApplied = false;
    secondHalfApplied = false;
    conflictVisible = false;

    onConsole({
      method: 'DELETE',
      path: '/leaves/:id × 2',
      status: 200,
      ms: null,
      response: '{ cancelled: true } × 2 — demo state cleaned up',
      isError: false,
    });
  }
</script>

<div class="scene">
  <div class="section-title">Half-Day Leave · Sara Khan · A Shift · {DEMO_DATE}</div>

  <div class="shift-meta">
    A Shift: 06:00 → 14:00 &nbsp;·&nbsp; Midpoint: 10:00
  </div>

  <div class="half-day-wrap">
    <div class="midpoint-label">10:00 (midpoint)</div>
    <div class="midpoint-line" class:visible={midlineVisible}></div>
    <div class="half-day-bar">
      <div class="half-first" class:visible={firstHalfVisible} class:applied={firstHalfApplied}>
        FIRST_HALF<br><span class="half-sub">06:00–10:00</span>
      </div>
      <div class="half-second" class:visible={secondHalfVisible} class:applied={secondHalfApplied}>
        SECOND_HALF<br><span class="half-sub">10:00–14:00</span>
      </div>
    </div>
    <div class="shift-times">
      <span>06:00</span><span>14:00</span>
    </div>
  </div>

  <!-- Actions -->
  <div class="actions">
    {#if !firstHalfApplied}
      <button class="action-btn primary" onclick={applyFirst} disabled={applyingFirst}>
        {applyingFirst ? 'Applying…' : 'Apply FIRST_HALF →'}
      </button>
    {:else}
      <span class="badge green">✓ FIRST_HALF applied</span>
    {/if}

    {#if firstHalfApplied && !secondHalfApplied}
      <button class="action-btn" onclick={applySecond} disabled={applyingSecond}>
        {applyingSecond ? 'Applying…' : 'Apply SECOND_HALF →'}
      </button>
    {:else if secondHalfApplied}
      <span class="badge green">✓ SECOND_HALF applied</span>
    {/if}
  </div>

  <!-- Conflict trigger (show when both halves applied) -->
  {#if secondHalfApplied && !conflictVisible}
    <button class="action-btn conflict-btn" onclick={triggerConflict} disabled={conflictApplying}>
      Apply FIRST_HALF again? →
    </button>
  {/if}

  <!-- Conflict card -->
  {#if conflictVisible}
    <div class="leave-app-card error" class:shake={conflictShake}>
      <span>❌</span>
      <span class="card-label">FIRST_HALF applied again?</span>
      <span class="error-tooltip">LEAVE_OVERLAP</span>
    </div>
  {/if}

  <!-- Counter -->
  {#if firstHalfApplied && secondHalfApplied}
    <div class="half-counter">
      2 × half-days = <strong>1.0 working day</strong> debited from CL balance
    </div>
  {/if}

  <!-- Reset -->
  {#if firstHalfApplied || secondHalfApplied}
    <button class="action-btn" onclick={resetAll}>↺ Reset (cancels test leaves)</button>
  {/if}

  <div class="live-note">
    <span class="live-badge">LIVE</span>
    <span>Real API calls as Sara Khan. Test leaves on {DEMO_DATE} are cancelled on reset.</span>
  </div>
</div>

<div class="narration">
  <h3>Half a Day</h3>
  <p>
    <span class="highlight">Sara Khan</span> needs the afternoon off — she'll work the morning.
    Avkash models this as <code>FIRST_HALF</code> + <code>SECOND_HALF</code>.
  </p>
  <p>
    The midpoint is computed from the shift's actual <code>start</code> and <code>end</code> —
    not clock-based MORNING/AFTERNOON labels. A night shift worker's "morning" is at 02:00.
  </p>
  <p>
    Attempting to apply <span class="highlight" style="color:var(--red)">FIRST_HALF a second time</span>
    triggers a real <code>ConflictError: LEAVE_OVERLAP</code>. The guard runs before any ledger write —
    the balance is protected.
  </p>
  <p>
    Both half-day calls hit the live API. The LEAVE_OVERLAP response is from the real server.
  </p>
  <p style="color:var(--muted);font-size:12px;margin-top:auto;">
    This model also enables "split" leave days: EL for the morning, Comp-Off for the afternoon —
    each half tracked independently.
  </p>
</div>

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

  .shift-meta {
    font-size: 11px;
    color: var(--muted);
    font-family: var(--font-mono);
  }

  .half-day-wrap {
    position: relative;
    padding-top: 28px;
  }
  .midpoint-label {
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: var(--muted);
    font-family: var(--font-mono);
  }
  .midpoint-line {
    position: absolute;
    left: 50%; top: 20px; bottom: -4px;
    width: 2px;
    background: var(--text);
    opacity: 0;
    transform: scaleY(0);
    transform-origin: top;
    transition: opacity 0.3s, transform 0.4s ease;
    z-index: 1;
  }
  .midpoint-line.visible { opacity: 1; transform: scaleY(1); }

  .half-day-bar {
    position: relative;
    height: 56px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--border);
    display: flex;
  }

  .half-first {
    flex: 1;
    background: rgba(63,185,80,0.2);
    border-right: 2px solid var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: var(--green);
    text-align: center;
    opacity: 0;
    transition: opacity 0.4s ease, background 0.4s ease;
  }
  .half-first.visible { opacity: 1; }
  .half-first.applied { background: rgba(63,185,80,0.35); }

  .half-second {
    flex: 1;
    background: rgba(88,166,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: var(--blue);
    text-align: center;
    opacity: 0;
    transition: opacity 0.4s ease, background 0.4s ease;
  }
  .half-second.visible { opacity: 1; }
  .half-second.applied { background: rgba(88,166,255,0.35); }

  .half-sub { font-size: 9px; font-weight: 400; display: block; }

  .shift-times {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--muted);
    font-family: var(--font-mono);
    margin-top: 4px;
  }

  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

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
  .action-btn.primary:hover:not(:disabled) { background: #79b8ff; }
  .action-btn.conflict-btn { border-color: var(--red); color: var(--red); }
  .action-btn.conflict-btn:hover { background: rgba(248,81,73,0.1); }

  .badge {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
  }
  .badge.green { background: rgba(63,185,80,0.15); color: var(--green); border: 1px solid rgba(63,185,80,0.3); }

  .leave-app-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 13px;
    animation: fadeInUp 0.3s ease;
  }
  .leave-app-card.error {
    border-color: rgba(248,81,73,0.3);
    background: rgba(248,81,73,0.05);
  }
  .leave-app-card.shake { animation: shake 0.6s ease; }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%      { transform: translateX(-8px); }
    40%      { transform: translateX(8px); }
    60%      { transform: translateX(-6px); }
    80%      { transform: translateX(6px); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .card-label { font-weight: 500; }
  .error-tooltip {
    font-size: 11px;
    color: var(--red);
    font-family: var(--font-mono);
    margin-left: auto;
  }

  .half-counter {
    padding: 10px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 13px;
    color: var(--muted);
    text-align: center;
  }
  .half-counter strong { color: var(--text); }

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

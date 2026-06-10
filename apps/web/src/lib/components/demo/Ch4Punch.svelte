<script lang="ts">
  // Chapter 4 — Punch-In (SCRIPTED — attendance POST requires device auth)
  import { onMount } from 'svelte';
  import type { ConsoleEntry } from './DemoConsole.svelte';

  interface Props {
    onConsole: (entry: ConsoleEntry) => void;
  }

  let { onConsole }: Props = $props();

  type PunchState = 'ontime' | 'late';

  let punchState = $state<PunchState>('ontime');
  let markerDropped = $state(false);
  let markerPos = $state(3.125); // percent left
  let badgeVisible = $state(false);

  function setOntimeConsole() {
    onConsole({
      method: 'POST',
      path: '/attendance/punch',
      status: 200,
      ms: null,
      response: '{ marks: ["ON_TIME"], hours: 7.92, punchIn: "06:05" }',
      isError: false,
      scripted: true,
    });
  }

  onMount(() => {
    setOntimeConsole();
    setTimeout(() => {
      markerDropped = true;
      setTimeout(() => {
        markerDropped = false;
        badgeVisible = true;
      }, 700);
    }, 300);
  });

  function toggle() {
    if (punchState === 'ontime') {
      punchState = 'late';
      markerPos = 15.625; // 06:25 = 25min into 480min span
      onConsole({
        method: 'POST',
        path: '/attendance/punch',
        status: 200,
        ms: null,
        response: '{ marks: ["LATE"], hours: 7.58, punchIn: "06:25" }',
        isError: false,
        scripted: true,
      });
    } else {
      punchState = 'ontime';
      markerPos = 3.125;
      setOntimeConsole();
    }
  }
</script>

<div class="scene">
  <div class="section-title">Punch-In · A Shift · Assembly Team</div>

  <div class="punch-scene">
    <div class="shift-meta">
      A Shift: 06:00 → 14:00 &nbsp;·&nbsp; Grace: 10 min &nbsp;·&nbsp; OT threshold: 9h
    </div>

    <div class="shift-bar">
      <!-- Grace line at 06:10 = ~1.25% of 06:00–14:00 span = 10/480 -->
      <div class="grace-line" style="left:2.08%">
        <div class="grace-label">06:10 (grace ends)</div>
      </div>

      <!-- Punch marker -->
      <div
        class="punch-marker"
        class:dropped={markerDropped}
        class:placed={!markerDropped && badgeVisible}
        style="left:{markerPos}%"
      >
        <div class="punch-time-label">
          {punchState === 'ontime' ? '06:05' : '06:25'}
        </div>
        <div class="punch-dot" style="background:{punchState === 'ontime' ? 'var(--blue)' : 'var(--amber)'}"></div>
        <div class="punch-line"></div>
      </div>

      <span class="bar-label-left">06:00</span>
      <span class="bar-label-right">14:00</span>
    </div>
  </div>

  {#if badgeVisible}
    <div
      class="mark-badge"
      class:on-time={punchState === 'ontime'}
      class:late={punchState === 'late'}
    >
      {#if punchState === 'ontime'}
        <span>✓ ON_TIME</span>
      {:else}
        <span>⚠ LATE</span>
      {/if}
    </div>
  {/if}

  <div class="actions">
    <button class="action-btn" onclick={toggle}>
      {punchState === 'ontime' ? 'Punch in late →' : '↺ Reset to on-time'}
    </button>
  </div>

  <div class="emp-note">
    Sara Khan · Assembly Team · WEB punch (requires supervisor confirmation)
  </div>

  <div class="scripted-note">
    <span class="scripted-badge">SCRIPTED</span>
    <span>POST /attendance/punch requires device auth (DEVICE_AUTH error for WEB sessions). Animation shows expected API response.</span>
  </div>
</div>

<div class="narration">
  <h3>The First Punch</h3>
  <p>
    <span class="highlight">Sara Khan</span>, Assembly team, clocks in for her A Shift (06:00–14:00).
  </p>
  <p>
    The system computes attendance marks from the shift's <code>graceMinutes</code> field —
    not a hardcoded rule. Every shift can have its own grace window.
  </p>
  <p>
    <span class="highlight" style="color:var(--green)">06:05 → ON_TIME.</span> The grace window hasn't expired.
  </p>
  <p>
    <span class="highlight" style="color:var(--amber)">06:25 → LATE.</span> More than 10 minutes past shift start.
    The mark changes and the hours calculation adjusts.
  </p>
  <p style="color:var(--muted);font-size:12px;margin-top:auto;">
    WEB punches from team members require supervisor confirmation. Device terminal punches
    bypass this — hardware is trusted; browser is not.
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
    margin-bottom: 6px;
  }

  .shift-bar {
    height: 60px;
    background: rgba(63,185,80,0.12);
    border: 1px solid rgba(63,185,80,0.3);
    border-radius: 8px;
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 16px;
    overflow: visible;
  }

  .grace-line {
    position: absolute;
    width: 1px;
    background: var(--amber);
    top: -8px; bottom: -8px;
    opacity: 0.5;
  }
  .grace-label {
    position: absolute;
    top: -22px;
    font-size: 10px;
    color: var(--amber);
    font-family: var(--font-mono);
    white-space: nowrap;
    transform: translateX(-50%);
  }

  .punch-marker {
    position: absolute;
    top: -50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    opacity: 0;
    transition: left 0.5s ease;
  }
  .punch-marker.dropped {
    opacity: 1;
    animation: dropBounce 0.6s ease forwards;
    top: -8px;
  }
  .punch-marker.placed {
    opacity: 1;
    top: -8px;
  }

  @keyframes dropBounce {
    0%   { transform: translateY(-40px); opacity: 0; }
    60%  { transform: translateY(4px);  opacity: 1; }
    80%  { transform: translateY(-6px); }
    100% { transform: translateY(0); }
  }

  .punch-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
    transition: background 0.3s;
  }
  .punch-line {
    width: 2px;
    height: 70px;
    background: var(--blue);
  }
  .punch-time-label {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--blue);
    background: var(--surface);
    padding: 1px 4px;
    border-radius: 2px;
    white-space: nowrap;
  }

  .bar-label-left {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
    color: var(--muted);
  }
  .bar-label-right {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
    color: var(--muted);
  }

  .mark-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 700;
    position: relative;
    overflow: hidden;
    animation: fillSweep 0.6s ease forwards;
  }
  .mark-badge.on-time {
    background: rgba(63,185,80,0.15);
    color: var(--green);
    border: 1px solid rgba(63,185,80,0.3);
  }
  .mark-badge.late {
    background: rgba(210,153,34,0.15);
    color: var(--amber);
    border: 1px solid rgba(210,153,34,0.3);
  }

  @keyframes fillSweep {
    from { clip-path: inset(0 100% 0 0); }
    to   { clip-path: inset(0 0% 0 0); }
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
  .action-btn:hover { background: var(--surface); border-color: var(--blue); color: var(--blue); }

  .emp-note {
    font-size: 12px;
    color: var(--muted);
  }

  .scripted-note {
    margin-top: auto;
    padding: 10px 14px;
    background: rgba(210,153,34,0.08);
    border: 1px solid rgba(210,153,34,0.2);
    border-radius: 6px;
    font-size: 12px;
    color: var(--amber);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .scripted-badge {
    padding: 2px 6px;
    background: rgba(210,153,34,0.2);
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

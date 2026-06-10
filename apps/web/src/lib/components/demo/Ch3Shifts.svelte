<script lang="ts">
  // Chapter 3 — Shifts (SCRIPTED — no shift seed data)
  import { onMount } from 'svelte';
  import type { ConsoleEntry } from './DemoConsole.svelte';

  interface Props {
    onConsole: (entry: ConsoleEntry) => void;
  }

  let { onConsole }: Props = $props();

  const shifts = [
    { id: 'gen', name: 'General Shift',     start: '09:30', end: '18:30', crossesMidnight: false, trackOT: false, allowedGenders: null as null | string[],     minStaff: 0,  color: '#58a6ff', left: 39.58, width: 37.5,  gen: true },
    { id: 'a',   name: 'A · Morning',       start: '06:00', end: '14:00', crossesMidnight: false, trackOT: true,  allowedGenders: null,                         minStaff: 10, color: '#3fb950', left: 25,    width: 33.33, gen: false },
    { id: 'b',   name: 'B · Afternoon',     start: '14:00', end: '22:00', crossesMidnight: false, trackOT: true,  allowedGenders: null,                         minStaff: 10, color: '#d29922', left: 58.33, width: 33.33, gen: false },
    { id: 'c',   name: 'C · Night',         start: '22:00', end: '06:00', crossesMidnight: true,  trackOT: true,  allowedGenders: ['MALE'],                     minStaff: 8,  color: '#f85149', left: 91.67, width: 8.33,  gen: false },
  ];

  let segsVisible = $state([false, false, false, false]);
  let chipsVisible = $state(false);

  onMount(() => {
    onConsole({
      method: 'GET',
      path: '/shifts',
      status: 200,
      ms: null,
      response: '4 shifts — C shift: { allowedGenders: ["MALE"], crossesMidnight: true, trackOT: true }',
      isError: false,
      scripted: true,
    });

    [300, 700, 1100, 1500].forEach((delay, i) => {
      setTimeout(() => {
        segsVisible[i] = true;
        segsVisible = [...segsVisible];
      }, delay);
    });

    setTimeout(() => { chipsVisible = true; }, 1800);
  });
</script>

<div class="scene">
  <div class="section-title">24-Hour Shift Coverage</div>

  <div class="timeline-wrap">
    <div class="timeline-header">
      <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
    </div>
    <div class="timeline-bar">
      <!-- C Night — part 1 (22:00–24:00) at right -->
      <div
        class="shift-seg"
        class:visible={segsVisible[3]}
        style="left:91.67%;width:8.33%;background:rgba(248,81,73,0.25);color:#f85149"
      ></div>
      <!-- C Night — part 2 (00:00–06:00) at left -->
      <div
        class="shift-seg"
        class:visible={segsVisible[3]}
        style="left:0%;width:25%;background:rgba(248,81,73,0.25);color:#f85149"
      >
        <span class="shift-seg-label">C · Night</span>
      </div>
      <!-- A Morning -->
      <div
        class="shift-seg"
        class:visible={segsVisible[1]}
        style="left:25%;width:33.33%;background:rgba(63,185,80,0.25);color:#3fb950"
      >
        <span class="shift-seg-label">A · Morning</span>
      </div>
      <!-- B Afternoon -->
      <div
        class="shift-seg"
        class:visible={segsVisible[2]}
        style="left:58.33%;width:33.33%;background:rgba(210,153,34,0.25);color:#d29922"
      >
        <span class="shift-seg-label">B · Afternoon</span>
      </div>
      <!-- General (dashed, on top) -->
      <div
        class="shift-seg shift-gen"
        class:visible={segsVisible[0]}
        style="left:39.58%;width:37.5%;color:#58a6ff;border-color:#58a6ff;background:rgba(88,166,255,0.08)"
      >
        <span class="shift-seg-label">General · HQ</span>
      </div>
    </div>
    <div class="timeline-markers">
      <span>0</span><span>3h</span><span>6h</span><span>9h</span><span>12h</span><span>15h</span><span>18h</span><span>21h</span><span>24h</span>
    </div>
  </div>

  <div class="shift-chips" class:visible={chipsVisible}>
    {#each shifts as sh (sh.id)}
      <div class="shift-chip">
        <div class="shift-dot" style="background:{sh.color}"></div>
        <span class="chip-name">{sh.name}</span>
        <span class="chip-times">{sh.start}–{sh.end}</span>
        {#if sh.trackOT}
          <span class="badge amber">OT</span>
        {/if}
        {#if sh.crossesMidnight}
          <span class="badge red">↻ midnight</span>
        {/if}
        {#if sh.allowedGenders}
          <span class="badge red">♂ only</span>
        {/if}
      </div>
    {/each}
  </div>

  <div class="gender-note">
    ⚠ C Shift: Male only · Factories Act compliance
  </div>

  <div class="scripted-note">
    <span class="scripted-badge">SCRIPTED</span>
    <span>Shifts not yet seeded for Meridian. Data reflects design spec.</span>
  </div>
</div>

<div class="narration">
  <h3>Three Shifts, One Clock</h3>
  <p>
    Factory workers rotate through 3 shifts covering all 24 hours. The <span class="highlight">General Shift</span>
    (09:30–18:30) is HQ-only — no overtime tracking for executives.
  </p>
  <p>
    The <span class="highlight" style="color:var(--red)">C Shift (Night)</span> crosses midnight — 22:00 to 06:00.
    Avkash marks this with <code>crossesMidnight: true</code> so attendance spans two calendar dates correctly.
  </p>
  <p>
    A legal restriction applies: <span class="highlight" style="color:var(--red)">no female workers at night</span>
    in the SEZ plant (Factories Act). The <code>allowedGenders</code> field enforces this at shift assignment time.
  </p>
  <p style="color:var(--muted);font-size:12px;margin-top:auto;">
    General Shift has <code>trackOT: false</code> — a policy decision, not a system limitation.
  </p>
</div>

<style>
  .scene {
    flex: 0 0 60%;
    padding: 40px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 16px;
  }

  .timeline-wrap { margin: 0 0 24px; }
  .timeline-header {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--muted);
    margin-bottom: 6px;
    font-family: var(--font-mono);
  }

  .timeline-bar {
    position: relative;
    height: 40px;
    background: var(--surface2);
    border-radius: 4px;
    overflow: visible;
  }

  .shift-seg {
    position: absolute;
    height: 100%;
    border-radius: 3px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    font-size: 11px;
    font-weight: 600;
    overflow: hidden;
    transition: all 0.5s ease;
    opacity: 0;
    cursor: default;
  }
  .shift-seg.visible { opacity: 0.9; }
  .shift-seg.shift-gen {
    border: 2px dashed;
    opacity: 0;
  }
  .shift-seg.shift-gen.visible { opacity: 0.9; }
  .shift-seg-label { white-space: nowrap; overflow: hidden; }

  .timeline-markers {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: var(--muted);
    margin-top: 4px;
    font-family: var(--font-mono);
    padding: 0 1px;
  }

  .shift-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .shift-chips.visible { opacity: 1; }

  .shift-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 12px;
  }

  .shift-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .chip-name  { font-weight: 500; }
  .chip-times { font-size: 10px; color: var(--muted); font-family: var(--font-mono); }

  .badge {
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 600;
  }
  .badge.amber { background: rgba(210,153,34,0.15); color: var(--amber); }
  .badge.red   { background: rgba(248,81,73,0.15);  color: var(--red); }

  .gender-note {
    font-size: 12px;
    color: var(--red);
    padding: 8px 12px;
    background: rgba(248,81,73,0.08);
    border: 1px solid rgba(248,81,73,0.2);
    border-radius: 6px;
    margin-bottom: 12px;
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

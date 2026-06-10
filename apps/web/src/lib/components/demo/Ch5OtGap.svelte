<script lang="ts">
  // Chapter 5 — OT Gap (SCRIPTED — no OT seed data)
  import { onMount } from 'svelte';
  import type { ConsoleEntry } from './DemoConsole.svelte';

  interface Props {
    onConsole: (entry: ConsoleEntry) => void;
  }

  let { onConsole }: Props = $props();

  let puneFillW = $state('0%');
  let sezFillW  = $state('0%');
  let puneOtW   = $state('0%');
  let sezOtW    = $state('0%');
  let threshVisible = $state(false);
  let otLabelVisible = $state(false);

  onMount(() => {
    onConsole({
      method: 'GET',
      path: '/attendance?userId=…&date=2026-06-04',
      status: 200,
      ms: null,
      response: '{ pune: { overtimeHours: 1.5, threshold: 9h }, sez: { overtimeHours: 0.5, threshold: 10h } }',
      isError: false,
      scripted: true,
    });

    setTimeout(() => {
      puneFillW = '87.5%';
      sezFillW  = '87.5%';
      threshVisible = true;
    }, 400);

    setTimeout(() => {
      puneOtW = '12.5%';
      sezOtW  = '4.17%';
      otLabelVisible = true;
    }, 1800);
  });
</script>

<div class="scene">
  <div class="section-title">Overtime Threshold Comparison — Same Hours, Different Rules</div>

  <div class="ot-scene">
    <!-- Pune MIDC -->
    <div class="ot-plant">
      <h4>📍 Coimbatore Plant <span class="badge muted">STANDARD</span></h4>
      <div class="plant-meta">Deepak · Operator · Worked 10.5h</div>
      <div class="hours-labels"><span>0h</span><span>3h</span><span>6h</span><span>9h</span><span>12h</span></div>
      <div class="hours-track">
        <div class="hours-fill" style="width:{puneFillW}"></div>
        <div class="ot-fill" style="left:75%;width:{puneOtW}"></div>
        <div class="threshold-line" class:visible={threshVisible} style="left:75%">
          <div class="threshold-label">9h</div>
        </div>
      </div>
      <div class="ot-label" class:visible={otLabelVisible}>▲ 1.5h Overtime (OT)</div>
      <div class="regime-note">Threshold: <strong>9h</strong> (STANDARD regime)</div>
    </div>

    <!-- Silvassa SEZ -->
    <div class="ot-plant">
      <h4>📍 Bengaluru HQ <span class="badge gold">SEZ</span></h4>
      <div class="plant-meta">Anwar · Operator · Worked 10.5h</div>
      <div class="hours-labels"><span>0h</span><span>3h</span><span>6h</span><span>9h</span><span>12h</span></div>
      <div class="hours-track">
        <div class="hours-fill" style="width:{sezFillW}"></div>
        <div class="ot-fill" style="left:83.33%;width:{sezOtW}"></div>
        <div class="threshold-line" class:visible={threshVisible} style="left:83.33%">
          <div class="threshold-label">10h</div>
        </div>
      </div>
      <div class="ot-label" class:visible={otLabelVisible}>▲ 0.5h Overtime (OT)</div>
      <div class="regime-note">Threshold: <strong>10h</strong> (SEZ · Factories Act 2017)</div>
    </div>
  </div>

  <div class="diff-callout">
    ⚖ Same 10.5 hours worked &nbsp;·&nbsp; <strong>3× more OT pay</strong> at the standard plant (1.5h vs 0.5h)
  </div>

  <div class="scripted-note">
    <span class="scripted-badge">SCRIPTED</span>
    <span>OT seed data not yet added. Animation shows the design spec behavior.</span>
  </div>
</div>

<div class="narration">
  <h3>The Overtime Gap</h3>
  <p>
    The SEZ labour regime follows the <span class="highlight">Factories Act (Amendment) 2017</span>,
    which raises the daily OT threshold from 9 hours to 10 hours.
  </p>
  <p>
    Avkash reads <code>overtimeThresholdHours</code> directly from the location record —
    <strong>no hardcoded rules</strong>. The same resolver handles all regimes.
  </p>
  <p>
    Result: Deepak at Coimbatore earns <span class="highlight" style="color:var(--amber)">1.5h OT pay</span>.
    Anwar at Bengaluru earns <span class="highlight" style="color:var(--amber)">0.5h OT pay</span>. Same clock. Different laws.
  </p>
  <p style="color:var(--muted);font-size:12px;margin-top:auto;">
    When a location's regime changes (e.g. new SEZ notification), updating the single <code>regime</code>
    field re-calibrates all future attendance computations automatically.
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

  .ot-scene { display: flex; gap: 24px; }

  .ot-plant {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
  }
  .ot-plant h4 {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .plant-meta { font-size: 12px; color: var(--muted); margin-bottom: 12px; }

  .hours-labels {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: var(--muted);
    font-family: var(--font-mono);
    margin-bottom: 4px;
  }

  .hours-track {
    position: relative;
    height: 28px;
    background: var(--surface2);
    border-radius: 4px;
    overflow: visible;
    margin-bottom: 8px;
  }

  .hours-fill {
    height: 100%;
    border-radius: 4px;
    background: rgba(88,166,255,0.4);
    width: 0;
    transition: width 1.2s ease;
  }
  .ot-fill {
    position: absolute;
    top: 0; bottom: 0;
    border-radius: 0 4px 4px 0;
    background: rgba(210,153,34,0.7);
    width: 0;
    transition: width 0.8s ease 1.4s;
  }

  .threshold-line {
    position: absolute;
    top: -6px; bottom: -6px;
    width: 2px;
    background: var(--red);
    opacity: 0;
    transition: opacity 0.4s ease 1.2s;
  }
  .threshold-line.visible { opacity: 0.8; }
  .threshold-label {
    position: absolute;
    top: -22px;
    font-size: 9px;
    color: var(--red);
    font-family: var(--font-mono);
    transform: translateX(-50%);
    white-space: nowrap;
  }

  .ot-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--amber);
    margin-top: 4px;
    opacity: 0;
    transition: opacity 0.4s ease 2s;
  }
  .ot-label.visible { opacity: 1; }
  .regime-note { font-size: 11px; color: var(--muted); margin-top: 8px; }
  .regime-note strong { color: var(--text); }

  .badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
  }
  .badge.muted { background: rgba(139,148,158,0.15); color: var(--muted); }
  .badge.gold  { background: rgba(210,153,34,0.25); color: #f0c040; border: 1px solid rgba(240,192,64,0.4); }

  .diff-callout {
    padding: 12px 16px;
    background: rgba(210,153,34,0.08);
    border: 1px solid rgba(210,153,34,0.2);
    border-radius: 8px;
    font-size: 12px;
    color: var(--amber);
    text-align: center;
    animation: fadeInUp 0.5s ease 3s both;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
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

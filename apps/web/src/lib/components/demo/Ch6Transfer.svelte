<script lang="ts">
  // Chapter 6 — Transfer (LIVE list — no approval performed)
  import { onMount } from 'svelte';
  import type { ConsoleEntry } from './DemoConsole.svelte';

  interface Props {
    transferCount: number;
    onConsole: (entry: ConsoleEntry) => void;
  }

  let { transferCount, onConsole }: Props = $props();

  let transferred = $state(false);
  let effectiveVisible = $state(false);
  let otBadgeFlipping = $state(false);
  let empLocation = $state('Coimbatore Plant');
  let otText = $state('9h OT');
  let otColor = $state('green');

  onMount(() => {
    onConsole({
      method: 'GET',
      path: '/transfers',
      status: 200,
      ms: null,
      response: `{ data: [], count: ${transferCount} } — no pending transfers in seed`,
      isError: false,
    });
  });

  function doTransfer() {
    if (transferred) return;
    transferred = true;

    otBadgeFlipping = true;
    setTimeout(() => {
      otText = '10h OT';
      otColor = 'amber';
      otBadgeFlipping = false;
    }, 250);
    setTimeout(() => { empLocation = 'Bengaluru HQ'; }, 400);
    setTimeout(() => { effectiveVisible = true; }, 600);

    onConsole({
      method: 'POST',
      path: '/transfers',
      status: 201,
      ms: null,
      response: '{ id: "txf_…", status: "PENDING", fromDate: "2026-06-10" } — scripted (mutation not sent)',
      isError: false,
      scripted: true,
    });
  }

  function resetTransfer() {
    transferred = false;
    effectiveVisible = false;
    otBadgeFlipping = false;
    empLocation = 'Coimbatore Plant';
    otText = '9h OT';
    otColor = 'green';
    onConsole({
      method: 'GET',
      path: '/transfers',
      status: 200,
      ms: null,
      response: `{ data: [], count: ${transferCount} }`,
      isError: false,
    });
  }
</script>

<div class="scene">
  <div class="section-title">Transfer Management</div>

  <div class="plant-cards">
    <div class="plant-card coimbatore">
      <div class="plant-name">🏭 Coimbatore Plant</div>
      <div class="plant-city">Coimbatore, Tamil Nadu</div>
      <div class="plant-ot">OT Threshold</div>
      <div class="ot-badge green">9h (STANDARD)</div>
    </div>
    <div class="plant-card bengaluru">
      <div class="plant-name">🏢 Bengaluru HQ</div>
      <div class="plant-city">Bengaluru, Karnataka</div>
      <div class="plant-ot">OT Threshold</div>
      <div class="ot-badge amber">10h (SEZ)</div>
    </div>
  </div>

  <div class="transfer-wrap">
    <div class="emp-wrap" style="transform: translateX({transferred ? 'calc(50vw - 300px)' : '0'}); transition: transform 0.6s cubic-bezier(0.34,1.56,0.64,1)">
      <div class="emp-avatar">
        <div class="avatar-circle">S</div>
        <div class="emp-info">
          <div class="emp-name">Sara Khan</div>
          <div class="emp-role">Assembly Team · <span>{empLocation}</span></div>
        </div>
        <div class="emp-ot-badge" class:flipping={otBadgeFlipping} class:green={otColor === 'green'} class:amber={otColor === 'amber'}>
          {otText}
        </div>
      </div>
      <div class="effective-note" class:visible={effectiveVisible}>
        Effective from 2026-06-10 →
      </div>
    </div>

    <div class="actions">
      {#if !transferred}
        <button class="action-btn" onclick={doTransfer}>Transfer to Bengaluru →</button>
      {:else}
        <button class="action-btn" onclick={resetTransfer}>↺ Reset</button>
      {/if}
    </div>
  </div>

  <div class="live-note">
    <span class="live-badge">LIVE</span>
    <span>GET /transfers returns real data ({transferCount} transfers in seed). Transfer animation is scripted — mutation NOT sent to API.</span>
  </div>
</div>

<div class="narration">
  <h3>On the Move</h3>
  <p>
    <span class="highlight">Sara Khan</span> is transferred to the Bengaluru HQ for the new production line ramp-up.
  </p>
  <p>
    From <span class="highlight">2026-06-10</span>, her attendance is computed against the HQ's
    <span class="highlight" style="color:var(--amber)">10h OT threshold</span>. The transfer record carries a
    <code>fromDate</code> — past punches are not retroactively changed.
  </p>
  <p>
    The system resolves which location applies for a given punch date by walking the transfer history,
    picking the record whose <code>fromDate ≤ punchDate</code>.
  </p>
  <p style="color:var(--muted);font-size:12px;margin-top:auto;">
    Future-dated transfers are queued and applied by the nightly cron.
    HR can schedule them in advance during notice periods.
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

  .plant-cards { display: flex; gap: 20px; }
  .plant-card {
    flex: 1;
    background: var(--surface);
    border-radius: 10px;
    padding: 16px;
    text-align: center;
  }
  .plant-card.coimbatore { border: 2px solid rgba(63,185,80,0.4); }
  .plant-card.bengaluru  { border: 2px solid rgba(210,153,34,0.4); }
  .plant-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
  .plant-city { font-size: 11px; color: var(--muted); margin-bottom: 8px; }
  .plant-ot   { font-size: 12px; color: var(--muted); margin-bottom: 4px; }
  .ot-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  .ot-badge.green { background: rgba(63,185,80,0.15);  color: var(--green); }
  .ot-badge.amber { background: rgba(210,153,34,0.15); color: var(--amber); }

  .transfer-wrap { position: relative; }

  .emp-wrap {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .emp-avatar {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 16px;
  }
  .avatar-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(88,166,255,0.2);
    border: 2px solid var(--blue);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    color: var(--blue);
  }
  .emp-name { font-weight: 600; font-size: 13px; }
  .emp-role { font-size: 11px; color: var(--muted); }

  .emp-ot-badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.3s ease;
  }
  .emp-ot-badge.green { background: rgba(63,185,80,0.15);  color: var(--green); }
  .emp-ot-badge.amber { background: rgba(210,153,34,0.15); color: var(--amber); }
  .emp-ot-badge.flipping { animation: badgeFlip 0.5s ease; }

  @keyframes badgeFlip {
    0%   { transform: rotateY(0deg); }
    50%  { transform: rotateY(90deg); }
    100% { transform: rotateY(0deg); }
  }

  .effective-note {
    font-size: 11px;
    color: var(--muted);
    font-family: var(--font-mono);
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .effective-note.visible { opacity: 1; }

  .actions { margin-top: 16px; }

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

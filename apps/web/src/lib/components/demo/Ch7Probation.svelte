<script lang="ts">
  // Chapter 7 — Probation (LIVE — leave policies seeded; probation fields visible)
  import { onMount } from 'svelte';
  import type { ConsoleEntry } from './DemoConsole.svelte';

  interface Props {
    policies: Array<{
      leavePolicyId: string;
      leaveTypeId: string;
      maxLeaves: number;
      accruals: boolean;
      probationMaxLeaves: number | null;
      probationAccruals: boolean | null;
    }>;
    leaveTypes: Array<{ leaveTypeId: string; name: string }>;
    onConsole: (entry: ConsoleEntry) => void;
  }

  let { policies, leaveTypes, onConsole }: Props = $props();

  let advanced = $state(false);
  let probBarWidth = $state('90%');
  let statusFlipped = $state(false);
  let lockUnlocked = $state(false);
  let elNumber = $state(0);

  // Find Earned Leave policy
  const elTypeName = 'Earned Leave';
  const elType = $derived(leaveTypes.find(t => t.name === elTypeName));
  const elPolicy = $derived(elType ? policies.find(p => p.leaveTypeId === elType.leaveTypeId) : null);

  // CL policy
  const clTypeName = 'Casual Leave';
  const clType = $derived(leaveTypes.find(t => t.name === clTypeName));
  const clPolicy = $derived(clType ? policies.find(p => p.leaveTypeId === clType.leaveTypeId) : null);

  onMount(() => {
    onConsole({
      method: 'GET',
      path: '/leave-policies',
      status: 200,
      ms: null,
      response: `{ EL: { maxLeaves: ${elPolicy?.maxLeaves ?? 15}, accruals: ${elPolicy?.accruals ?? true}, probationMaxLeaves: ${elPolicy?.probationMaxLeaves ?? 'null'} }, CL: { maxLeaves: ${clPolicy?.maxLeaves ?? 12} } }`,
      isError: false,
    });
  });

  function advance() {
    if (advanced) return;
    advanced = true;

    // Bar fills to 100%
    probBarWidth = '100%';

    // Flip status badge
    setTimeout(() => { statusFlipped = true; }, 800);

    // Unlock EL
    setTimeout(() => { lockUnlocked = true; }, 1200);

    // Count up EL
    setTimeout(() => {
      const target = elPolicy?.maxLeaves ?? 15;
      let n = 0;
      const interval = setInterval(() => {
        n++;
        elNumber = n;
        if (n >= target) clearInterval(interval);
      }, 800 / target);
    }, 1400);

    onConsole({
      method: 'POST',
      path: '/internal/run-probation-completion',
      status: 200,
      ms: null,
      response: '{ transitioned: 1, userIds: ["sunita-id"] } → getBalance(EL) → { available: 15, locked: false }',
      isError: false,
      scripted: true,
    });
  }
</script>

<div class="scene">
  <div class="section-title">Probation Period · Sunita Yadav</div>

  <div class="sunita-card">
    <div class="emp-header">
      <div class="avatar-s">S</div>
      <div>
        <div class="emp-name-lg">Sunita Yadav</div>
        <div class="emp-sub">Helper Gr. I · Coimbatore Plant · Joined Nov 2025</div>
      </div>
      <div class="status-wrap">
        {#if !statusFlipped}
          <span class="badge amber">PROBATION</span>
        {:else}
          <span class="badge green" style="animation: badgeFlip 0.5s ease">ACTIVE</span>
        {/if}
      </div>
    </div>

    <div class="prob-meta">Probation period: Nov 2025 → May 2026 (240 working days)</div>
    <div class="probation-timeline">
      <div class="probation-bar" style="width:{probBarWidth}"></div>
    </div>
    <div class="prob-dates">
      <span>Nov 2025 (joined)</span>
      <span>{advanced ? 'Jun 2026 (graduated ✓)' : 'May 2026 (probation ends)'}</span>
    </div>
  </div>

  <!-- EL Counter -->
  <div class="el-counter-wrap">
    <div>
      <div class="el-label">Earned Leave (EL) Balance</div>
      <div class="el-num-row">
        <div class="el-number">{elNumber}</div>
        <div class="el-denom">/ {elPolicy?.maxLeaves ?? 15}</div>
      </div>
    </div>
    <div class="el-lock">{lockUnlocked ? '🔓' : '🔒'}</div>
    <div class="el-lock-note">
      {#if lockUnlocked}
        EL unlocked — {elPolicy?.maxLeaves ?? 15} days accrued on completion
      {:else}
        EL locked during probation — accrues after 240 working days (Factories Act)
      {/if}
    </div>
  </div>

  <!-- Policies from API -->
  <div class="policy-table">
    <div class="pt-header">
      <span>Leave Type</span>
      <span>Max Leaves</span>
      <span>Accruals</span>
      <span>Probation Cap</span>
    </div>
    {#each policies as p (p.leavePolicyId)}
      {@const lt = leaveTypes.find(t => t.leaveTypeId === p.leaveTypeId)}
      <div class="pt-row">
        <span>{lt?.name ?? p.leaveTypeId.slice(0, 8)}</span>
        <span>{p.maxLeaves}</span>
        <span class:yes={p.accruals} class:no={!p.accruals}>{p.accruals ? 'Yes' : 'No'}</span>
        <span class="prob-cap">{p.probationMaxLeaves ?? '—'}</span>
      </div>
    {/each}
  </div>

  {#if !advanced}
    <button class="action-btn primary" onclick={advance}>Advance to June 2026 →</button>
  {/if}
</div>

<div class="narration">
  <h3>On Probation</h3>
  <p>
    <span class="highlight">Sunita Yadav</span> joined as a Helper Gr. I in November 2025.
    Factory workers must complete <span class="highlight">240 days of work</span> (Factories Act)
    before Earned Leave accrues.
  </p>
  <p>
    During probation, a <span class="highlight" style="color:var(--amber)">policy overlay</span>
    caps her EL at 0 regardless of what the base leave policy says.
    The overlay is scoped to <code>employmentStatus = PROBATION</code>.
  </p>
  <p>
    On <span class="highlight">June 1, 2026</span> — after the daily cron runs — she graduates automatically.
    The cron calls <code>runProbationCompletion()</code>, transitions her status to ACTIVE,
    and immediately posts {elPolicy?.maxLeaves ?? 15} days of EL credit.
  </p>
  <p>
    The leave policy table above is <span class="highlight" style="color:var(--green)">live from the API</span> —
    real Meridian seed data.
  </p>
  <p style="color:var(--muted);font-size:12px;margin-top:auto;">
    The policy overlay pattern means zero special-casing in the leave resolver —
    it reads overlays, base policy, and location in priority order.
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

  .sunita-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
  }

  .emp-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .avatar-s {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(210,153,34,0.2);
    border: 2px solid var(--amber);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    color: var(--amber);
  }
  .emp-name-lg { font-weight: 600; font-size: 15px; }
  .emp-sub     { font-size: 12px; color: var(--muted); }
  .status-wrap { margin-left: auto; }

  .badge {
    display: inline-flex;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  .badge.amber { background: rgba(210,153,34,0.15); color: var(--amber); }
  .badge.green { background: rgba(63,185,80,0.15);  color: var(--green); }

  @keyframes badgeFlip {
    0%   { transform: rotateY(0deg); }
    50%  { transform: rotateY(90deg); }
    100% { transform: rotateY(0deg); }
  }

  .prob-meta { font-size: 12px; color: var(--muted); margin-bottom: 10px; }

  .probation-timeline {
    position: relative;
    background: var(--surface2);
    border-radius: 6px;
    height: 10px;
  }
  .probation-bar {
    height: 100%;
    background: linear-gradient(to right, var(--amber), var(--green));
    border-radius: 6px;
    transition: width 1.2s ease;
  }

  .prob-dates {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--muted);
    font-family: var(--font-mono);
    margin-top: 4px;
  }

  .el-counter-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--surface2);
    border-radius: 8px;
  }
  .el-label  { font-size: 12px; color: var(--muted); margin-bottom: 2px; }
  .el-num-row { display: flex; align-items: baseline; gap: 6px; }
  .el-number { font-size: 28px; font-weight: 700; font-family: var(--font-mono); color: var(--text); }
  .el-denom  { font-size: 14px; color: var(--muted); }
  .el-lock   { font-size: 18px; transition: opacity 0.5s; }
  .el-lock-note { font-size: 11px; color: var(--muted); max-width: 160px; }

  .policy-table {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    font-size: 12px;
  }
  .pt-header {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr;
    padding: 8px 14px;
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
  }
  .pt-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr;
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
    align-items: center;
  }
  .pt-row:last-child { border-bottom: none; }
  .yes { color: var(--green); }
  .no  { color: var(--muted); }
  .prob-cap { color: var(--amber); }

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
  .action-btn.primary { background: var(--blue); color: #000; border-color: var(--blue); }
  .action-btn.primary:hover { background: #79b8ff; }

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

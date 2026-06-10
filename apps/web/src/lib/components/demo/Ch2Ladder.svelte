<script lang="ts">
  // Chapter 2 — Employment Levels (SCRIPTED — no org-levels seed data)
  import { onMount } from 'svelte';
  import type { ConsoleEntry } from './DemoConsole.svelte';

  interface Props {
    onConsole: (entry: ConsoleEntry) => void;
  }

  let { onConsole }: Props = $props();

  const levels = [
    { code: 'DIR',  name: 'Director',                rank: 100, floating: true,  punchConfirm: false, color: '#bc8cff' },
    { code: 'GM',   name: 'General Manager',         rank: 80,  floating: true,  punchConfirm: false, color: '#bc8cff' },
    { code: 'DGM',  name: 'Deputy General Manager',  rank: 65,  floating: false, punchConfirm: false, color: '#58a6ff' },
    { code: 'MGR',  name: 'Manager',                 rank: 50,  floating: false, punchConfirm: false, color: '#58a6ff' },
    { code: 'AM',   name: 'Asst. Manager / Officer', rank: 40,  floating: false, punchConfirm: false, color: '#58a6ff' },
    { code: 'SUP',  name: 'Supervisor / Foreman',    rank: 30,  floating: false, punchConfirm: false, color: '#3fb950' },
    { code: 'TECH', name: 'Technician / ITI',        rank: 20,  floating: false, punchConfirm: false, color: '#3fb950' },
    { code: 'OPR',  name: 'Machine Operator',        rank: 15,  floating: false, punchConfirm: true,  color: '#d29922' },
    { code: 'HLP1', name: 'Helper Gr. I',            rank: 10,  floating: false, punchConfirm: true,  color: '#8b949e' },
    { code: 'HLP2', name: 'Helper Gr. II',           rank: 5,   floating: false, punchConfirm: true,  color: '#8b949e' },
  ];

  let rowsVisible = $state(levels.map(() => false));

  onMount(() => {
    onConsole({
      method: 'GET',
      path: '/org-levels',
      status: 200,
      ms: null,
      response: '[ { code: "DIR", rank: 100, isFloating: true }, { code: "GM", rank: 80, isFloating: true }, … 8 more ]',
      isError: false,
      scripted: true,
    });

    levels.forEach((_, i) => {
      setTimeout(() => {
        rowsVisible[i] = true;
        rowsVisible = [...rowsVisible];
      }, 100 + i * 80);
    });
  });
</script>

<div class="scene">
  <div class="section-title">Employment Levels</div>
  <div class="levels-list">
    {#each levels as lvl, i (lvl.code)}
      <div class="level-row" class:visible={rowsVisible[i]}>
        <div
          class="level-rank"
          style="background:{lvl.color}22;color:{lvl.color};border:1px solid {lvl.color}44"
        >
          {lvl.rank}
        </div>
        <div class="level-info">
          <span class="level-name">{lvl.name}</span>
          <span class="level-code">{lvl.code}</span>
        </div>
        <div class="level-icons">
          <span class="level-icon floating" class:active={lvl.floating} title="Floating punch">◈</span>
          <span class="level-icon confirm" class:active={lvl.punchConfirm} title="Confirm WEB punch">✋</span>
        </div>
      </div>
    {/each}
  </div>
  <div class="scripted-note">
    <span class="scripted-badge">SCRIPTED</span>
    <span>Org-levels are not yet seeded for Meridian. Data above reflects the design spec.</span>
  </div>
</div>

<div class="narration">
  <h3>The Ladder</h3>
  <p>
    Meridian doesn't use a flat <span class="highlight">WORKER / EXECUTIVE</span> enum.
    They have <span class="highlight">10 named levels</span> with a numeric rank — from Director (100) down to Helper Gr. II (5).
  </p>
  <p>
    <span class="highlight" style="color:var(--purple)">Directors and GMs float</span> — their punch routes
    to wherever they're physically present. This avoids the fiction of a Director "belonging" to one plant.
  </p>
  <p>
    <span class="highlight" style="color:var(--amber)">Operators, Helper Gr. I and II</span> require a supervisor
    to confirm their WEB punches before they count toward attendance. Device punches bypass this — hardware is trusted.
  </p>
  <p style="color:var(--muted);font-size:12px;margin-top:auto;">
    The rank field enables leave policy inheritance — policies can be restricted to rank ≥ 40 (officer and above)
    with a single config flag.
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

  .levels-list { display: flex; flex-direction: column; gap: 4px; }

  .level-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    opacity: 0;
    transform: translateX(-30px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .level-row.visible { opacity: 1; transform: translateX(0); }

  .level-rank {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
    flex-shrink: 0;
  }

  .level-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .level-name { font-size: 13px; font-weight: 500; color: var(--text); }
  .level-code { font-size: 10px; color: var(--muted); font-family: var(--font-mono); }

  .level-icons { display: flex; gap: 6px; align-items: center; }
  .level-icon {
    font-size: 14px;
    padding: 2px 4px;
    border-radius: 3px;
    opacity: 0.2;
    transition: opacity 0.2s;
  }
  .level-icon.active { opacity: 1; }
  .level-icon.floating.active { color: var(--purple); }
  .level-icon.confirm.active  { color: var(--amber); }

  .scripted-note {
    margin-top: 20px;
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

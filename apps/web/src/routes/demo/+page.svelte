<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { PageData } from './$types';
  import type { ConsoleEntry } from '$lib/components/demo/DemoConsole.svelte';
  import DemoConsole from '$lib/components/demo/DemoConsole.svelte';
  import Ch0Intro from '$lib/components/demo/Ch0Intro.svelte';
  import Ch1Company from '$lib/components/demo/Ch1Company.svelte';
  import Ch2Ladder from '$lib/components/demo/Ch2Ladder.svelte';
  import Ch3Shifts from '$lib/components/demo/Ch3Shifts.svelte';
  import Ch4Punch from '$lib/components/demo/Ch4Punch.svelte';
  import Ch5OtGap from '$lib/components/demo/Ch5OtGap.svelte';
  import Ch6Transfer from '$lib/components/demo/Ch6Transfer.svelte';
  import Ch7Probation from '$lib/components/demo/Ch7Probation.svelte';
  import Ch8Leave from '$lib/components/demo/Ch8Leave.svelte';
  import Ch9HalfDay from '$lib/components/demo/Ch9HalfDay.svelte';

  let { data }: { data: PageData } = $props();

  // ── Chapter navigation ──────────────────────────────────────────────────────
  const TOTAL_CHAPTERS = 9; // 0 = intro, 1-9 = chapters
  let currentChapter = $state(0);
  let direction = $state<'forward' | 'backward'>('forward');
  let transitioning = $state(false);

  // Per-chapter console state
  let consoleEntry = $state<ConsoleEntry | null>(null);

  function onConsole(entry: ConsoleEntry) {
    consoleEntry = entry;
  }

  // Chapter pills (0=Intro, 1-9=chapters)
  const pills = [
    { n: 0, label: '0 · Intro' },
    { n: 1, label: '1 · Company' },
    { n: 2, label: '2 · Ladder' },
    { n: 3, label: '3 · Shifts' },
    { n: 4, label: '4 · Punch' },
    { n: 5, label: '5 · OT Gap' },
    { n: 6, label: '6 · Transfer' },
    { n: 7, label: '7 · Probation' },
    { n: 8, label: '8 · Leave' },
    { n: 9, label: '9 · Half Day' },
  ];

  function goTo(n: number) {
    if (n < 0 || n > TOTAL_CHAPTERS || n === currentChapter || transitioning) return;
    direction = n > currentChapter ? 'forward' : 'backward';
    transitioning = true;
    setTimeout(() => {
      currentChapter = n;
      consoleEntry = null;
      transitioning = false;
    }, 50);
  }

  // Keyboard navigation
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentChapter + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(currentChapter - 1); }
  }

  // API status dot (polls /health/ready)
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);

    const dot   = document.getElementById('demo-api-dot');
    const label = document.getElementById('demo-api-label');
    const API   = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3001';

    async function poll() {
      try {
        const r = await fetch(`${API}/health/ready`, { signal: AbortSignal.timeout(2000) });
        if (dot)   { dot.className = r.ok ? 'api-dot connected' : 'api-dot offline'; }
        if (label) { label.textContent = r.ok ? 'SERVING' : 'OFFLINE'; }
      } catch {
        if (dot)   { dot.className = 'api-dot offline'; }
        if (label) { label.textContent = 'OFFLINE'; }
      }
    }

    void poll();
    const pollId = setInterval(() => void poll(), 15_000);

    return () => clearInterval(pollId);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown);
    }
  });
</script>

<svelte:head><title>Demo — Avkash</title></svelte:head>

<!-- ── Demo Player Shell ───────────────────────────────────────────────────── -->
<div class="demo-shell">

  <!-- ── Top nav (demo-specific — replaces shell nav) ──────────────────── -->
  <nav class="demo-nav">
    <div class="nav-logo">avk<span>|</span>ash</div>

    <!-- Chapter pills -->
    <div class="ch-pills" role="navigation" aria-label="Demo chapters">
      {#each pills as pill (pill.n)}
        <button
          class="ch-pill"
          class:active={currentChapter === pill.n}
          onclick={() => goTo(pill.n)}
          aria-current={currentChapter === pill.n ? 'step' : undefined}
        >
          {pill.label}
        </button>
      {/each}
    </div>

    <!-- API status -->
    <div class="demo-api-status">
      <div class="api-dot" id="demo-api-dot"></div>
      <span class="api-label" id="demo-api-label">API</span>
    </div>
  </nav>

  <!-- ── Stage ──────────────────────────────────────────────────────────── -->
  <div class="stage">
    {#key currentChapter}
      <div
        class="chapter-wrap"
        class:entering-forward={direction === 'forward'}
        class:entering-backward={direction === 'backward'}
      >
        {#if currentChapter === 0}
          <Ch0Intro />
        {:else if currentChapter === 1}
          <Ch1Company orgData={data.orgData} {onConsole} />
        {:else if currentChapter === 2}
          <Ch2Ladder {onConsole} />
        {:else if currentChapter === 3}
          <Ch3Shifts {onConsole} />
        {:else if currentChapter === 4}
          <Ch4Punch {onConsole} />
        {:else if currentChapter === 5}
          <Ch5OtGap {onConsole} />
        {:else if currentChapter === 6}
          <Ch6Transfer transferCount={data.transferCount} {onConsole} />
        {:else if currentChapter === 7}
          <Ch7Probation policies={data.leavePolicies} leaveTypes={data.leaveTypes} {onConsole} />
        {:else if currentChapter === 8}
          <Ch8Leave saraBalance={data.saraClBalance} {onConsole} />
        {:else if currentChapter === 9}
          <Ch9HalfDay {onConsole} />
        {/if}
      </div>
    {/key}
  </div>

  <!-- ── Prev / Next buttons ─────────────────────────────────────────────── -->
  <div class="nav-btns">
    <button
      class="nav-btn"
      onclick={() => goTo(currentChapter - 1)}
      disabled={currentChapter === 0}
      aria-label="Previous chapter"
    >←</button>
    <button
      class="nav-btn"
      onclick={() => goTo(currentChapter + 1)}
      disabled={currentChapter === TOTAL_CHAPTERS}
      aria-label="Next chapter"
    >→</button>
  </div>

  <!-- ── Console strip ───────────────────────────────────────────────────── -->
  <DemoConsole entry={consoleEntry} />

</div>


<style>
  /* Demo shell — full-viewport, fixed layout, overrides the shell-main padding */
  :global(.shell-main) {
    padding: 0 !important;
    margin-top: 0 !important;
    min-height: 100dvh !important;
  }

  .demo-shell {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    overflow: hidden;
    /* Push below the TopNav which is position:fixed at --nav-h (56px) */
    top: var(--nav-h);
  }

  /* ── Demo-specific sub-nav (chapter pills) ────────────────────────── */
  .demo-nav {
    height: 48px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 12px;
    flex-shrink: 0;
    z-index: 50;
  }

  .nav-logo {
    font-weight: 700;
    font-size: 14px;
    color: var(--blue);
    letter-spacing: -0.5px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .nav-logo span { color: var(--purple); }

  .ch-pills {
    display: flex;
    gap: 3px;
    flex: 1;
    justify-content: center;
    overflow: hidden;
  }

  .ch-pill {
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    background: transparent;
    color: var(--muted);
    border: 1px solid transparent;
    transition: all 0.15s;
    cursor: pointer;
    white-space: nowrap;
    font-family: var(--font-sans);
  }
  .ch-pill:hover { background: var(--surface2); color: var(--text); }
  .ch-pill.active {
    background: var(--blue);
    color: #000;
    font-weight: 600;
    border-color: var(--blue);
  }

  .demo-api-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--muted);
    font-family: var(--font-mono);
    white-space: nowrap;
    flex-shrink: 0;
  }

  :global(.api-dot) {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--amber);
    animation: pulse 2s infinite;
    display: inline-block;
  }
  :global(.api-dot.connected) { background: var(--green); animation: none; }
  :global(.api-dot.offline)   { background: var(--red); animation: none; }

  /* ── Stage ─────────────────────────────────────────────────────────── */
  .stage {
    flex: 1;
    position: relative;
    overflow: hidden;
    /* Leave room for console (56px) */
    padding-bottom: 56px;
  }

  .chapter-wrap {
    position: absolute;
    inset: 0;
    display: flex;
    overflow: hidden;
  }

  .chapter-wrap.entering-forward {
    animation: chapterIn 0.35s ease forwards;
  }
  .chapter-wrap.entering-backward {
    animation: chapterInReverse 0.35s ease forwards;
  }

  @keyframes chapterIn {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes chapterInReverse {
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* ── Prev / Next buttons ────────────────────────────────────────────── */
  .nav-btns {
    position: fixed;
    bottom: calc(56px + 12px);
    right: 20px;
    z-index: 50;
    display: flex;
    gap: 8px;
  }

  .nav-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--font-sans);
  }
  .nav-btn:hover:not(:disabled) {
    background: var(--surface2);
    border-color: var(--blue);
    color: var(--blue);
  }
  .nav-btn:disabled { opacity: 0.3; cursor: default; pointer-events: none; }
</style>

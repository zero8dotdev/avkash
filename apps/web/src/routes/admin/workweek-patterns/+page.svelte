<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();

  interface WorkweekPattern {
    id: string;
    name: string;
    cycleLength: number;
    weeks: string[][];
    referenceDate: string;
    isActive: boolean;
  }

  interface Team {
    teamId: string;
    name: string;
    workweekPatternId: string | null;
  }

  const patterns = $derived(data.patterns as WorkweekPattern[]);
  const teams = $derived(data.teams as Team[]);

  const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const DAYS_FULL = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  function isWorkDay(week: string[], dayIdx: number): boolean {
    return week.includes(DAYS_FULL[dayIdx]);
  }

  function teamsForPattern(patternId: string): Team[] {
    return teams.filter((t) => t.workweekPatternId === patternId);
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<svelte:head><title>Workweek Patterns — Admin — Avkash</title></svelte:head>

<div class="section-header">
  <h1>Workweek Patterns</h1>
  <p class="subtitle">
    Rotating workweek cycles assigned per team. Alternate Saturday pattern: 1st/3rd Saturday working,
    2nd/4th off — a 2-week cycle. Leave day-counting and attendance use this to determine working days.
  </p>
</div>

{#if patterns.length === 0}
  <div class="empty-state">No workweek patterns found.</div>
{:else}
  <div class="patterns-grid">
    {#each patterns as pattern (pattern.id)}
      {@const assignedTeams = teamsForPattern(pattern.id)}
      <div class="pattern-card" class:inactive={!pattern.isActive}>
        <div class="pattern-header">
          <div>
            <div class="pattern-name">{pattern.name}</div>
            <div class="pattern-meta">
              {pattern.cycleLength}-week cycle · ref {formatDate(pattern.referenceDate)}
            </div>
          </div>
          <span class="pattern-status" class:active={pattern.isActive} class:inactive-badge={!pattern.isActive}>
            {pattern.isActive ? 'Active' : 'Archived'}
          </span>
        </div>

        <!-- Week cycle visualizer -->
        <div class="cycle-grid">
          {#each pattern.weeks as week, wi (wi)}
            <div class="cycle-week">
              <div class="week-label">Week {wi + 1}</div>
              <div class="week-days">
                {#each DAYS_SHORT as ds, di (di)}
                  <div
                    class="day-cell"
                    class:working={isWorkDay(week, di)}
                    class:off={!isWorkDay(week, di)}
                    title="{DAYS_FULL[di]}"
                  >
                    {ds}
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>

        <!-- Legend -->
        <div class="cycle-legend">
          <span class="legend-working">■ Working</span>
          <span class="legend-off">■ Off</span>
        </div>

        <!-- Assigned teams -->
        {#if assignedTeams.length > 0}
          <div class="assigned-teams">
            <span class="assigned-label">Teams using this pattern:</span>
            {#each assignedTeams as t (t.teamId)}
              <span class="team-chip">{t.name}</span>
            {/each}
          </div>
        {:else}
          <div class="assigned-teams">
            <span class="assigned-label muted">No teams assigned to this pattern.</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  h1 { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: var(--muted); margin-bottom: 24px; line-height: 1.6; }
  .section-header { margin-bottom: 20px; }

  .patterns-grid { display: flex; flex-direction: column; gap: 20px; }

  .pattern-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-md); padding: 20px 22px;
  }
  .pattern-card.inactive { opacity: 0.55; }

  .pattern-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 18px;
  }
  .pattern-name { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
  .pattern-meta { font-size: 12px; color: var(--muted); font-family: var(--font-mono); }

  .pattern-status {
    font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 9999px;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .pattern-status.active { background: rgba(63,185,80,0.08); color: var(--green); border: 1px solid var(--green); }
  .pattern-status.inactive-badge { background: var(--surface2); color: var(--muted); border: 1px solid var(--border); }

  /* Week visualizer */
  .cycle-grid { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 10px; }
  .cycle-week { display: flex; flex-direction: column; gap: 4px; }
  .week-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .week-days { display: flex; gap: 3px; }

  .day-cell {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; border-radius: var(--r-sm);
    transition: all var(--dur-fast) var(--ease);
  }
  .day-cell.working {
    background: rgba(88,166,255,0.12); color: var(--blue);
    border: 1px solid rgba(88,166,255,0.3);
  }
  .day-cell.off {
    background: var(--surface2); color: var(--muted);
    border: 1px solid var(--border);
  }

  .cycle-legend { display: flex; gap: 14px; margin-bottom: 16px; }
  .legend-working { font-size: 11px; color: var(--blue); }
  .legend-off { font-size: 11px; color: var(--muted); }

  /* Assigned teams */
  .assigned-teams { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .assigned-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .team-chip {
    font-size: 11px; padding: 2px 8px; background: var(--surface2);
    border: 1px solid var(--border); border-radius: 9999px; color: var(--text);
  }

  .empty-state {
    padding: 32px; text-align: center; color: var(--muted); font-size: 13px;
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-md);
  }
  .muted { color: var(--muted); }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import type { ConsoleEntry } from './DemoConsole.svelte';

  interface Props {
    orgData: {
      org: { name: string; employeeCount: number } | null;
      businessUnits: Array<{ id: string; name: string }>;
      departments: Array<{ id: string; name: string; code: string }>;
      teams: Array<{ teamId: string; name: string; departmentId: string | null; memberCount?: number }>;
      employees: Array<{ name: string; teamId: string }>;
    };
    onConsole: (entry: ConsoleEntry) => void;
  }

  let { orgData, onConsole }: Props = $props();

  // Animation state
  let rootVisible = $state(false);
  let trunkVisible = $state(false);
  let crossbarVisible = $state(false);
  let colsVisible = $state<boolean[]>([]);

  // Build dept columns: group teams by department
  const deptColors = ['#58a6ff','#3fb950','#bc8cff','#d29922','#8b949e','#f85149'];
  const deptIcons  = ['⚙','◎','◈','⬡','₹','⚡'];

  interface DeptCol {
    id: string;
    name: string;
    color: string;
    icon: string;
    teams: Array<{ teamId: string; name: string; memberCount: number; initials: string[] }>;
  }

  const deptCols = $derived((): DeptCol[] => {
    const { departments, teams, employees } = orgData;
    return departments.map((dept, i) => {
      const dTeams = teams.filter(t => t.departmentId === dept.id);
      return {
        id: dept.id,
        name: dept.name,
        color: deptColors[i % deptColors.length],
        icon: deptIcons[i % deptIcons.length],
        teams: dTeams.map(t => {
          const members = employees.filter(e => e.teamId === t.teamId);
          const initials = members.slice(0, 3).map(e =>
            e.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
          );
          return {
            teamId: t.teamId,
            name: t.name,
            memberCount: t.memberCount ?? members.length,
            initials,
          };
        }),
      };
    });
  });

  const employeeCount = $derived(orgData.employees.length);

  onMount(() => {
    // Push console entry on mount
    onConsole({
      method: 'GET',
      path: '/departments · /teams · /employees',
      status: 200,
      ms: null,
      response: `{ departments: ${orgData.departments.length}, teams: ${orgData.teams.length}, employees: ${orgData.employees.length} }`,
      isError: false,
    });

    // Stagger animations
    setTimeout(() => { rootVisible = true; }, 120);
    setTimeout(() => { trunkVisible = true; }, 520);
    setTimeout(() => { crossbarVisible = true; }, 680);
    const cols = deptCols();
    colsVisible = new Array(cols.length).fill(false);
    cols.forEach((_, i) => {
      setTimeout(() => {
        colsVisible[i] = true;
        // Force reactivity
        colsVisible = [...colsVisible];
      }, 800 + i * 90);
    });
  });
</script>

<div class="full-scene">
  <div class="org-tree">
    <!-- Root card -->
    <div class="org-root-card" class:visible={rootVisible}>
      <div class="org-logo-badge">M</div>
      <div>
        <div class="org-root-name">{orgData.org?.name ?? 'Meridian Manufacturing'}</div>
        <div class="org-root-sub">Meridian Manufacturing · Live data from API</div>
      </div>
      <div class="org-root-pills">
        <div class="org-root-pill"><b>{employeeCount}</b> employees</div>
        <div class="org-root-pill"><b>{orgData.businessUnits.length}</b> business units</div>
        <div class="org-root-pill"><b>{orgData.departments.length}</b> departments</div>
      </div>
    </div>

    <!-- Trunk line -->
    <div class="org-trunk" class:visible={trunkVisible}></div>

    <!-- Crossbar -->
    <div class="org-crossbar-wrap">
      <div class="org-crossbar" class:visible={crossbarVisible}></div>
    </div>

    <!-- Dept columns -->
    <div class="org-depts">
      {#each deptCols() as dept, i (dept.id)}
        <div class="org-dept-col" class:visible={colsVisible[i]} style="--dc:{dept.color}">
          <!-- Dept header -->
          <div class="org-dept-hdr">
            <div class="org-dept-icon">{dept.icon}</div>
            <div class="org-dept-n">{dept.name}</div>
            <div class="org-dept-m">
              {dept.teams.length} team{dept.teams.length !== 1 ? 's' : ''}
              · {dept.teams.reduce((s, t) => s + t.memberCount, 0)} people
            </div>
          </div>

          <!-- Team cards -->
          {#each dept.teams as team, ti (team.teamId)}
            <div class="org-team-card" style="transition-delay:{ti * 55}ms">
              <div class="org-team-n">{team.name}</div>
              <div class="org-team-cnt">{team.memberCount} members</div>
              <div class="org-avatars">
                {#each team.initials as init (init)}
                  <div class="org-av">{init}</div>
                {/each}
                {#if team.memberCount > team.initials.length}
                  <div class="org-av more">+{team.memberCount - team.initials.length}</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .full-scene {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .org-tree {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 28px 32px 20px;
    width: 100%;
    height: 100%;
    overflow: auto;
    box-sizing: border-box;
  }

  .org-root-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--surface);
    border: 1px solid var(--blue);
    border-radius: 12px;
    padding: 14px 24px;
    width: 100%;
    box-sizing: border-box;
    opacity: 0;
    transform: translateY(-12px);
    transition: opacity 0.5s ease, transform 0.5s ease;
    flex-shrink: 0;
  }
  .org-root-card.visible { opacity: 1; transform: translateY(0); }

  .org-logo-badge {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #1c3b8a 0%, #3563d4 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 22px;
    color: #fff;
  }

  .org-root-name { font-weight: 700; font-size: 14px; color: var(--text); }
  .org-root-sub  { color: var(--muted); font-size: 11px; margin-top: 2px; }

  .org-root-pills {
    display: flex;
    gap: 8px;
    margin-left: auto;
    flex-shrink: 0;
  }
  .org-root-pill {
    padding: 4px 11px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--muted);
    white-space: nowrap;
  }
  .org-root-pill :global(b) { color: var(--blue); font-weight: 700; }

  .org-trunk {
    width: 2px;
    background: var(--border);
    align-self: center;
    flex-shrink: 0;
    height: 0;
    margin: 0;
    transition: height 0.28s ease 0.45s;
  }
  .org-trunk.visible { height: 24px; }

  .org-crossbar-wrap {
    align-self: stretch;
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    overflow: hidden;
    height: 2px;
  }
  .org-crossbar {
    height: 2px;
    background: var(--border);
    width: 0%;
    transition: width 0.35s ease 0.65s;
    margin: 0 auto;
  }
  .org-crossbar.visible { width: 90%; }

  .org-depts {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 8px;
    flex-shrink: 0;
  }

  .org-dept-col {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 152px;
    flex: 1;
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 0.32s ease, transform 0.32s ease;
    position: relative;
    padding-top: 20px;
  }
  .org-dept-col::before {
    content: '';
    position: absolute;
    top: 0; left: 50%;
    width: 2px;
    height: 20px;
    background: var(--border);
    transform: translateX(-50%) scaleY(0);
    transform-origin: top;
    transition: transform 0.2s ease;
  }
  .org-dept-col.visible { opacity: 1; transform: translateY(0); }
  .org-dept-col.visible::before { transform: translateX(-50%) scaleY(1); }

  .org-dept-hdr {
    background: var(--surface);
    border: 1px solid var(--border);
    border-top: 3px solid var(--dc);
    border-radius: 8px;
    padding: 10px 12px;
    cursor: default;
    transition: box-shadow 0.2s;
  }
  .org-dept-hdr:hover { box-shadow: 0 0 0 1px var(--dc); }
  .org-dept-icon { font-size: 15px; margin-bottom: 5px; }
  .org-dept-n    { font-weight: 600; font-size: 12px; color: var(--text); }
  .org-dept-m    { font-size: 10px; color: var(--muted); margin-top: 2px; }

  .org-team-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-left: 2px solid var(--dc);
    border-radius: 6px;
    padding: 8px 10px;
    opacity: 0;
    transform: translateX(-8px);
    transition: opacity 0.28s ease, transform 0.28s ease;
  }
  .org-dept-col.visible .org-team-card { opacity: 1; transform: translateX(0); }

  .org-team-n   { font-size: 11px; font-weight: 500; color: var(--text); }
  .org-team-cnt { font-size: 10px; font-weight: 600; color: var(--dc); margin-top: 4px; }

  .org-avatars {
    display: flex;
    gap: 3px;
    margin-top: 6px;
    flex-wrap: wrap;
    align-items: center;
  }
  .org-av {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 7px;
    font-weight: 700;
    letter-spacing: -0.3px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000;
    background: var(--dc);
    opacity: 0.9;
    flex-shrink: 0;
  }
  .org-av.more {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 9px;
    opacity: 1;
  }
</style>

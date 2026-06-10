<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();

  interface Holiday {
    holidayId: string;
    name: string;
    date: string;
    location: string | null;
    isRecurring: boolean;
    isCustom: boolean;
  }

  interface Location {
    id: string;
    name: string;
    timezone: string;
    address: string | null;
    laborRegime: string;
    isActive: boolean;
  }

  const locations = $derived(data.locations as Location[]);
  const allHolidays = $derived(data.allHolidays as Holiday[]);
  const locationHolidays = $derived(data.locationHolidays as Record<string, Holiday[]>);

  // National holidays = no location set
  const nationalHolidays = $derived(allHolidays.filter((h) => !h.location).sort((a, b) => a.date.localeCompare(b.date)));

  // For a given location, return national + location-specific sorted by date
  function getCalendarForLocation(locId: string): { holiday: Holiday; scope: 'national' | 'local' }[] {
    const local = (locationHolidays[locId] ?? []).filter((h) => h.location === locId);
    const combined = [
      ...nationalHolidays.map((h) => ({ holiday: h, scope: 'national' as const })),
      ...local.map((h) => ({ holiday: h, scope: 'local' as const })),
    ];
    return combined.sort((a, b) => a.holiday.date.localeCompare(b.holiday.date));
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', weekday: 'short',
    });
  }

  // selectedLocation starts from the first location. data.locations doesn't change after load.
  let selectedLocation = $state<string | null>(null);
  $effect.pre(() => {
    if (selectedLocation === null) {
      selectedLocation = (data.locations as Location[])[0]?.id ?? null;
    }
  });
  const calendarView = $derived(selectedLocation ? getCalendarForLocation(selectedLocation) : []);
  const selectedLoc = $derived(locations.find((l) => l.id === selectedLocation) ?? null);
</script>

<svelte:head><title>Holidays & Locations — Admin — Avkash</title></svelte:head>

<div class="section-header">
  <h1>Holidays &amp; Locations — {data.year}</h1>
  <p class="subtitle">
    One org, per-site calendars. National holidays apply to all locations; location-specific holidays
    (Pongal, Tamil New Year for Coimbatore; Karnataka Rajyotsava for Bengaluru) stack on top.
  </p>
</div>

<!-- Location selector -->
<div class="location-tabs">
  <button
    class="loc-tab"
    class:active={selectedLocation === null}
    onclick={() => { selectedLocation = null; }}
  >
    National ({nationalHolidays.length})
  </button>
  {#each locations as loc (loc.id)}
    {@const locSpecific = (locationHolidays[loc.id] ?? []).filter((h) => h.location === loc.id)}
    <button
      class="loc-tab"
      class:active={selectedLocation === loc.id}
      onclick={() => { selectedLocation = loc.id; }}
    >
      {loc.name} ({nationalHolidays.length + locSpecific.length})
    </button>
  {/each}
</div>

<!-- Locations metadata -->
<div class="locations-grid">
  {#each locations as loc (loc.id)}
    <div class="loc-card" class:selected={selectedLocation === loc.id}>
      <div class="loc-name">{loc.name}</div>
      <div class="loc-tz mono">{loc.timezone}</div>
      <div class="loc-regime">{loc.laborRegime}</div>
      {#if loc.address}
        <div class="loc-address muted">{loc.address}</div>
      {/if}
    </div>
  {/each}
</div>

<!-- Calendar view -->
{#if selectedLocation === null}
  <!-- National holidays only -->
  <div class="card" style="margin-top: 20px;">
    <div class="card-header">National Holidays — all locations</div>
    <table class="holiday-table">
      <thead>
        <tr>
          <th>Holiday</th>
          <th>Date</th>
          <th>Recurring</th>
        </tr>
      </thead>
      <tbody>
        {#each nationalHolidays as h (h.holidayId)}
          <tr>
            <td>{h.name}</td>
            <td class="mono">{formatDate(h.date)}</td>
            <td>{h.isRecurring ? 'Yes' : 'No'}</td>
          </tr>
        {:else}
          <tr><td colspan="3" class="empty-cell">No national holidays in {data.year}.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else if selectedLoc}
  <!-- Combined calendar for selected location -->
  <div class="card" style="margin-top: 20px;">
    <div class="card-header">
      {selectedLoc.name} — {data.year} Holiday Calendar
      <span class="count-badge">{calendarView.length} days</span>
    </div>
    <table class="holiday-table">
      <thead>
        <tr>
          <th>Holiday</th>
          <th>Date</th>
          <th>Scope</th>
          <th>Recurring</th>
        </tr>
      </thead>
      <tbody>
        {#each calendarView as { holiday, scope } (holiday.holidayId)}
          <tr>
            <td class="holiday-name">
              {holiday.name}
            </td>
            <td class="mono">{formatDate(holiday.date)}</td>
            <td>
              {#if scope === 'national'}
                <span class="scope-national">National</span>
              {:else}
                <span class="scope-local">{selectedLoc.name} only</span>
              {/if}
            </td>
            <td>{holiday.isRecurring ? 'Yes' : 'No'}</td>
          </tr>
        {:else}
          <tr><td colspan="4" class="empty-cell">No holidays found for {selectedLoc.name} in {data.year}.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Two-calendar demo beat note -->
  {@const locCount = (locationHolidays[selectedLoc.id] ?? []).filter((h) => h.location === selectedLoc.id).length}
  <div class="demo-note">
    <strong>{selectedLoc.name}</strong>: {nationalHolidays.length} national + {locCount} location-specific
    = <strong>{calendarView.length} total</strong> holidays in {data.year}.
    {#if selectedLocation === '4990b22b-3693-4bb5-8c22-2894d569b4a8'}
      Includes Pongal (Jan 14) &amp; Tamil New Year (Apr 14) — Coimbatore Plant.
    {:else if selectedLocation === '9d87c34d-280d-4161-9616-a7c68fec052e'}
      Includes Karnataka Rajyotsava (Nov 1) — Bengaluru HQ.
    {/if}
  </div>
{/if}

<style>
  h1 { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: var(--muted); margin-bottom: 20px; line-height: 1.6; }
  .section-header { margin-bottom: 16px; }

  /* Location tabs */
  .location-tabs {
    display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;
  }
  .loc-tab {
    padding: 6px 14px; background: var(--surface); border: 1px solid var(--border);
    color: var(--muted); border-radius: var(--r-pill);
    font-size: 12px; font-weight: 500; cursor: pointer;
    transition: all var(--dur-fast) var(--ease);
  }
  .loc-tab:hover { color: var(--text); border-color: var(--text); }
  .loc-tab.active { background: var(--blue); color: #000; border-color: var(--blue); font-weight: 600; }

  /* Location cards */
  .locations-grid { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
  .loc-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-md); padding: 12px 16px; min-width: 180px;
    cursor: pointer; transition: border-color var(--dur-fast) var(--ease);
  }
  .loc-card.selected { border-color: var(--blue); }
  .loc-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .loc-tz { font-size: 11px; color: var(--muted); margin-bottom: 2px; }
  .loc-regime {
    font-size: 10px; color: var(--muted); text-transform: uppercase;
    letter-spacing: 0.04em; margin-bottom: 2px;
  }
  .loc-address { font-size: 11px; }
  .mono { font-family: var(--font-mono); }
  .muted { color: var(--muted); }

  /* Table */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-md); overflow: hidden;
  }
  .card-header {
    padding: 12px 18px; font-size: 13px; font-weight: 600; color: var(--text);
    background: var(--surface2); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 8px;
  }
  .count-badge {
    font-size: 10px; background: var(--surface); border: 1px solid var(--border);
    padding: 1px 6px; border-radius: 9999px; color: var(--muted);
  }
  .holiday-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .holiday-table th {
    text-align: left; padding: 9px 18px; font-size: 11px; font-weight: 600;
    color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em;
    border-bottom: 1px solid var(--border);
  }
  .holiday-table td {
    padding: 10px 18px; border-bottom: 1px solid rgba(48,54,61,0.5); color: var(--text);
  }
  .holiday-table tr:last-child td { border-bottom: none; }

  .scope-national {
    font-size: 10px; padding: 2px 6px; border-radius: 9999px;
    background: var(--surface2); color: var(--muted); border: 1px solid var(--border);
    text-transform: uppercase; letter-spacing: 0.03em;
  }
  .scope-local {
    font-size: 10px; padding: 2px 6px; border-radius: 9999px;
    background: rgba(88,166,255,0.08); color: var(--blue); border: 1px solid rgba(88,166,255,0.3);
    text-transform: uppercase; letter-spacing: 0.03em;
  }

  .empty-cell { text-align: center; color: var(--muted); padding: 24px; }

  /* Demo note */
  .demo-note {
    margin-top: 12px; padding: 10px 16px;
    background: rgba(88,166,255,0.04); border: 1px dashed var(--border);
    border-radius: var(--r-md); font-size: 12px; color: var(--muted);
  }
  .demo-note strong { color: var(--text); }
</style>

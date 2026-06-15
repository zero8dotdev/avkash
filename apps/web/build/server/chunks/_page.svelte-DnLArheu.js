import { x as head, k as ensure_array_like, l as attr_class, n as escape_html, m as attr, y as derived } from './index-DX9vaW0y.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const patterns = derived(() => data.patterns);
    const teams = derived(() => data.teams);
    const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
    const DAYS_FULL = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY"
    ];
    function isWorkDay(week, dayIdx) {
      return week.includes(DAYS_FULL[dayIdx]);
    }
    function teamsForPattern(patternId) {
      return teams().filter((t) => t.workweekPatternId === patternId);
    }
    function formatDate(s) {
      return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
    head("sqk7uc", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Workweek Patterns — Admin — Avkash</title>`);
      });
    });
    $$renderer2.push(`<div class="section-header svelte-sqk7uc"><h1 class="svelte-sqk7uc">Workweek Patterns</h1> <p class="subtitle svelte-sqk7uc">Rotating workweek cycles assigned per team. Alternate Saturday pattern: 1st/3rd Saturday working,
    2nd/4th off — a 2-week cycle. Leave day-counting and attendance use this to determine working days.</p></div> `);
    if (patterns().length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-state svelte-sqk7uc">No workweek patterns found.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="patterns-grid svelte-sqk7uc"><!--[-->`);
      const each_array = ensure_array_like(patterns());
      for (let $$index_3 = 0, $$length = each_array.length; $$index_3 < $$length; $$index_3++) {
        let pattern = each_array[$$index_3];
        const assignedTeams = teamsForPattern(pattern.id);
        $$renderer2.push(`<div${attr_class("pattern-card svelte-sqk7uc", void 0, { "inactive": !pattern.isActive })}><div class="pattern-header svelte-sqk7uc"><div><div class="pattern-name svelte-sqk7uc">${escape_html(pattern.name)}</div> <div class="pattern-meta svelte-sqk7uc">${escape_html(pattern.cycleLength)}-week cycle · ref ${escape_html(formatDate(pattern.referenceDate))}</div></div> <span${attr_class("pattern-status svelte-sqk7uc", void 0, {
          "active": pattern.isActive,
          "inactive-badge": !pattern.isActive
        })}>${escape_html(pattern.isActive ? "Active" : "Archived")}</span></div> <div class="cycle-grid svelte-sqk7uc"><!--[-->`);
        const each_array_1 = ensure_array_like(pattern.weeks);
        for (let wi = 0, $$length2 = each_array_1.length; wi < $$length2; wi++) {
          let week = each_array_1[wi];
          $$renderer2.push(`<div class="cycle-week svelte-sqk7uc"><div class="week-label svelte-sqk7uc">Week ${escape_html(wi + 1)}</div> <div class="week-days svelte-sqk7uc"><!--[-->`);
          const each_array_2 = ensure_array_like(DAYS_SHORT);
          for (let di = 0, $$length3 = each_array_2.length; di < $$length3; di++) {
            let ds = each_array_2[di];
            $$renderer2.push(`<div${attr_class("day-cell svelte-sqk7uc", void 0, { "working": isWorkDay(week, di), "off": !isWorkDay(week, di) })}${attr("title", DAYS_FULL[di])}>${escape_html(ds)}</div>`);
          }
          $$renderer2.push(`<!--]--></div></div>`);
        }
        $$renderer2.push(`<!--]--></div> <div class="cycle-legend svelte-sqk7uc"><span class="legend-working svelte-sqk7uc">■ Working</span> <span class="legend-off svelte-sqk7uc">■ Off</span></div> `);
        if (assignedTeams.length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="assigned-teams svelte-sqk7uc"><span class="assigned-label svelte-sqk7uc">Teams using this pattern:</span> <!--[-->`);
          const each_array_3 = ensure_array_like(assignedTeams);
          for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
            let t = each_array_3[$$index_2];
            $$renderer2.push(`<span class="team-chip svelte-sqk7uc">${escape_html(t.name)}</span>`);
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<div class="assigned-teams svelte-sqk7uc"><span class="assigned-label muted svelte-sqk7uc">No teams assigned to this pattern.</span></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DnLArheu.js.map

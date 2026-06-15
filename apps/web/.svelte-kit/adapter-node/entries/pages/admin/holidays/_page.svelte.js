import { h as head, c as escape_html, a as attr_class, e as ensure_array_like, f as derived } from "../../../../chunks/index.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const locations = derived(() => data.locations);
    const allHolidays = derived(() => data.allHolidays);
    const locationHolidays = derived(() => data.locationHolidays);
    const nationalHolidays = derived(() => allHolidays().filter((h) => !h.location).sort((a, b) => a.date.localeCompare(b.date)));
    function formatDate(s) {
      return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" });
    }
    let selectedLocation = null;
    head("1yxholi", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Holidays &amp; Locations — Admin — Avkash</title>`);
      });
    });
    $$renderer2.push(`<div class="section-header svelte-1yxholi"><h1 class="svelte-1yxholi">Holidays &amp; Locations — ${escape_html(data.year)}</h1> <p class="subtitle svelte-1yxholi">One org, per-site calendars. National holidays apply to all locations; location-specific holidays
    (Pongal, Tamil New Year for Coimbatore; Karnataka Rajyotsava for Bengaluru) stack on top.</p></div> <div class="location-tabs svelte-1yxholi"><button${attr_class("loc-tab svelte-1yxholi", void 0, { "active": selectedLocation === null })}>National (${escape_html(nationalHolidays().length)})</button> <!--[-->`);
    const each_array = ensure_array_like(locations());
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let loc = each_array[$$index];
      const locSpecific = (locationHolidays()[loc.id] ?? []).filter((h) => h.location === loc.id);
      $$renderer2.push(`<button${attr_class("loc-tab svelte-1yxholi", void 0, { "active": selectedLocation === loc.id })}>${escape_html(loc.name)} (${escape_html(nationalHolidays().length + locSpecific.length)})</button>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="locations-grid svelte-1yxholi"><!--[-->`);
    const each_array_1 = ensure_array_like(locations());
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let loc = each_array_1[$$index_1];
      $$renderer2.push(`<div${attr_class("loc-card svelte-1yxholi", void 0, { "selected": selectedLocation === loc.id })}><div class="loc-name svelte-1yxholi">${escape_html(loc.name)}</div> <div class="loc-tz mono svelte-1yxholi">${escape_html(loc.timezone)}</div> <div class="loc-regime svelte-1yxholi">${escape_html(loc.laborRegime)}</div> `);
      if (loc.address) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="loc-address muted svelte-1yxholi">${escape_html(loc.address)}</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="card svelte-1yxholi" style="margin-top: 20px;"><div class="card-header svelte-1yxholi">National Holidays — all locations</div> <table class="holiday-table svelte-1yxholi"><thead><tr><th class="svelte-1yxholi">Holiday</th><th class="svelte-1yxholi">Date</th><th class="svelte-1yxholi">Recurring</th></tr></thead><tbody>`);
      const each_array_2 = ensure_array_like(nationalHolidays());
      if (each_array_2.length !== 0) {
        $$renderer2.push("<!--[-->");
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let h = each_array_2[$$index_2];
          $$renderer2.push(`<tr class="svelte-1yxholi"><td class="svelte-1yxholi">${escape_html(h.name)}</td><td class="mono svelte-1yxholi">${escape_html(formatDate(h.date))}</td><td class="svelte-1yxholi">${escape_html(h.isRecurring ? "Yes" : "No")}</td></tr>`);
        }
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<tr class="svelte-1yxholi"><td colspan="3" class="empty-cell svelte-1yxholi">No national holidays in ${escape_html(data.year)}.</td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};

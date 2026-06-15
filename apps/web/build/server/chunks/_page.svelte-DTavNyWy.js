import { x as head, n as escape_html, k as ensure_array_like, m as attr, y as derived } from './index-DX9vaW0y.js';
import './root-D7heMfFX.js';
import './state.svelte-DsCXTBTP.js';

/* empty css                                                           */
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    const blackouts = derived(() => data.blackouts);
    const locations = derived(() => data.locations);
    const leaveTypes = derived(() => data.leaveTypes.filter((lt) => lt.isActive && lt.kind === "LEAVE"));
    function formatDate(s) {
      return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
    function getLocationName(id) {
      if (!id) return "All locations";
      return locations().find((l) => l.id === id)?.name ?? id.slice(0, 8) + "…";
    }
    function getLeaveTypeName(id) {
      if (!id) return "All leave types";
      return leaveTypes().find((lt) => lt.leaveTypeId === id)?.name ?? id.slice(0, 8) + "…";
    }
    head("fzyw4h", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Blackouts — Admin — Avkash</title>`);
      });
    });
    $$renderer2.push(`<div class="section-header svelte-fzyw4h"><div class="section-row svelte-fzyw4h"><div><h1 class="svelte-fzyw4h">Blackout Periods</h1> <p class="subtitle svelte-fzyw4h">Date windows during which leave applications are blocked at submission.
        Scope to a location or leave type to enforce quarter-end, peak-season, or compliance freezes.</p></div> <button class="btn-new svelte-fzyw4h">${escape_html("+ New Blackout")}</button></div></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form && "createSuccess" in form && form.createSuccess) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="success-banner svelte-fzyw4h">Blackout period created successfully.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form && "deleteSuccess" in form && form.deleteSuccess) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="success-banner svelte-fzyw4h">Blackout deleted.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (blackouts().length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-state svelte-fzyw4h">No blackout periods configured.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="blackout-list svelte-fzyw4h"><!--[-->`);
      const each_array_2 = ensure_array_like(blackouts());
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let b = each_array_2[$$index_2];
        if (b.isActive) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="blackout-card svelte-fzyw4h"><div class="blackout-info svelte-fzyw4h"><div class="blackout-name svelte-fzyw4h">${escape_html(b.name)}</div> <div class="blackout-dates mono svelte-fzyw4h">${escape_html(formatDate(b.startDate))} → ${escape_html(formatDate(b.endDate))}</div> <div class="blackout-scope svelte-fzyw4h"><span class="scope-chip svelte-fzyw4h">${escape_html(getLocationName(b.locationId))}</span> <span class="scope-sep svelte-fzyw4h">·</span> <span class="scope-chip svelte-fzyw4h">${escape_html(getLeaveTypeName(b.leaveTypeId))}</span></div></div> <div class="blackout-actions"><form method="POST" action="?/delete"><input type="hidden" name="id"${attr("value", b.id)} class="svelte-fzyw4h"/> <button type="submit" class="btn-delete svelte-fzyw4h">Delete</button></form></div></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DTavNyWy.js.map

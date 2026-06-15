import { c as escape_html, e as ensure_array_like, a as attr_class, b as attr, d as stringify, f as derived } from "../../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { E as ErrorBanner } from "../../../../chunks/ErrorBanner.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    const policies = derived(() => data.policies);
    const overrideMap = derived(() => () => {
      const m = /* @__PURE__ */ new Map();
      for (const p of policies()) {
        m.set(`${p.resource}:${p.fieldGroup}:${p.relation}`, p);
      }
      return m;
    });
    function getOverride(group, relation) {
      return overrideMap()().get(`employee:${group}:${relation}`);
    }
    function getEffective(group, relation) {
      const override = getOverride(group, relation);
      if (override) return override.access;
      const defaults = data.defaults;
      return defaults[relation]?.[group] ?? "—";
    }
    function accessClass(access) {
      if (access === "write") return "access-write";
      if (access === "read") return "access-read";
      if (access === "none") return "access-none";
      return "";
    }
    const groups = derived(() => data.fieldGroups);
    const relations = derived(() => data.relations);
    let lastChanged = null;
    $$renderer2.push(`<div class="fp-page svelte-1rm57ia"><div class="page-header svelte-1rm57ia"><div class="header-left svelte-1rm57ia"><h2 class="page-title svelte-1rm57ia">Field Policies</h2> <span class="subtitle svelte-1rm57ia">resource: employee</span></div> <button class="btn-primary svelte-1rm57ia">${escape_html("+ Add / Override Policy")}</button></div> <div class="beat-callout svelte-1rm57ia"><span class="beat-icon svelte-1rm57ia">⚡</span> <div class="beat-text svelte-1rm57ia"><strong class="svelte-1rm57ia">Demo Beat 4 — live field-group visibility.</strong> Flipping a row here invalidates the resolver cache immediately (no deploy).
      Rohan's view of Sara has <em class="svelte-1rm57ia">no compensation section</em> (MANAGER → compensation: none).
      Grant <code class="svelte-1rm57ia">hrbp → compensation: read</code> and Anita sees salary/bank fields on the next profile fetch.</div></div> `);
    if (form?.upsertSuccess) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="success-banner svelte-1rm57ia">Policy saved. Cache invalidated — next profile fetch reflects the change. `);
      if (form?.upsertedPolicy) {
        $$renderer2.push("<!--[0-->");
        const p = form.upsertedPolicy;
        $$renderer2.push(`<code class="inline-code svelte-1rm57ia">${escape_html(p.fieldGroup)} × ${escape_html(p.relation)} → ${escape_html(p.access)}</code>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.patchSuccess) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="success-banner svelte-1rm57ia">Policy updated. `);
      if (form?.patchedPolicy) {
        $$renderer2.push("<!--[0-->");
        const p = form.patchedPolicy;
        $$renderer2.push(`<code class="inline-code svelte-1rm57ia">${escape_html(p.fieldGroup)} × ${escape_html(p.relation)} → ${escape_html(p.access)}</code>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.deleteSuccess) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="success-banner svelte-1rm57ia">Policy deleted — defaults restored for that row.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.upsertError) {
      $$renderer2.push("<!--[0-->");
      ErrorBanner($$renderer2, { error: form.upsertError });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.patchError) {
      $$renderer2.push("<!--[0-->");
      ErrorBanner($$renderer2, { error: form.patchError });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.deleteError) {
      $$renderer2.push("<!--[0-->");
      ErrorBanner($$renderer2, { error: form.deleteError });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="matrix-section svelte-1rm57ia"><h3 class="matrix-title svelte-1rm57ia">Access Matrix — employee resource</h3> <p class="matrix-desc svelte-1rm57ia">Effective access = tenant override (field_policy row) OR compiled default. Overrides are highlighted.
      Cells with a pen icon have a DB row you can edit. Cells without revert to the compiled default on delete.</p> <div class="table-wrapper svelte-1rm57ia"><table class="matrix-table svelte-1rm57ia"><thead><tr><th class="col-group svelte-1rm57ia">Field Group</th><!--[-->`);
    const each_array_4 = ensure_array_like(relations());
    for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
      let rel = each_array_4[$$index_4];
      $$renderer2.push(`<th class="col-rel svelte-1rm57ia">${escape_html(rel)}</th>`);
    }
    $$renderer2.push(`<!--]--></tr></thead><tbody><!--[-->`);
    const each_array_5 = ensure_array_like(groups());
    for (let $$index_6 = 0, $$length = each_array_5.length; $$index_6 < $$length; $$index_6++) {
      let grp = each_array_5[$$index_6];
      $$renderer2.push(`<tr class="svelte-1rm57ia"><td class="cell-group svelte-1rm57ia"><span class="grp-name svelte-1rm57ia">${escape_html(grp)}</span> `);
      if (grp === "compensation" || grp === "identity" || grp === "medical") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="grp-tag svelte-1rm57ia">DPDP</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (grp === "identity" || grp === "medical") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="grp-tag grp-tag--audit svelte-1rm57ia">AUDITED</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></td><!--[-->`);
      const each_array_6 = ensure_array_like(relations());
      for (let $$index_5 = 0, $$length2 = each_array_6.length; $$index_5 < $$length2; $$index_5++) {
        let rel = each_array_6[$$index_5];
        const override = getOverride(grp, rel);
        const effective = getEffective(grp, rel);
        const isChanged = lastChanged === `${grp}:${rel}`;
        $$renderer2.push(`<td${attr_class("cell-access svelte-1rm57ia", void 0, { "cell-override": !!override, "cell-changed": isChanged })}><div class="cell-inner svelte-1rm57ia"><span${attr_class(`access-badge ${stringify(accessClass(effective))}`, "svelte-1rm57ia")}>${escape_html(effective)}</span> `);
        if (override) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button class="cell-edit-btn svelte-1rm57ia" title="Edit override (ETag If-Match)">✏️</button> <form method="post" action="?/delete" style="display:inline;"><input type="hidden" name="id"${attr("value", override.id)}/> <button type="submit" class="cell-delete-btn svelte-1rm57ia" title="Delete override (reverts to default)">✕</button></form>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></td>`);
      }
      $$renderer2.push(`<!--]--></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody></table></div> <div class="legend svelte-1rm57ia"><span class="legend-item svelte-1rm57ia"><span class="access-badge access-write svelte-1rm57ia">write</span> read + write</span> <span class="legend-item svelte-1rm57ia"><span class="access-badge access-read svelte-1rm57ia">read</span> read only</span> <span class="legend-item svelte-1rm57ia"><span class="access-badge access-none svelte-1rm57ia">none</span> hidden (absent from wire)</span> <span class="legend-item override-legend svelte-1rm57ia">highlighted = tenant override in DB</span></div></div> <div class="overrides-section svelte-1rm57ia"><h3 class="overrides-title svelte-1rm57ia">Active DB Overrides (${escape_html(policies().length)})</h3> `);
    if (policies().length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="overrides-empty svelte-1rm57ia">No tenant overrides. All access follows compiled defaults.</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="overrides-list svelte-1rm57ia"><!--[-->`);
      const each_array_7 = ensure_array_like(policies());
      for (let $$index_7 = 0, $$length = each_array_7.length; $$index_7 < $$length; $$index_7++) {
        let p = each_array_7[$$index_7];
        $$renderer2.push(`<div class="override-row svelte-1rm57ia"><code class="override-key svelte-1rm57ia">${escape_html(p.resource)} × ${escape_html(p.fieldGroup)} × ${escape_html(p.relation)}</code> <span${attr_class(`access-badge ${stringify(accessClass(p.access))}`, "svelte-1rm57ia")}>${escape_html(p.access)}</span> <span class="override-version svelte-1rm57ia">v${escape_html(p.version)}</span> <span class="override-date svelte-1rm57ia">${escape_html(new Date(p.updatedAt).toLocaleString("en-IN"))}</span> <div class="override-actions svelte-1rm57ia"><button class="cell-edit-btn svelte-1rm57ia" title="Edit">✏️</button> <form method="post" action="?/delete" style="display:inline;"><input type="hidden" name="id"${attr("value", p.id)}/> <button type="submit" class="cell-delete-btn svelte-1rm57ia" title="Delete">✕</button></form></div></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
export {
  _page as default
};

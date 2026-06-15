import { c as escape_html, e as ensure_array_like, a as attr_class, b as attr, s as store_get, u as unsubscribe_stores } from "../../../chunks/index.js";
import { p as page } from "../../../chunks/stores.js";
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { data, children } = $$props;
    const adminSections = [
      { label: "Leave Types & Policies", href: "/admin/leave-types" },
      { label: "Workweek Patterns", href: "/admin/workweek-patterns" },
      { label: "Holidays & Locations", href: "/admin/holidays" },
      { label: "Blackouts", href: "/admin/blackouts" },
      { label: "Field Policies", href: "/admin/field-policies" }
    ];
    function isActive(href) {
      return store_get($$store_subs ??= {}, "$page", page).url.pathname.startsWith(href);
    }
    if (data.notAuthorized) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="not-authorized svelte-1qg5d05"><div class="na-icon svelte-1qg5d05">🔒</div> <h2 class="na-title svelte-1qg5d05">Not Authorized</h2> <p class="na-message svelte-1qg5d05">The Admin section is only accessible to <strong>ADMIN</strong> and <strong>OWNER</strong> roles.
      You are signed in as <code class="svelte-1qg5d05">${escape_html(data.user?.role ?? "ANON")}</code>.</p> <a href="/dashboard" class="na-link svelte-1qg5d05">← Back to Dashboard</a></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="admin-shell svelte-1qg5d05"><aside class="admin-nav svelte-1qg5d05"><div class="admin-nav-header svelte-1qg5d05"><span class="admin-label svelte-1qg5d05">Admin</span></div> <nav><!--[-->`);
      const each_array = ensure_array_like(adminSections);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let sec = each_array[$$index];
        $$renderer2.push(`<a${attr_class("admin-nav-item svelte-1qg5d05", void 0, { "active": isActive(sec.href) })}${attr("href", sec.href)}>${escape_html(sec.label)}</a>`);
      }
      $$renderer2.push(`<!--]--></nav></aside> <div class="admin-content svelte-1qg5d05">`);
      children($$renderer2);
      $$renderer2.push(`<!----></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};

import { k as ensure_array_like, l as attr_class, m as attr, n as escape_html, o as stringify, p as store_get, q as unsubscribe_stores } from './index-DX9vaW0y.js';
import { p as page } from './stores-NeMyn9ka.js';
import './auth-client-53TeYoKo.js';
import './root-D7heMfFX.js';
import './state.svelte-DsCXTBTP.js';

function TopNav($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { user } = $$props;
    let apiStatus = "checking";
    const navItems = [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Leave", href: "/leave" },
      { label: "Attendance", href: "/attendance" },
      { label: "Comp-off", href: "/comp-off" },
      { label: "Employees", href: "/employees" },
      { label: "Transfers", href: "/transfers" },
      { label: "Reports", href: "/reports" },
      { label: "Admin", href: "/admin" },
      { label: "Demo", href: "/demo" }
    ];
    function isActive(href) {
      const path = store_get($$store_subs ??= {}, "$page", page).url.pathname;
      if (href === "/dashboard") return path === "/" || path.startsWith("/dashboard");
      return path.startsWith(href);
    }
    const statusLabel = { checking: "CHECKING", ready: "SERVING", offline: "OFFLINE" };
    $$renderer2.push(`<nav class="top-nav svelte-11zhvzk"><a class="logo svelte-11zhvzk" href="/dashboard" aria-label="Avkash home">avk<span class="svelte-11zhvzk">|</span>ash</a> <div class="pills svelte-11zhvzk" role="navigation" aria-label="Main navigation"><!--[-->`);
    const each_array = ensure_array_like(navItems);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$renderer2.push(`<a${attr_class("pill svelte-11zhvzk", void 0, { "active": isActive(item.href) })}${attr("href", item.href)}>${escape_html(item.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="right-cluster svelte-11zhvzk"><div class="api-status svelte-11zhvzk"${attr("aria-label", `API status: ${stringify(statusLabel[apiStatus])}`)}><span${attr_class("api-dot svelte-11zhvzk", void 0, {
      "connected": apiStatus === "ready",
      "offline": apiStatus === "offline"
    })} aria-hidden="true"></span> <span class="api-label">${escape_html(statusLabel[apiStatus])}</span></div> `);
    if (user) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="persona svelte-11zhvzk"><span class="persona-name svelte-11zhvzk">${escape_html(user.name)}</span> <span class="persona-role svelte-11zhvzk">${escape_html(user.role)}</span> <button class="sign-out-btn svelte-11zhvzk" aria-label="Sign out">Sign out</button></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></nav>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, children } = $$props;
    if (data.user) {
      $$renderer2.push("<!--[0-->");
      TopNav($$renderer2, { user: data.user });
      $$renderer2.push(`<!----> <main class="shell-main svelte-12qhfyh">`);
      children($$renderer2);
      $$renderer2.push(`<!----></main>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      children($$renderer2);
      $$renderer2.push(`<!---->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-Bz2iyLJQ.js.map

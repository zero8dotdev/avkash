import { x as head, n as escape_html, l as attr_class, m as attr, k as ensure_array_like, y as derived } from './index-DX9vaW0y.js';
import './root-D7heMfFX.js';
import './state.svelte-DsCXTBTP.js';
import { S as StatusBadge } from './StatusBadge-BUqBnBqR.js';

/* empty css                                                        */
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let activeTab = "my";
    function formatDate(s) {
      if (!s) return "—";
      return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
    function daysFromNow(s) {
      const expiry = new Date(s);
      const now = /* @__PURE__ */ new Date();
      return Math.ceil((expiry.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
    }
    const isManager = derived(() => data.user?.role === "MANAGER" || data.user?.role === "ADMIN");
    head("1lc2lfc", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Comp-off — Avkash</title>`);
      });
    });
    $$renderer2.push(`<div class="page svelte-1lc2lfc"><header class="page-header svelte-1lc2lfc"><div class="header-row svelte-1lc2lfc"><div><h1 class="svelte-1lc2lfc">Comp-off</h1> <p class="subtitle svelte-1lc2lfc">Compensatory leave credits for working on off days</p></div> `);
    if (data.compOffBalance) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="balance-chip svelte-1lc2lfc"><span class="balance-num svelte-1lc2lfc">${escape_html(Number(data.compOffBalance.available).toFixed(2))}</span> <span class="balance-label svelte-1lc2lfc">days available</span></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></header> <div class="tabs svelte-1lc2lfc" role="tablist"><button${attr_class("tab svelte-1lc2lfc", void 0, { "active": activeTab === "my" })} role="tab"${attr("aria-selected", activeTab === "my")}>My Comp-offs</button> <button${attr_class("tab svelte-1lc2lfc", void 0, { "active": activeTab === "request" })} role="tab"${attr("aria-selected", activeTab === "request")}>Request</button> `);
    if (isManager()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button${attr_class("tab svelte-1lc2lfc", void 0, { "active": activeTab === "queue" })} role="tab"${attr("aria-selected", activeTab === "queue")}>Approval Queue `);
      if (data.pendingQueue.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="badge svelte-1lc2lfc">${escape_html(data.pendingQueue.length)}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button${attr_class("tab svelte-1lc2lfc", void 0, { "active": activeTab === "encash" })} role="tab"${attr("aria-selected", activeTab === "encash")}>Encashment</button></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="tab-panel svelte-1lc2lfc">`);
      if (data.myCompOffs.length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="empty-state svelte-1lc2lfc">No comp-off records yet.</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="co-list svelte-1lc2lfc"><!--[-->`);
        const each_array = ensure_array_like(data.myCompOffs);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let co = each_array[$$index];
          const expDays = co.expiresOn ? daysFromNow(co.expiresOn) : null;
          $$renderer2.push(`<div${attr_class("co-card svelte-1lc2lfc", void 0, {
            "approved": co.status === "APPROVED",
            "expired": expDays !== null && expDays <= 0
          })}><div class="co-info svelte-1lc2lfc"><div class="co-date svelte-1lc2lfc">Worked on: <strong>${escape_html(formatDate(co.workedOn))}</strong></div> <div class="co-days mono svelte-1lc2lfc">${escape_html(Number(co.days).toFixed(2))} day(s)</div> `);
          if (co.expiresOn && co.status === "APPROVED") {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div${attr_class("co-expiry svelte-1lc2lfc", void 0, {
              "expiring-soon": expDays !== null && expDays <= 14 && expDays > 0,
              "expired": expDays !== null && expDays <= 0
            })}>`);
            if (expDays !== null && expDays <= 0) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`Expired ${escape_html(formatDate(co.expiresOn))}`);
            } else if (expDays !== null && expDays <= 14) {
              $$renderer2.push("<!--[1-->");
              $$renderer2.push(`⚠ Expires ${escape_html(formatDate(co.expiresOn))} (${escape_html(expDays)}d left)`);
            } else {
              $$renderer2.push("<!--[-1-->");
              $$renderer2.push(`Expires ${escape_html(formatDate(co.expiresOn))}`);
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> `);
          StatusBadge($$renderer2, { status: co.status });
          $$renderer2.push(`<!----></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
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
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CvuAWZMw.js.map

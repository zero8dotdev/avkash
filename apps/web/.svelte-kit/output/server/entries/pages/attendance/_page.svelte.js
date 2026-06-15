import { h as head, a as attr_class, c as escape_html, b as attr, f as derived } from "../../../chunks/index.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import { S as StatusBadge } from "../../../chunks/StatusBadge.js";
import { E as ErrorBanner } from "../../../chunks/ErrorBanner.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let activeTab = "today";
    let todayAttendance = derived(() => data.todayAttendance);
    let checkedIn = derived(() => !!todayAttendance()?.firstIn);
    let checkedOut = derived(() => !!todayAttendance()?.lastOut);
    let punching = false;
    let punchError = null;
    function formatTime(iso) {
      if (!iso) return "—";
      return new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata"
      });
    }
    let myRegs = derived(() => data.regularizations);
    let pendingRegQueue = derived(() => data.pendingRegQueue);
    let isManager = derived(() => data.user?.role === "MANAGER" || data.user?.role === "ADMIN");
    head("12uchig", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Attendance — Avkash</title>`);
      });
    });
    $$renderer2.push(`<div class="attendance-page svelte-12uchig"><header class="page-header svelte-12uchig"><h1 class="svelte-12uchig">Attendance</h1> <p class="subtitle svelte-12uchig">Track your daily punches and manage regularizations</p></header> <div class="tabs svelte-12uchig" role="tablist"><button${attr_class("tab-btn svelte-12uchig", void 0, { "active": activeTab === "today" })}>Today</button> <button${attr_class("tab-btn svelte-12uchig", void 0, { "active": activeTab === "week" })}>This Week</button> <button${attr_class("tab-btn svelte-12uchig", void 0, { "active": activeTab === "regularize" })}>Regularization `);
    if (myRegs().filter((r) => r.status === "PENDING").length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="tab-count svelte-12uchig">${escape_html(myRegs().filter((r) => r.status === "PENDING").length)}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></button> `);
    if (isManager()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button${attr_class("tab-btn svelte-12uchig", void 0, { "active": activeTab === "reg-queue" })}>Approval Queue `);
      if (pendingRegQueue().length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="tab-count amber svelte-12uchig">${escape_html(pendingRegQueue().length)}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="tab-panel svelte-12uchig">`);
      ErrorBanner($$renderer2, {
        error: punchError,
        onDismiss: () => {
          punchError = null;
        }
      });
      $$renderer2.push(`<!----> <div class="today-card svelte-12uchig"><div class="today-header svelte-12uchig"><div class="today-date-label svelte-12uchig">${escape_html(new Date(data.today).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }))}</div> `);
      if (todayAttendance()) {
        $$renderer2.push("<!--[0-->");
        StatusBadge($$renderer2, {
          status: todayAttendance().status === "WEEKLY_OFF" ? "ACTIVE" : checkedIn() ? "APPROVED" : "PENDING"
        });
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (todayAttendance()?.status === "WEEKLY_OFF") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="off-day-state svelte-12uchig"><div class="off-icon svelte-12uchig">🏖</div> <div class="off-label svelte-12uchig">Weekly Off</div></div>`);
      } else if (todayAttendance()?.status === "HOLIDAY") {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="off-day-state svelte-12uchig"><div class="off-icon svelte-12uchig">🎉</div> <div class="off-label svelte-12uchig">Holiday</div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="punch-times svelte-12uchig"><div class="punch-time-block svelte-12uchig"><span class="pt-label svelte-12uchig">Check-In</span> <span class="pt-value mono svelte-12uchig">${escape_html(formatTime(todayAttendance()?.firstIn ?? null))}</span></div> <div class="pt-arrow svelte-12uchig">→</div> <div class="punch-time-block svelte-12uchig"><span class="pt-label svelte-12uchig">Check-Out</span> <span class="pt-value mono svelte-12uchig">${escape_html(formatTime(todayAttendance()?.lastOut ?? null))}</span></div> `);
        if (todayAttendance() && todayAttendance().hours > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="pt-arrow svelte-12uchig"></div> <div class="punch-time-block svelte-12uchig"><span class="pt-label svelte-12uchig">Hours</span> <span class="pt-value mono blue svelte-12uchig">${escape_html(todayAttendance().hours.toFixed(1))}h</span></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> <div class="punch-btns svelte-12uchig">`);
        if (!checkedIn()) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<form method="POST" action="?/checkIn"><button type="submit" class="punch-btn check-in-btn svelte-12uchig"${attr("disabled", punching, true)}><span class="punch-dot-btn in svelte-12uchig"></span> ${escape_html("Check In")}</button></form>`);
        } else if (!checkedOut()) {
          $$renderer2.push("<!--[1-->");
          $$renderer2.push(`<form method="POST" action="?/checkOut"><button type="submit" class="punch-btn check-out-btn svelte-12uchig"${attr("disabled", punching, true)}><span class="punch-dot-btn out svelte-12uchig"></span> ${escape_html("Check Out")}</button></form>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<div class="day-complete svelte-12uchig"><span class="complete-icon svelte-12uchig">✓</span> Day complete · ${escape_html(todayAttendance()?.hours?.toFixed(1) ?? 0)}h worked</div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="demo-hint svelte-12uchig"><span class="hint-label svelte-12uchig">Note:</span> Check-in/out calls <code class="svelte-12uchig">POST /attendance/check-in</code> and <code class="svelte-12uchig">/check-out</code> — the API will record the punch and return the punch record.</div></div>`);
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
export {
  _page as default
};

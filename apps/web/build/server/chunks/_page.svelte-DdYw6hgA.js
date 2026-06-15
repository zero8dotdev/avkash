import { x as head, n as escape_html, l as attr_class, k as ensure_array_like, aw as attr_style, o as stringify, y as derived } from './index-DX9vaW0y.js';
import { S as StatusBadge } from './StatusBadge-BUqBnBqR.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const PRIMARY_TYPES = ["Casual Leave", "Sick Leave", "Earned Leave"];
    const LEAVE_COLORS = {
      "Casual Leave": "var(--amber)",
      "Sick Leave": "var(--green)",
      "Earned Leave": "var(--blue)",
      "Maternity Leave": "#ec4899",
      "Compensatory Off": "var(--purple)"
    };
    function typeName(typeId) {
      const t = data.leaveTypes.find((lt) => lt.leaveTypeId === typeId);
      return t?.name ?? typeId.slice(0, 8);
    }
    function typeColor(typeId) {
      const t = data.leaveTypes.find((lt) => lt.leaveTypeId === typeId);
      if (!t) return "var(--blue)";
      return LEAVE_COLORS[t.name] ?? `#${t.color ?? "58a6ff"}`;
    }
    let primaryBalances = derived(() => data.leaveTypes.filter((lt) => PRIMARY_TYPES.includes(lt.name)).map((lt) => {
      const bal = data.balances.find((b) => b.leaveTypeId === lt.leaveTypeId);
      return {
        name: lt.name,
        color: LEAVE_COLORS[lt.name] ?? `#${lt.color ?? "58a6ff"}`,
        entitlement: bal?.entitlement ?? 0,
        taken: bal?.taken ?? 0,
        available: bal?.available ?? 0,
        planned: bal?.planned ?? 0
      };
    }));
    let pendingLeaves = derived(() => data.leaveRequests.filter((l) => l.isApproved === "PENDING"));
    let pendingCompOffs = derived(() => data.compOffs.filter((c) => c.status === "PENDING"));
    let pendingRegularizations = derived(() => data.regularizations.filter((r) => r.status === "PENDING"));
    let hasPending = derived(() => pendingLeaves().length + pendingCompOffs().length + pendingRegularizations().length > 0);
    let today = /* @__PURE__ */ new Date();
    let ninetyDaysOut = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1e3);
    let upcomingHolidays = derived(() => data.holidays.filter((h) => {
      const d = new Date(h.date);
      return d >= today && d <= ninetyDaysOut;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5));
    let todayAttendance = derived(() => data.attendanceToday);
    let checkedIn = derived(() => !!todayAttendance()?.firstIn);
    let checkedOut = derived(() => !!todayAttendance()?.lastOut);
    function formatDate(iso) {
      const d = new Date(iso);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }
    function formatTime(iso) {
      if (!iso) return "—";
      return new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata"
      });
    }
    function usedPct(bal) {
      if (bal.entitlement === 0) return 0;
      return Math.min(100, Math.round(bal.taken / bal.entitlement * 100));
    }
    head("x1i5gj", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Dashboard — Avkash</title>`);
      });
    });
    $$renderer2.push(`<div class="dashboard svelte-x1i5gj"><header class="dash-header svelte-x1i5gj"><div><h1 class="svelte-x1i5gj">My Space</h1> <p class="subtitle svelte-x1i5gj">${escape_html(data.user?.name ?? "Welcome")} · <span class="role-chip svelte-x1i5gj">${escape_html(data.user?.role ?? "")}</span></p></div> <div class="header-date svelte-x1i5gj">${escape_html((/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }))}</div></header> <section class="section svelte-x1i5gj"><div class="section-label svelte-x1i5gj">Today's Attendance</div> <div class="attendance-today-card svelte-x1i5gj"><div class="at-status-col svelte-x1i5gj"><div${attr_class("at-status-dot svelte-x1i5gj", void 0, { "in": checkedIn(), "out": checkedOut() && !checkedIn() })}></div> <div class="at-status-text">`);
    if (todayAttendance()?.status === "WEEKLY_OFF") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="at-label muted svelte-x1i5gj">Weekly Off</span>`);
    } else if (todayAttendance()?.status === "HOLIDAY") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<span class="at-label muted svelte-x1i5gj">Holiday</span>`);
    } else if (checkedIn() && checkedOut()) {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<span class="at-label green svelte-x1i5gj">Checked Out</span>`);
    } else if (checkedIn()) {
      $$renderer2.push("<!--[3-->");
      $$renderer2.push(`<span class="at-label green svelte-x1i5gj">Checked In</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<span class="at-label muted svelte-x1i5gj">Not Punched</span>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="at-times svelte-x1i5gj"><div class="at-time-block svelte-x1i5gj"><span class="at-time-label svelte-x1i5gj">In</span> <span class="at-time-value mono svelte-x1i5gj">${escape_html(formatTime(todayAttendance()?.firstIn ?? null))}</span></div> <div class="at-time-sep svelte-x1i5gj">→</div> <div class="at-time-block svelte-x1i5gj"><span class="at-time-label svelte-x1i5gj">Out</span> <span class="at-time-value mono svelte-x1i5gj">${escape_html(formatTime(todayAttendance()?.lastOut ?? null))}</span></div></div> <div class="at-hours svelte-x1i5gj">`);
    if (todayAttendance() && todayAttendance().hours > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="at-hours-num svelte-x1i5gj">${escape_html(todayAttendance().hours.toFixed(1))}</span> <span class="at-hours-label svelte-x1i5gj">hrs today</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<span class="at-hours-label muted svelte-x1i5gj">—</span>`);
    }
    $$renderer2.push(`<!--]--></div> <a href="/attendance" class="at-link action-btn svelte-x1i5gj">View Attendance →</a></div></section> <section class="section svelte-x1i5gj"><div class="section-label svelte-x1i5gj">Leave Balances</div> <div class="balance-grid svelte-x1i5gj"><!--[-->`);
    const each_array = ensure_array_like(primaryBalances());
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let bal = each_array[$$index];
      $$renderer2.push(`<div class="balance-card svelte-x1i5gj"${attr_style(`--accent: ${stringify(bal.color)}`)}><div class="balance-name svelte-x1i5gj">${escape_html(bal.name)}</div> <div class="balance-nums svelte-x1i5gj"><span class="balance-avail mono svelte-x1i5gj">${escape_html(bal.available)}</span> <span class="balance-sep svelte-x1i5gj">/</span> <span class="balance-total mono muted svelte-x1i5gj">${escape_html(bal.entitlement)}</span></div> <div class="balance-meta svelte-x1i5gj">${escape_html(bal.taken)} used · ${escape_html(bal.planned > 0 ? `${bal.planned} planned` : "")}</div> <div class="balance-bar-wrap svelte-x1i5gj"><div class="balance-bar svelte-x1i5gj"${attr_style(`width: ${stringify(usedPct(bal))}%; background: ${stringify(bal.color)}`)}></div></div></div>`);
    }
    $$renderer2.push(`<!--]--></div> <a href="/leave?tab=apply" class="apply-leave-btn action-btn primary svelte-x1i5gj" style="margin-top: 12px; display: inline-flex">Apply Leave</a></section> <div class="two-col svelte-x1i5gj"><section class="section svelte-x1i5gj"><div class="section-label svelte-x1i5gj">Pending Requests</div> `);
    if (!hasPending()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-state svelte-x1i5gj">No pending requests</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="pending-list svelte-x1i5gj"><!--[-->`);
      const each_array_1 = ensure_array_like(pendingLeaves());
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let leave = each_array_1[$$index_1];
        $$renderer2.push(`<div class="pending-item svelte-x1i5gj"><div class="pending-icon svelte-x1i5gj"${attr_style(`background: ${stringify(typeColor(leave.leaveTypeId))}22; color: ${stringify(typeColor(leave.leaveTypeId))}`)}>L</div> <div class="pending-info svelte-x1i5gj"><div class="pending-title svelte-x1i5gj">${escape_html(typeName(leave.leaveTypeId))}</div> <div class="pending-dates svelte-x1i5gj">${escape_html(formatDate(leave.startDate))} – ${escape_html(formatDate(leave.endDate))} · ${escape_html(leave.workingDays)} days</div></div> `);
        StatusBadge($$renderer2, { status: leave.isApproved, size: "sm" });
        $$renderer2.push(`<!----></div>`);
      }
      $$renderer2.push(`<!--]--> <!--[-->`);
      const each_array_2 = ensure_array_like(pendingCompOffs());
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let co = each_array_2[$$index_2];
        $$renderer2.push(`<div class="pending-item svelte-x1i5gj"><div class="pending-icon svelte-x1i5gj" style="background: rgba(188,140,255,0.15); color: var(--purple)">C</div> <div class="pending-info svelte-x1i5gj"><div class="pending-title svelte-x1i5gj">Comp-off</div> <div class="pending-dates svelte-x1i5gj">Worked: ${escape_html(formatDate(co.workedOn))} · ${escape_html(co.days)} day(s)</div></div> `);
        StatusBadge($$renderer2, { status: co.status, size: "sm" });
        $$renderer2.push(`<!----></div>`);
      }
      $$renderer2.push(`<!--]--> <!--[-->`);
      const each_array_3 = ensure_array_like(pendingRegularizations());
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        let reg = each_array_3[$$index_3];
        $$renderer2.push(`<div class="pending-item svelte-x1i5gj"><div class="pending-icon svelte-x1i5gj" style="background: rgba(88,166,255,0.15); color: var(--blue)">R</div> <div class="pending-info svelte-x1i5gj"><div class="pending-title svelte-x1i5gj">Regularization</div> <div class="pending-dates svelte-x1i5gj">${escape_html(formatDate(reg.date))} · ${escape_html(reg.reason.slice(0, 40))}${escape_html(reg.reason.length > 40 ? "…" : "")}</div></div> `);
        StatusBadge($$renderer2, { status: reg.status, size: "sm" });
        $$renderer2.push(`<!----></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section> <section class="section svelte-x1i5gj"><div class="section-label svelte-x1i5gj">Upcoming Holidays `);
    if (data.locationId) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="loc-tag svelte-x1i5gj">${escape_html(data.locationId === "4990b22b-3693-4bb5-8c22-2894d569b4a8" ? "Coimbatore" : "Bengaluru")}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (upcomingHolidays().length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-state svelte-x1i5gj">No holidays in the next 90 days</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="holiday-list svelte-x1i5gj"><!--[-->`);
      const each_array_4 = ensure_array_like(upcomingHolidays());
      for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
        let h = each_array_4[$$index_4];
        const d = new Date(h.date);
        $$renderer2.push(`<div class="holiday-item svelte-x1i5gj"><div class="holiday-date svelte-x1i5gj"><span class="h-day mono svelte-x1i5gj">${escape_html(d.getDate())}</span> <span class="h-mon svelte-x1i5gj">${escape_html(d.toLocaleString("en", { month: "short" }))}</span></div> <div class="holiday-info svelte-x1i5gj"><div class="holiday-name svelte-x1i5gj">${escape_html(h.name)}</div> <div class="holiday-day svelte-x1i5gj">${escape_html(d.toLocaleString("en", { weekday: "long" }))}</div></div> `);
        if (h.location) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="h-scoped svelte-x1i5gj">location-specific</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section></div></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DdYw6hgA.js.map

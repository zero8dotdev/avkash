import { b as attr, a as attr_class, d as stringify, e as ensure_array_like, c as escape_html, i as attr_style, f as derived } from "../../../chunks/index.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const balanceReport = derived(() => data.balanceReport);
    const utilizationReport = derived(() => data.utilizationReport);
    const musterReport = derived(() => data.musterReport);
    const teams = derived(() => data.teams);
    const leaveTypes = derived(() => data.leaveTypes);
    function getLeaveTypeName(id) {
      return leaveTypes().find((lt) => lt.leaveTypeId === id)?.name ?? id.slice(0, 8) + "…";
    }
    function musterStatusClass(status) {
      if (status === "PRESENT") return "ms-present";
      if (status === "ABSENT") return "ms-absent";
      if (status === "WEEKLY_OFF") return "ms-off";
      if (status === "HOLIDAY") return "ms-holiday";
      if (status === "ON_LEAVE") return "ms-leave";
      if (status === "ON_COMP_OFF") return "ms-leave";
      return "ms-default";
    }
    const balanceLeaveTypeIds = derived(() => () => {
      const ids = /* @__PURE__ */ new Set();
      for (const e of balanceReport()) {
        for (const b of e.balances) ids.add(b.leaveTypeId);
      }
      return [...ids];
    });
    function getBalance(entry, ltId) {
      return entry.balances.find((b) => b.leaveTypeId === ltId);
    }
    const musterDates = derived(() => () => {
      const dates = /* @__PURE__ */ new Set();
      for (const row of musterReport()) {
        for (const d of row.days) dates.add(d.date);
      }
      return [...dates].sort();
    });
    function getMusterDay(row, date) {
      return row.days.find((d) => d.date === date);
    }
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];
    $$renderer2.push(`<div class="reports-page svelte-2pp8mk"><div class="page-header svelte-2pp8mk"><h1 class="page-title svelte-2pp8mk">Reports</h1> <p class="page-desc svelte-2pp8mk">Leave balance, utilization, and attendance muster for your org.</p></div> <form class="filter-bar svelte-2pp8mk" method="get" action="/reports"><div class="report-tabs svelte-2pp8mk"><a${attr("href", `/reports?report=balance${data.teamId ? `&teamId=${data.teamId}` : ""}`)}${attr_class("report-tab svelte-2pp8mk", void 0, { "tab--active": data.report === "balance" })}>Leave Balance</a> <a${attr("href", `/reports?report=utilization${data.teamId ? `&teamId=${data.teamId}` : ""}&year=${stringify(data.year)}`)}${attr_class("report-tab svelte-2pp8mk", void 0, { "tab--active": data.report === "utilization" })}>Leave Utilization</a> <a${attr("href", `/reports?report=muster${data.teamId ? `&teamId=${data.teamId}` : ""}&from=${stringify(data.fromDate)}&to=${stringify(data.toDate)}`)}${attr_class("report-tab svelte-2pp8mk", void 0, { "tab--active": data.report === "muster" })}>Attendance Muster</a></div> <input type="hidden" name="report"${attr("value", data.report)}/> <div class="filter-row svelte-2pp8mk"><div class="filter-field svelte-2pp8mk"><label class="filter-label svelte-2pp8mk" for="filter-team">Team</label> <select id="filter-team" class="filter-select svelte-2pp8mk" name="teamId">`);
    $$renderer2.option({ value: "" }, ($$renderer3) => {
      $$renderer3.push(`All teams`);
    });
    $$renderer2.push(`<!--[-->`);
    const each_array = ensure_array_like(teams());
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let t = each_array[$$index];
      $$renderer2.option({ value: t.teamId, selected: data.teamId === t.teamId }, ($$renderer3) => {
        $$renderer3.push(`${escape_html(t.name)}`);
      });
    }
    $$renderer2.push(`<!--]--></select></div> `);
    if (data.report === "utilization") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="filter-field svelte-2pp8mk"><label class="filter-label svelte-2pp8mk" for="filter-year">Year</label> <select id="filter-year" class="filter-select svelte-2pp8mk" name="year"><!--[-->`);
      const each_array_1 = ensure_array_like(years);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let y = each_array_1[$$index_1];
        $$renderer2.option({ value: y, selected: String(data.year) === String(y) }, ($$renderer3) => {
          $$renderer3.push(`${escape_html(y)}`);
        });
      }
      $$renderer2.push(`<!--]--></select></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.report === "muster") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="filter-field svelte-2pp8mk"><label class="filter-label svelte-2pp8mk" for="filter-from">From</label> <input id="filter-from" class="filter-input svelte-2pp8mk" type="date" name="from"${attr("value", data.fromDate)}/></div> <div class="filter-field svelte-2pp8mk"><label class="filter-label svelte-2pp8mk" for="filter-to">To</label> <input id="filter-to" class="filter-input svelte-2pp8mk" type="date" name="to"${attr("value", data.toDate)}/></div> <button type="submit" class="filter-btn svelte-2pp8mk">Apply</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></form> `);
    if (data.report === "balance") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="report-section svelte-2pp8mk"><h2 class="section-title svelte-2pp8mk">Leave Balance ${escape_html(data.teamId ? `— ${teams().find((t) => t.teamId === data.teamId)?.name ?? ""}` : "— All Teams")}</h2> `);
      if (balanceReport().length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="empty-msg svelte-2pp8mk">No data available.</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="table-wrapper svelte-2pp8mk"><table class="report-table svelte-2pp8mk"><thead><tr><th class="col-name svelte-2pp8mk">Employee</th><!--[-->`);
        const each_array_2 = ensure_array_like(balanceLeaveTypeIds()());
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let ltId = each_array_2[$$index_2];
          $$renderer2.push(`<th class="col-lt svelte-2pp8mk" colspan="3"><div class="lt-header svelte-2pp8mk">${escape_html(getLeaveTypeName(ltId))}</div> <div class="lt-sub-row svelte-2pp8mk"><span class="svelte-2pp8mk">Entl.</span><span class="svelte-2pp8mk">Avail.</span><span class="svelte-2pp8mk">Taken</span></div></th>`);
        }
        $$renderer2.push(`<!--]--></tr></thead><tbody><!--[-->`);
        const each_array_3 = ensure_array_like(balanceReport());
        for (let $$index_4 = 0, $$length = each_array_3.length; $$index_4 < $$length; $$index_4++) {
          let entry = each_array_3[$$index_4];
          $$renderer2.push(`<tr class="svelte-2pp8mk"><td class="cell-name svelte-2pp8mk">${escape_html(entry.name)}</td><!--[-->`);
          const each_array_4 = ensure_array_like(balanceLeaveTypeIds()());
          for (let $$index_3 = 0, $$length2 = each_array_4.length; $$index_3 < $$length2; $$index_3++) {
            let ltId = each_array_4[$$index_3];
            const b = getBalance(entry, ltId);
            $$renderer2.push(`<td class="cell-num svelte-2pp8mk">${escape_html(b?.entitlement ?? 0)}</td> <td${attr_class("cell-num svelte-2pp8mk", void 0, { "cell-negative": b && b.available < 0 })}>${escape_html(b?.available ?? 0)}</td> <td class="cell-num svelte-2pp8mk">${escape_html(b?.taken ?? 0)}</td>`);
          }
          $$renderer2.push(`<!--]--></tr>`);
        }
        $$renderer2.push(`<!--]--></tbody></table></div> <p class="table-note svelte-2pp8mk">Field-group discipline: only fields present in the API response are shown.
          User IDs are resolved to names via the /reports/leave-balance response.</p>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.report === "utilization") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="report-section svelte-2pp8mk"><h2 class="section-title svelte-2pp8mk">Leave Utilization — ${escape_html(data.year)}</h2> `);
      if (utilizationReport().length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="empty-msg svelte-2pp8mk">No utilization data for ${escape_html(data.year)}.</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="util-cards svelte-2pp8mk"><!--[-->`);
        const each_array_5 = ensure_array_like(utilizationReport());
        for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
          let u = each_array_5[$$index_5];
          const total = u.taken + u.planned;
          $$renderer2.push(`<div class="util-card svelte-2pp8mk"><div class="util-name svelte-2pp8mk">${escape_html(u.name)}</div> <div class="util-numbers svelte-2pp8mk"><span class="util-taken svelte-2pp8mk">${escape_html(u.taken)} taken</span> <span class="util-planned svelte-2pp8mk">${escape_html(u.planned)} planned</span></div> `);
          if (total > 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="util-bar-bg svelte-2pp8mk"><div class="util-bar-taken svelte-2pp8mk"${attr_style(`width: ${stringify(total > 0 ? Math.round(u.taken / total * 100) : 0)}%`)}></div> <div class="util-bar-planned svelte-2pp8mk"${attr_style(`width: ${stringify(total > 0 ? Math.round(u.planned / total * 100) : 0)}%`)}></div></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.report === "muster") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="report-section svelte-2pp8mk"><h2 class="section-title svelte-2pp8mk">Attendance Muster `);
      if (data.teamId) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`— ${escape_html(teams().find((t) => t.teamId === data.teamId)?.name)}`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`— Select a team`);
      }
      $$renderer2.push(`<!--]--></h2> `);
      if (data.musterError) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="error-msg svelte-2pp8mk">${escape_html(data.musterError)}</div>`);
      } else if (musterReport().length === 0) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<p class="empty-msg svelte-2pp8mk">No data for the selected range.</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="table-wrapper svelte-2pp8mk"><table class="muster-table svelte-2pp8mk"><thead><tr><th class="muster-name-col svelte-2pp8mk">Employee</th><!--[-->`);
        const each_array_6 = ensure_array_like(musterDates()());
        for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
          let date = each_array_6[$$index_6];
          $$renderer2.push(`<th class="muster-date-col svelte-2pp8mk">${escape_html(date.slice(5))}</th>`);
        }
        $$renderer2.push(`<!--]--><th class="svelte-2pp8mk">Hours</th></tr></thead><tbody><!--[-->`);
        const each_array_7 = ensure_array_like(musterReport());
        for (let $$index_8 = 0, $$length = each_array_7.length; $$index_8 < $$length; $$index_8++) {
          let row = each_array_7[$$index_8];
          const totalHours = row.days.reduce((sum, d) => sum + d.hours, 0);
          $$renderer2.push(`<tr class="svelte-2pp8mk"><td class="muster-name svelte-2pp8mk">${escape_html(row.name)}</td><!--[-->`);
          const each_array_8 = ensure_array_like(musterDates()());
          for (let $$index_7 = 0, $$length2 = each_array_8.length; $$index_7 < $$length2; $$index_7++) {
            let date = each_array_8[$$index_7];
            const day = getMusterDay(row, date);
            $$renderer2.push(`<td${attr_class(`muster-cell ${stringify(musterStatusClass(day?.status ?? ""))}`, "svelte-2pp8mk")}>${escape_html(day?.status?.slice(0, 2) ?? "?")}</td>`);
          }
          $$renderer2.push(`<!--]--><td class="muster-hours svelte-2pp8mk">${escape_html(totalHours.toFixed(1))}h</td></tr>`);
        }
        $$renderer2.push(`<!--]--></tbody></table></div> <div class="muster-legend svelte-2pp8mk"><span class="ms-legend ms-present svelte-2pp8mk">PR</span><span>Present</span> <span class="ms-legend ms-absent svelte-2pp8mk">AB</span><span>Absent</span> <span class="ms-legend ms-off svelte-2pp8mk">WO</span><span>Weekly Off</span> <span class="ms-legend ms-holiday svelte-2pp8mk">HO</span><span>Holiday</span> <span class="ms-legend ms-leave svelte-2pp8mk">OL</span><span>On Leave</span></div> <p class="table-note svelte-2pp8mk">Muster requires teamId + date range. The response shape includes day-level status, firstIn/lastOut, and hours.
          Field-group discipline: only fields in the API muster response are rendered (no compensation/identity columns in attendance context).</p>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};

import { l as attr_class, k as ensure_array_like, n as escape_html, m as attr, y as derived } from './index-DX9vaW0y.js';
import './root-D7heMfFX.js';
import './state.svelte-DsCXTBTP.js';
import { E as ErrorBanner } from './ErrorBanner-wLi6mrbE.js';
import { S as StatusBadge } from './StatusBadge-BUqBnBqR.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    const transfers = derived(() => data.transfers);
    const locations = derived(() => data.locations);
    const departments = derived(() => data.departments);
    const users = derived(() => data.users);
    let activeTab = data.tab ?? "list";
    function getLocationName(id) {
      if (!id) return "—";
      return locations().find((l) => l.id === id)?.name ?? id.slice(0, 8) + "…";
    }
    function getDeptName(id) {
      if (!id) return "—";
      return departments().find((d) => d.id === id)?.name ?? id.slice(0, 8) + "…";
    }
    function getUserName(id) {
      return users().find((u) => u.id === id)?.name ?? id.slice(0, 8) + "…";
    }
    function formatDate(s) {
      return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
    const statusMap = {
      PENDING: "PENDING",
      ACTIVE: "APPROVED",
      COMPLETED: "APPROVED",
      CANCELLED: "CANCELLED"
    };
    let justApprovedId = null;
    const isAdmin = derived(() => data.user.role === "ADMIN" || data.user.role === "OWNER");
    $$renderer2.push(`<div class="transfers-page svelte-11ja0d3"><div class="page-header svelte-11ja0d3"><h1 class="page-title svelte-11ja0d3">Transfers</h1> <div class="tab-row svelte-11ja0d3"><button${attr_class("tab svelte-11ja0d3", void 0, { "tab--active": activeTab === "list" })}>Transfer List</button> `);
    if (data.isManager) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button${attr_class("tab svelte-11ja0d3", void 0, { "tab--active": activeTab === "request" })}>Request Transfer</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div> `);
    if (form?.requestSuccess) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="success-banner svelte-11ja0d3">Transfer initiated successfully. It is now PENDING approval.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.approveSuccess) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="success-banner svelte-11ja0d3">Transfer approved. <strong class="revoke-note svelte-11ja0d3">⚡ FGA fast-lane: <code class="svelte-11ja0d3">syncOrgTuples</code> was called synchronously — the previous manager
        should immediately lose /employees visibility for the transferred employee.
        The outbox relay is the reliability guarantee behind this.</strong></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.cancelSuccess) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="success-banner svelte-11ja0d3">Transfer cancelled.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.requestError) {
      $$renderer2.push("<!--[0-->");
      ErrorBanner($$renderer2, { error: form.requestError });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.approveError) {
      $$renderer2.push("<!--[0-->");
      ErrorBanner($$renderer2, { error: form.approveError });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.cancelError) {
      $$renderer2.push("<!--[0-->");
      ErrorBanner($$renderer2, { error: form.cancelError });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (activeTab === "list") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="transfers-list svelte-11ja0d3">`);
      if (transfers().length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="empty-state svelte-11ja0d3"><div class="empty-icon svelte-11ja0d3">📦</div> <p class="empty-title svelte-11ja0d3">No transfers found</p> <p class="empty-desc svelte-11ja0d3">No transfers have been initiated for your org.</p> `);
        if (data.isManager) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button class="btn-primary mt-12 svelte-11ja0d3">+ Request a Transfer</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like(transfers());
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let t = each_array[$$index];
          const isJustApproved = justApprovedId === t.id;
          $$renderer2.push(`<div${attr_class("transfer-card svelte-11ja0d3", void 0, { "transfer-card--approved": isJustApproved })}><div class="transfer-top svelte-11ja0d3"><div class="transfer-left svelte-11ja0d3"><span class="transfer-user svelte-11ja0d3">${escape_html(getUserName(t.userId))}</span> <span class="transfer-type svelte-11ja0d3">${escape_html(t.type)}</span></div> <div class="transfer-right">`);
          StatusBadge($$renderer2, { status: statusMap[t.status] ?? "PENDING" });
          $$renderer2.push(`<!----></div></div> <div class="transfer-route svelte-11ja0d3"><span class="route-loc svelte-11ja0d3">${escape_html(getLocationName(t.fromLocationId))}</span> `);
          if (t.fromDepartmentId) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span class="route-dept svelte-11ja0d3">(${escape_html(getDeptName(t.fromDepartmentId))})</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> <span class="route-arrow svelte-11ja0d3">→</span> <span class="route-loc svelte-11ja0d3">${escape_html(getLocationName(t.toLocationId))}</span> `);
          if (t.toDepartmentId) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span class="route-dept svelte-11ja0d3">(${escape_html(getDeptName(t.toDepartmentId))})</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> <div class="transfer-meta svelte-11ja0d3"><span>Start: ${escape_html(formatDate(t.startDate))}</span> `);
          if (t.endDate) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span>End: ${escape_html(formatDate(t.endDate))}</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (t.notes) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span class="transfer-notes svelte-11ja0d3">Note: ${escape_html(t.notes)}</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> `);
          if (isJustApproved) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="revoke-inline svelte-11ja0d3"><span class="revoke-dot svelte-11ja0d3"></span> FGA access revocation propagated — old manager's /employees list no longer contains this employee.</div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (isAdmin() && t.status === "PENDING") {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="transfer-actions svelte-11ja0d3"><form method="post" action="?/approve"><input type="hidden" name="transferId"${attr("value", t.id)}/> <button type="submit" class="btn-approve svelte-11ja0d3">Approve</button></form> <form method="post" action="?/cancel"><input type="hidden" name="transferId"${attr("value", t.id)}/> <button type="submit" class="btn-cancel svelte-11ja0d3">Cancel</button></form></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (activeTab === "request") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="request-section svelte-11ja0d3"><div class="request-header svelte-11ja0d3"><h2 class="request-title svelte-11ja0d3">Request a Transfer</h2> <p class="request-desc svelte-11ja0d3">Initiate an employee transfer between locations. Requires ADMIN approval.</p></div> <form class="request-form svelte-11ja0d3" method="post" action="?/request"><div class="form-row svelte-11ja0d3"><label class="form-label svelte-11ja0d3" for="userId">Employee</label> <select class="form-select svelte-11ja0d3" name="userId" id="userId" required="">`);
      $$renderer2.option({ value: "" }, ($$renderer3) => {
        $$renderer3.push(`— Select employee —`);
      });
      $$renderer2.push(`<!--[-->`);
      const each_array_1 = ensure_array_like(users().filter((u) => u.id !== data.user.id));
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let u = each_array_1[$$index_1];
        $$renderer2.option({ value: u.id }, ($$renderer3) => {
          $$renderer3.push(`${escape_html(u.name)} (${escape_html(u.role)})`);
        });
      }
      $$renderer2.push(`<!--]--></select></div> <div class="form-grid svelte-11ja0d3"><div class="form-row svelte-11ja0d3"><label class="form-label svelte-11ja0d3" for="fromLocationId">From Location</label> <select class="form-select svelte-11ja0d3" name="fromLocationId" id="fromLocationId" required="">`);
      $$renderer2.option({ value: "" }, ($$renderer3) => {
        $$renderer3.push(`— Select —`);
      });
      $$renderer2.push(`<!--[-->`);
      const each_array_2 = ensure_array_like(locations());
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let loc = each_array_2[$$index_2];
        $$renderer2.option({ value: loc.id }, ($$renderer3) => {
          $$renderer3.push(`${escape_html(loc.name)}`);
        });
      }
      $$renderer2.push(`<!--]--></select></div> <div class="form-row svelte-11ja0d3"><label class="form-label svelte-11ja0d3" for="toLocationId">To Location</label> <select class="form-select svelte-11ja0d3" name="toLocationId" id="toLocationId" required="">`);
      $$renderer2.option({ value: "" }, ($$renderer3) => {
        $$renderer3.push(`— Select —`);
      });
      $$renderer2.push(`<!--[-->`);
      const each_array_3 = ensure_array_like(locations());
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        let loc = each_array_3[$$index_3];
        $$renderer2.option({ value: loc.id }, ($$renderer3) => {
          $$renderer3.push(`${escape_html(loc.name)}`);
        });
      }
      $$renderer2.push(`<!--]--></select></div></div> <div class="form-grid svelte-11ja0d3"><div class="form-row svelte-11ja0d3"><label class="form-label svelte-11ja0d3" for="fromDepartmentId">From Department (optional)</label> <select class="form-select svelte-11ja0d3" name="fromDepartmentId" id="fromDepartmentId">`);
      $$renderer2.option({ value: "" }, ($$renderer3) => {
        $$renderer3.push(`— None —`);
      });
      $$renderer2.push(`<!--[-->`);
      const each_array_4 = ensure_array_like(departments());
      for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
        let dept = each_array_4[$$index_4];
        $$renderer2.option({ value: dept.id }, ($$renderer3) => {
          $$renderer3.push(`${escape_html(dept.name)}`);
        });
      }
      $$renderer2.push(`<!--]--></select></div> <div class="form-row svelte-11ja0d3"><label class="form-label svelte-11ja0d3" for="toDepartmentId">To Department (optional)</label> <select class="form-select svelte-11ja0d3" name="toDepartmentId" id="toDepartmentId">`);
      $$renderer2.option({ value: "" }, ($$renderer3) => {
        $$renderer3.push(`— None —`);
      });
      $$renderer2.push(`<!--[-->`);
      const each_array_5 = ensure_array_like(departments());
      for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
        let dept = each_array_5[$$index_5];
        $$renderer2.option({ value: dept.id }, ($$renderer3) => {
          $$renderer3.push(`${escape_html(dept.name)}`);
        });
      }
      $$renderer2.push(`<!--]--></select></div></div> <div class="form-grid svelte-11ja0d3"><div class="form-row svelte-11ja0d3"><label class="form-label svelte-11ja0d3" for="type">Transfer Type</label> <select class="form-select svelte-11ja0d3" name="type" id="type" required="">`);
      $$renderer2.option({ value: "PERMANENT" }, ($$renderer3) => {
        $$renderer3.push(`Permanent`);
      });
      $$renderer2.option({ value: "TEMPORARY" }, ($$renderer3) => {
        $$renderer3.push(`Temporary`);
      });
      $$renderer2.push(`</select></div> <div class="form-row svelte-11ja0d3"><label class="form-label svelte-11ja0d3" for="startDate">Start Date</label> <input class="form-input svelte-11ja0d3" type="date" name="startDate" id="startDate" required=""/></div></div> <div class="form-grid svelte-11ja0d3"><div class="form-row svelte-11ja0d3"><label class="form-label svelte-11ja0d3" for="endDate">End Date (optional, for temporary)</label> <input class="form-input svelte-11ja0d3" type="date" name="endDate" id="endDate"/></div> <div class="form-row svelte-11ja0d3"><label class="form-label svelte-11ja0d3" for="notes">Notes (optional)</label> <input class="form-input svelte-11ja0d3" type="text" name="notes" id="notes" placeholder="Reason, instructions…" maxlength="1000"/></div></div> <div class="form-footer svelte-11ja0d3"><button type="submit" class="btn-primary svelte-11ja0d3">Initiate Transfer</button> <div class="form-note svelte-11ja0d3">A transfer is PENDING until an ADMIN approves it. On approval, the FGA <code class="svelte-11ja0d3">syncOrgTuples</code> fast-lane runs synchronously to revoke the old
            manager's viewer relation immediately.</div></div></form></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CanOaBVZ.js.map

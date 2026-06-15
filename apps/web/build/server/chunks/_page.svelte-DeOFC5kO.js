import { x as head, l as attr_class, m as attr, n as escape_html, k as ensure_array_like, y as derived } from './index-DX9vaW0y.js';
import './root-D7heMfFX.js';
import './state.svelte-DsCXTBTP.js';
import { S as StatusBadge } from './StatusBadge-BUqBnBqR.js';

/* empty css                                                        */
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let activeTab = "my";
    function typeName(typeId) {
      const t = data.leaveTypes.find((lt) => lt.leaveTypeId === typeId);
      return t?.name ?? typeId.slice(0, 8);
    }
    let myLeaves = derived(() => data.myLeaves);
    function formatDate(d) {
      return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
    let pendingApprovals = derived(() => data.pendingApprovals);
    let isManager = derived(() => data.user?.role === "MANAGER" || data.user?.role === "ADMIN");
    head("1hu7odk", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Leave — Avkash</title>`);
      });
    });
    $$renderer2.push(`<div class="leave-page svelte-1hu7odk"><header class="page-header svelte-1hu7odk"><h1 class="svelte-1hu7odk">Leave</h1> <p class="subtitle svelte-1hu7odk">Manage your leave requests and balances</p></header> <div class="tabs svelte-1hu7odk" role="tablist"><button${attr_class("tab-btn svelte-1hu7odk", void 0, { "active": activeTab === "my" })} role="tab"${attr("aria-selected", activeTab === "my")}>My Requests</button> <button${attr_class("tab-btn svelte-1hu7odk", void 0, { "active": activeTab === "apply" })} role="tab"${attr("aria-selected", activeTab === "apply")}>Apply Leave</button> `);
    if (isManager()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button${attr_class("tab-btn svelte-1hu7odk", void 0, { "active": activeTab === "queue" })} role="tab"${attr("aria-selected", activeTab === "queue")}>Approval Queue `);
      if (pendingApprovals().length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="tab-count svelte-1hu7odk">${escape_html(pendingApprovals().length)}</span>`);
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
      $$renderer2.push(`<div class="tab-panel svelte-1hu7odk" role="tabpanel"><div class="panel-header svelte-1hu7odk"><div class="balance-pills svelte-1hu7odk"><!--[-->`);
      const each_array = ensure_array_like(data.leaveTypes);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let lt = each_array[$$index];
        const bal = data.balances.find((b) => b.leaveTypeId === lt.leaveTypeId);
        if (bal && (lt.name === "Casual Leave" || lt.name === "Sick Leave" || lt.name === "Earned Leave")) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="balance-pill svelte-1hu7odk"><span class="bp-name svelte-1hu7odk">${escape_html(lt.name.replace(" Leave", ""))}</span> <span class="bp-val mono svelte-1hu7odk">${escape_html(bal.available)}</span> <span class="bp-sep svelte-1hu7odk">/</span> <span class="bp-total mono muted svelte-1hu7odk">${escape_html(bal.entitlement)}</span></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div></div> `);
      if (myLeaves().length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="empty-state svelte-1hu7odk">No leave requests yet. <button class="link-btn svelte-1hu7odk">Apply for leave →</button></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="leaves-list svelte-1hu7odk"><!--[-->`);
        const each_array_1 = ensure_array_like(myLeaves());
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let leave = each_array_1[$$index_1];
          $$renderer2.push(`<div class="leave-card svelte-1hu7odk"><div class="leave-card-left svelte-1hu7odk"><div class="leave-type-name svelte-1hu7odk">${escape_html(typeName(leave.leaveTypeId))}</div> <div class="leave-dates svelte-1hu7odk">${escape_html(formatDate(leave.startDate))} `);
          if (leave.startDate !== leave.endDate) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`– ${escape_html(formatDate(leave.endDate))}`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> · <span class="mono svelte-1hu7odk">${escape_html(leave.workingDays)} days</span></div> `);
          if (leave.reason) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="leave-reason svelte-1hu7odk">${escape_html(leave.reason)}</div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> <div class="leave-card-right svelte-1hu7odk">`);
          StatusBadge($$renderer2, { status: leave.isApproved });
          $$renderer2.push(`<!----> <div class="leave-applied-on svelte-1hu7odk">Applied ${escape_html(formatDate(leave.createdOn))}</div></div></div>`);
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
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DeOFC5kO.js.map

import { h as head, e as ensure_array_like, c as escape_html, i as attr_style, d as stringify, a as attr_class, f as derived } from "../../../../chunks/index.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const leaveTypes = derived(() => data.leaveTypes);
    const policies = derived(() => data.policies);
    const teams = derived(() => data.teams);
    const leaveTypesCategorized = derived(() => leaveTypes().filter((lt) => lt.isActive));
    function getPoliciesFor(teamId, leaveTypeId) {
      return policies().filter((p) => p.teamId === teamId && p.leaveTypeId === leaveTypeId && p.isActive);
    }
    function formatCap(p) {
      if (p.unlimited) return "Unlimited";
      return p.maxLeaves != null ? `${p.maxLeaves}/yr` : "—";
    }
    function formatAccrual(p) {
      if (!p.accruals) return "No";
      return p.accrualFrequency ? `Yes (${p.accrualFrequency.toLowerCase()})` : "Yes";
    }
    head("1s38ma0", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Leave Types &amp; Policies — Admin — Avkash</title>`);
      });
    });
    $$renderer2.push(`<div class="section-header svelte-1s38ma0"><h1 class="svelte-1s38ma0">Leave Types &amp; Policies</h1> <p class="subtitle svelte-1s38ma0">CL / SL / EL / ML policy matrix — caps, accrual, rollover, encashment, and probation rules per team.</p></div> <div class="card svelte-1s38ma0"><div class="card-header svelte-1s38ma0">Leave Types</div> <table class="data-table svelte-1s38ma0"><thead><tr><th class="svelte-1s38ma0">Name</th><th class="svelte-1s38ma0">Kind</th><th class="svelte-1s38ma0">Paid</th><th class="svelte-1s38ma0">Active</th></tr></thead><tbody>`);
    const each_array = ensure_array_like(leaveTypesCategorized());
    if (each_array.length !== 0) {
      $$renderer2.push("<!--[-->");
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let lt = each_array[$$index];
        $$renderer2.push(`<tr class="svelte-1s38ma0"><td class="svelte-1s38ma0">`);
        if (lt.emoji) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="lt-emoji svelte-1s38ma0">${escape_html(lt.emoji)}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <span class="lt-name svelte-1s38ma0">${escape_html(lt.name)}</span> `);
        if (lt.color) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="lt-swatch svelte-1s38ma0"${attr_style(`background: #${stringify(lt.color)};`)}></span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></td><td class="svelte-1s38ma0"><span${attr_class("kind-badge svelte-1s38ma0", void 0, { "comp-off": lt.kind === "COMP_OFF" })}>${escape_html(lt.kind)}</span></td><td class="svelte-1s38ma0">${escape_html(lt.isPaid ? "Yes" : "No")}</td><td class="svelte-1s38ma0"><span${attr_class("status-dot svelte-1s38ma0", void 0, { "dot-active": lt.isActive, "dot-inactive": !lt.isActive })}>${escape_html(lt.isActive ? "Active" : "Inactive")}</span></td></tr>`);
      }
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<tr class="svelte-1s38ma0"><td colspan="4" class="empty-cell svelte-1s38ma0">No leave types found.</td></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody></table></div> <!--[-->`);
    const each_array_1 = ensure_array_like(teams());
    for (let $$index_3 = 0, $$length = each_array_1.length; $$index_3 < $$length; $$index_3++) {
      let team = each_array_1[$$index_3];
      const teamPolicies = policies().filter((p) => p.teamId === team.teamId && p.isActive);
      if (teamPolicies.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="card svelte-1s38ma0" style="margin-top: 24px;"><div class="card-header svelte-1s38ma0">${escape_html(team.name)} <span class="team-badge svelte-1s38ma0">team</span></div> <table class="data-table policy-table svelte-1s38ma0"><thead><tr><th class="svelte-1s38ma0">Leave Type</th><th class="svelte-1s38ma0">Cap</th><th class="svelte-1s38ma0">Accrues</th><th class="svelte-1s38ma0">Carry-forward</th><th class="svelte-1s38ma0">Encashable</th><th class="svelte-1s38ma0">Probation</th></tr></thead><tbody><!--[-->`);
        const each_array_2 = ensure_array_like(leaveTypesCategorized());
        for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
          let lt = each_array_2[$$index_1];
          const pol = getPoliciesFor(team.teamId, lt.leaveTypeId)[0];
          if (pol) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<tr class="svelte-1s38ma0"><td class="svelte-1s38ma0">`);
            if (lt.emoji) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<span class="lt-emoji svelte-1s38ma0">${escape_html(lt.emoji)}</span>`);
            } else {
              $$renderer2.push("<!--[-1-->");
            }
            $$renderer2.push(`<!--]--> ${escape_html(lt.name)}</td><td class="mono svelte-1s38ma0">${escape_html(formatCap(pol))}</td><td class="svelte-1s38ma0">${escape_html(formatAccrual(pol))}</td><td class="svelte-1s38ma0">`);
            if (pol.rollOver) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<span class="rollover-detail svelte-1s38ma0">`);
              if (pol.rollOverLimit != null) {
                $$renderer2.push("<!--[0-->");
                $$renderer2.push(`up to ${escape_html(pol.rollOverLimit)}`);
              } else {
                $$renderer2.push("<!--[-1-->");
              }
              $$renderer2.push(`<!--]--> `);
              if (pol.rollOverExpiry) {
                $$renderer2.push("<!--[0-->");
                $$renderer2.push(`<span class="rollover-expiry svelte-1s38ma0">, expires ${escape_html(pol.rollOverExpiry)}</span>`);
              } else {
                $$renderer2.push("<!--[-1-->");
              }
              $$renderer2.push(`<!--]--></span>`);
            } else {
              $$renderer2.push("<!--[-1-->");
              $$renderer2.push(`<span class="muted svelte-1s38ma0">No</span>`);
            }
            $$renderer2.push(`<!--]--></td><td class="svelte-1s38ma0">`);
            if (pol.encashable) {
              $$renderer2.push("<!--[0-->");
              if (pol.encashmentMaxDays != null) {
                $$renderer2.push("<!--[0-->");
                $$renderer2.push(`Yes (max ${escape_html(pol.encashmentMaxDays)}d)`);
              } else {
                $$renderer2.push("<!--[-1-->");
                $$renderer2.push(`Yes`);
              }
              $$renderer2.push(`<!--]-->`);
            } else if (pol.compOffExpiryDays != null) {
              $$renderer2.push("<!--[1-->");
              $$renderer2.push(`<span class="comp-expiry svelte-1s38ma0">Expires in ${escape_html(pol.compOffExpiryDays)}d</span>`);
            } else {
              $$renderer2.push("<!--[-1-->");
              $$renderer2.push(`<span class="muted svelte-1s38ma0">No</span>`);
            }
            $$renderer2.push(`<!--]--></td><td class="probation-cell svelte-1s38ma0">`);
            if (pol.probationAccruals === false) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<span class="probation-no svelte-1s38ma0">No accrual</span>`);
            } else if (pol.probationMaxLeaves != null) {
              $$renderer2.push("<!--[1-->");
              $$renderer2.push(`<span class="probation-cap svelte-1s38ma0">Cap ${escape_html(pol.probationMaxLeaves)}</span>`);
            } else {
              $$renderer2.push("<!--[-1-->");
              $$renderer2.push(`<span class="muted svelte-1s38ma0">—</span>`);
            }
            $$renderer2.push(`<!--]--></td></tr>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></tbody></table> <!--[-->`);
        const each_array_3 = ensure_array_like(teamPolicies);
        for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
          let p = each_array_3[$$index_2];
          if (p.rollOverExpiry === "03/31") {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="fy-note svelte-1s38ma0">EL carry-forward reckon date is <strong class="svelte-1s38ma0">03/31</strong> — Indian financial year boundary (April–March).</div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> `);
    if (teams().length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-state svelte-1s38ma0">No teams found. Create teams first to attach leave policies.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};

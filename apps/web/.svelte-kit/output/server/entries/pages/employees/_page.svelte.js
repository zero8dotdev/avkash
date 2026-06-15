import { c as escape_html, b as attr, e as ensure_array_like, d as stringify, a as attr_class, f as derived } from "../../../chunks/index.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const employees = derived(() => data.employees);
    const teams = derived(() => data.teams);
    const locations = derived(() => data.locations);
    function getTeamName(teamId) {
      if (!teamId) return "—";
      return teams().find((t) => t.teamId === teamId)?.name ?? teamId.slice(0, 8) + "…";
    }
    function getLocationName(locationId) {
      if (!locationId) return "—";
      return locations().find((l) => l.id === locationId)?.name ?? locationId.slice(0, 8) + "…";
    }
    function roleClass(role) {
      if (role === "ADMIN" || role === "OWNER") return "role-admin";
      if (role === "MANAGER") return "role-manager";
      return "role-user";
    }
    let searchVal = data.search ?? "";
    let teamFilterVal = data.teamFilter ?? "";
    $$renderer2.push(`<div class="employees-page svelte-1hfo2i2"><div class="page-header svelte-1hfo2i2"><div class="header-left svelte-1hfo2i2"><h1 class="page-title svelte-1hfo2i2">Employee Directory</h1> <span class="count-badge svelte-1hfo2i2">${escape_html(data.totalVisible)} visible `);
    if (data.fgaCount !== data.totalVisible) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="fga-note svelte-1hfo2i2">(FGA-filtered: ${escape_html(data.fgaCount)})</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></span></div> <div class="header-right">`);
    if (data.user.role !== "MANAGER" && data.user.role !== "ADMIN" && data.user.role !== "OWNER") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="access-note svelte-1hfo2i2"><span class="lock-icon svelte-1hfo2i2">🔒</span> Directory filtered by role — viewing own profile only</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="access-note access-note--ok svelte-1hfo2i2">FGA-filtered: ${escape_html(data.fgaCount)} of all org members visible to your role</div>`);
    }
    $$renderer2.push(`<!--]--></div></div> <form class="filter-bar svelte-1hfo2i2" method="get" action="/employees"><input class="filter-input svelte-1hfo2i2" type="text" name="search" placeholder="Search by name or email…"${attr("value", searchVal)}/> `);
    $$renderer2.select(
      {
        class: "filter-select",
        name: "teamId",
        value: teamFilterVal,
        onchange: (e) => {
          teamFilterVal = e.target.value;
        }
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "" }, ($$renderer4) => {
          $$renderer4.push(`All teams`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(teams());
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let team = each_array[$$index];
          $$renderer3.option({ value: team.teamId }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(team.name)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      },
      "svelte-1hfo2i2"
    );
    $$renderer2.push(` <button type="submit" class="filter-btn svelte-1hfo2i2">Filter</button> `);
    if (data.search || data.teamFilter) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<a href="/employees" class="filter-clear svelte-1hfo2i2">Clear</a>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></form> `);
    if (employees().length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-state svelte-1hfo2i2">`);
      if (data.fgaCount === 0 && (data.user.role === "MANAGER" || data.user.role === "ADMIN")) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="empty-icon svelte-1hfo2i2">🔒</div> <p class="empty-title svelte-1hfo2i2">No employees accessible</p> <p class="empty-desc svelte-1hfo2i2">FGA found no employees under your management chain.</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="empty-icon svelte-1hfo2i2">🔍</div> <p class="empty-title svelte-1hfo2i2">No results</p> <p class="empty-desc svelte-1hfo2i2">Try adjusting the search or team filter.</p>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="employee-grid svelte-1hfo2i2"><!--[-->`);
      const each_array_1 = ensure_array_like(employees());
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let emp = each_array_1[$$index_1];
        $$renderer2.push(`<a${attr("href", `/employees/${stringify(emp.id)}`)} class="employee-card svelte-1hfo2i2"><div class="emp-avatar svelte-1hfo2i2">${escape_html(emp.name.slice(0, 2).toUpperCase())}</div> <div class="emp-body svelte-1hfo2i2"><div class="emp-top svelte-1hfo2i2"><span class="emp-name svelte-1hfo2i2">${escape_html(emp.name)}</span> <span${attr_class(`emp-role ${stringify(roleClass(emp.role))}`, "svelte-1hfo2i2")}>${escape_html(emp.role)}</span></div> <div class="emp-email svelte-1hfo2i2">${escape_html(emp.email)}</div> <div class="emp-meta svelte-1hfo2i2"><span class="emp-team svelte-1hfo2i2"><span class="meta-label svelte-1hfo2i2">Team</span> ${escape_html(getTeamName(emp.teamId))}</span> `);
        if (emp.locationId) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="emp-loc svelte-1hfo2i2"><span class="meta-label svelte-1hfo2i2">Loc</span> ${escape_html(getLocationName(emp.locationId))}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (emp.joinedOn) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="emp-joined svelte-1hfo2i2"><span class="meta-label svelte-1hfo2i2">Joined</span> ${escape_html(emp.joinedOn)}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></div></a>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};

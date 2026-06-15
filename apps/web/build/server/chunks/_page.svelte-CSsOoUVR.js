import { x as head, k as ensure_array_like, l as attr_class, m as attr, n as escape_html, ax as ssr_context, o as stringify, aw as attr_style, y as derived } from './index-DX9vaW0y.js';

function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
function DemoConsole($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { entry } = $$props;
    $$renderer2.push(`<div class="console-strip svelte-11s28as"><span class="con-label svelte-11s28as">→ API</span> `);
    if (entry) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="con-call svelte-11s28as">${escape_html(entry.method)} ${escape_html(entry.path)} `);
      if (entry.status !== null) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span${attr_class("con-status svelte-11s28as", void 0, { "ok": !entry.isError, "err": entry.isError })}>${escape_html(entry.status)}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (entry.ms !== null) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="con-ms svelte-11s28as">${escape_html(entry.ms)}ms</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></span> <div class="con-sep svelte-11s28as"></div> `);
      if (entry.scripted) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="con-resp scripted svelte-11s28as">scripted — feature seed data pending</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<span${attr_class("con-resp svelte-11s28as", void 0, { "error": entry.isError })}>${escape_html(entry.response)}</span>`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<span class="con-call svelte-11s28as">—</span> <div class="con-sep svelte-11s28as"></div> <span class="con-resp svelte-11s28as">Waiting for interaction…</span>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function Ch0Intro($$renderer) {
  const personas = [
    {
      name: "Priya Sharma",
      role: "ADMIN",
      badgeClass: "admin",
      team: "General",
      email: "priya@meridian-demo.example.com"
    },
    {
      name: "Rohan Mehta",
      role: "MANAGER",
      badgeClass: "manager",
      team: "Assembly",
      email: "rohan@meridian-demo.example.com"
    },
    {
      name: "Dev Iyer",
      role: "MANAGER",
      badgeClass: "manager",
      team: "Logistics",
      email: "dev@meridian-demo.example.com"
    },
    {
      name: "Sara Khan",
      role: "USER",
      badgeClass: "user",
      team: "Assembly",
      email: "sara@meridian-demo.example.com"
    },
    {
      name: "Anita Pillai",
      role: "USER",
      badgeClass: "user",
      team: "General",
      email: "anita@meridian-demo.example.com"
    }
  ];
  $$renderer.push(`<div class="scene intro-scene svelte-1t35f1"><div class="intro-header svelte-1t35f1"><div class="org-logo-badge svelte-1t35f1">M</div> <div><h1 class="intro-org-name svelte-1t35f1">Meridian Manufacturing Pvt. Ltd.</h1> <p class="intro-org-sub svelte-1t35f1">Coimbatore Plant (Assembly) · Bengaluru HQ (Logistics) · Live seed data</p></div></div> <div class="intro-grid svelte-1t35f1"><div class="intro-card svelte-1t35f1"><div class="intro-card-label svelte-1t35f1">Business Units</div> <div class="intro-card-value svelte-1t35f1">Plants + Corporate</div> <div class="intro-card-detail svelte-1t35f1">2 BUs, org id 6a5109da</div></div> <div class="intro-card svelte-1t35f1"><div class="intro-card-label svelte-1t35f1">Departments</div> <div class="intro-card-value svelte-1t35f1">Manufacturing · Finance</div> <div class="intro-card-detail svelte-1t35f1">Assembly + Logistics under Mfg</div></div> <div class="intro-card svelte-1t35f1"><div class="intro-card-label svelte-1t35f1">Demo Personas</div> <div class="intro-card-value svelte-1t35f1">5 active users</div> <div class="intro-card-detail svelte-1t35f1">Password: AvkashDemo@2026</div></div></div> <div class="persona-table svelte-1t35f1"><div class="pt-header svelte-1t35f1"><span>Name</span> <span>Role</span> <span>Team</span> <span>Email</span></div> <!--[-->`);
  const each_array = ensure_array_like(personas);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let p = each_array[$$index];
    $$renderer.push(`<div class="pt-row svelte-1t35f1"><span class="pt-name svelte-1t35f1">${escape_html(p.name)}</span> <span${attr_class(`badge ${stringify(p.badgeClass)}`, "svelte-1t35f1")}>${escape_html(p.role)}</span> <span class="pt-team svelte-1t35f1">${escape_html(p.team)}</span> <span class="pt-email svelte-1t35f1">${escape_html(p.email)}</span></div>`);
  }
  $$renderer.push(`<!--]--></div> <div class="intro-note svelte-1t35f1"><span class="note-label svelte-1t35f1">Org ID</span> <span class="note-val svelte-1t35f1">6a5109da-bad7-4515-9b0c-7ecff8dc9448</span> <span class="note-sep svelte-1t35f1">·</span> <span class="note-label svelte-1t35f1">API</span> <span class="note-val svelte-1t35f1">http://localhost:3001</span></div></div> <div class="narration svelte-1t35f1"><h3 class="svelte-1t35f1">Welcome to Avkash v2</h3> <p class="svelte-1t35f1">This player walks through <span class="highlight svelte-1t35f1">9 chapters</span> — from org hierarchy to half-day leave.
    Each chapter shows a real product capability.</p> <p class="svelte-1t35f1">The <span class="highlight svelte-1t35f1">Meridian Manufacturing</span> org is fully seeded in the live API.
    Chapters <span class="highlight svelte-1t35f1" style="color:var(--green)">LIVE</span> make real API calls;
    chapters <span class="highlight svelte-1t35f1" style="color:var(--amber)">SCRIPTED</span> animate against
    static data (seed data pending for that feature).</p> <p class="svelte-1t35f1">Use <strong>← →</strong> arrow keys or the prev/next buttons to advance.
    Click any chapter pill to jump directly.</p> <p style="color:var(--muted);font-size:12px;margin-top:auto;" class="svelte-1t35f1">Presenter tip: sign in as <strong>Priya Sharma</strong> (ADMIN) for full API visibility.
    Sara Khan (USER, Assembly) is the leave-demo persona.</p></div>`);
}
function Ch1Company($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { orgData } = $$props;
    let rootVisible = false;
    let trunkVisible = false;
    let crossbarVisible = false;
    let colsVisible = [];
    const deptColors = [
      "#58a6ff",
      "#3fb950",
      "#bc8cff",
      "#d29922",
      "#8b949e",
      "#f85149"
    ];
    const deptIcons = ["⚙", "◎", "◈", "⬡", "₹", "⚡"];
    const deptCols = derived(() => () => {
      const { departments, teams, employees } = orgData;
      return departments.map((dept, i) => {
        const dTeams = teams.filter((t) => t.departmentId === dept.id);
        return {
          id: dept.id,
          name: dept.name,
          color: deptColors[i % deptColors.length],
          icon: deptIcons[i % deptIcons.length],
          teams: dTeams.map((t) => {
            const members = employees.filter((e) => e.teamId === t.teamId);
            const initials = members.slice(0, 3).map((e) => e.name.split(" ").map((w) => w[0]).slice(0, 2).join(""));
            return {
              teamId: t.teamId,
              name: t.name,
              memberCount: t.memberCount ?? members.length,
              initials
            };
          })
        };
      });
    });
    const employeeCount = derived(() => orgData.employees.length);
    $$renderer2.push(`<div class="full-scene svelte-h4af5x"><div class="org-tree svelte-h4af5x"><div${attr_class("org-root-card svelte-h4af5x", void 0, { "visible": rootVisible })}><div class="org-logo-badge svelte-h4af5x">M</div> <div><div class="org-root-name svelte-h4af5x">${escape_html(orgData.org?.name ?? "Meridian Manufacturing")}</div> <div class="org-root-sub svelte-h4af5x">Meridian Manufacturing · Live data from API</div></div> <div class="org-root-pills svelte-h4af5x"><div class="org-root-pill svelte-h4af5x"><b>${escape_html(employeeCount())}</b> employees</div> <div class="org-root-pill svelte-h4af5x"><b>${escape_html(orgData.businessUnits.length)}</b> business units</div> <div class="org-root-pill svelte-h4af5x"><b>${escape_html(orgData.departments.length)}</b> departments</div></div></div> <div${attr_class("org-trunk svelte-h4af5x", void 0, { "visible": trunkVisible })}></div> <div class="org-crossbar-wrap svelte-h4af5x"><div${attr_class("org-crossbar svelte-h4af5x", void 0, { "visible": crossbarVisible })}></div></div> <div class="org-depts svelte-h4af5x"><!--[-->`);
    const each_array = ensure_array_like(deptCols()());
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let dept = each_array[i];
      $$renderer2.push(`<div${attr_class("org-dept-col svelte-h4af5x", void 0, { "visible": colsVisible[i] })}${attr_style(`--dc:${stringify(dept.color)}`)}><div class="org-dept-hdr svelte-h4af5x"><div class="org-dept-icon svelte-h4af5x">${escape_html(dept.icon)}</div> <div class="org-dept-n svelte-h4af5x">${escape_html(dept.name)}</div> <div class="org-dept-m svelte-h4af5x">${escape_html(dept.teams.length)} team${escape_html(dept.teams.length !== 1 ? "s" : "")}
              · ${escape_html(dept.teams.reduce((s, t) => s + t.memberCount, 0))} people</div></div> <!--[-->`);
      const each_array_1 = ensure_array_like(dept.teams);
      for (let ti = 0, $$length2 = each_array_1.length; ti < $$length2; ti++) {
        let team = each_array_1[ti];
        $$renderer2.push(`<div class="org-team-card svelte-h4af5x"${attr_style(`transition-delay:${stringify(ti * 55)}ms`)}><div class="org-team-n svelte-h4af5x">${escape_html(team.name)}</div> <div class="org-team-cnt svelte-h4af5x">${escape_html(team.memberCount)} members</div> <div class="org-avatars svelte-h4af5x"><!--[-->`);
        const each_array_2 = ensure_array_like(team.initials);
        for (let $$index = 0, $$length3 = each_array_2.length; $$index < $$length3; $$index++) {
          let init = each_array_2[$$index];
          $$renderer2.push(`<div class="org-av svelte-h4af5x">${escape_html(init)}</div>`);
        }
        $$renderer2.push(`<!--]--> `);
        if (team.memberCount > team.initials.length) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="org-av more svelte-h4af5x">+${escape_html(team.memberCount - team.initials.length)}</div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div></div></div>`);
  });
}
function Ch2Ladder($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const levels = [
      {
        code: "DIR",
        name: "Director",
        rank: 100,
        floating: true,
        punchConfirm: false,
        color: "#bc8cff"
      },
      {
        code: "GM",
        name: "General Manager",
        rank: 80,
        floating: true,
        punchConfirm: false,
        color: "#bc8cff"
      },
      {
        code: "DGM",
        name: "Deputy General Manager",
        rank: 65,
        floating: false,
        punchConfirm: false,
        color: "#58a6ff"
      },
      {
        code: "MGR",
        name: "Manager",
        rank: 50,
        floating: false,
        punchConfirm: false,
        color: "#58a6ff"
      },
      {
        code: "AM",
        name: "Asst. Manager / Officer",
        rank: 40,
        floating: false,
        punchConfirm: false,
        color: "#58a6ff"
      },
      {
        code: "SUP",
        name: "Supervisor / Foreman",
        rank: 30,
        floating: false,
        punchConfirm: false,
        color: "#3fb950"
      },
      {
        code: "TECH",
        name: "Technician / ITI",
        rank: 20,
        floating: false,
        punchConfirm: false,
        color: "#3fb950"
      },
      {
        code: "OPR",
        name: "Machine Operator",
        rank: 15,
        floating: false,
        punchConfirm: true,
        color: "#d29922"
      },
      {
        code: "HLP1",
        name: "Helper Gr. I",
        rank: 10,
        floating: false,
        punchConfirm: true,
        color: "#8b949e"
      },
      {
        code: "HLP2",
        name: "Helper Gr. II",
        rank: 5,
        floating: false,
        punchConfirm: true,
        color: "#8b949e"
      }
    ];
    let rowsVisible = levels.map(() => false);
    $$renderer2.push(`<div class="scene svelte-c3nowd"><div class="section-title svelte-c3nowd">Employment Levels</div> <div class="levels-list svelte-c3nowd"><!--[-->`);
    const each_array = ensure_array_like(levels);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let lvl = each_array[i];
      $$renderer2.push(`<div${attr_class("level-row svelte-c3nowd", void 0, { "visible": rowsVisible[i] })}><div class="level-rank svelte-c3nowd"${attr_style(`background:${stringify(lvl.color)}22;color:${stringify(lvl.color)};border:1px solid ${stringify(lvl.color)}44`)}>${escape_html(lvl.rank)}</div> <div class="level-info svelte-c3nowd"><span class="level-name svelte-c3nowd">${escape_html(lvl.name)}</span> <span class="level-code svelte-c3nowd">${escape_html(lvl.code)}</span></div> <div class="level-icons svelte-c3nowd"><span${attr_class("level-icon floating svelte-c3nowd", void 0, { "active": lvl.floating })} title="Floating punch">◈</span> <span${attr_class("level-icon confirm svelte-c3nowd", void 0, { "active": lvl.punchConfirm })} title="Confirm WEB punch">✋</span></div></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="scripted-note svelte-c3nowd"><span class="scripted-badge svelte-c3nowd">SCRIPTED</span> <span>Org-levels are not yet seeded for Meridian. Data above reflects the design spec.</span></div></div> <div class="narration svelte-c3nowd"><h3 class="svelte-c3nowd">The Ladder</h3> <p class="svelte-c3nowd">Meridian doesn't use a flat <span class="highlight svelte-c3nowd">WORKER / EXECUTIVE</span> enum.
    They have <span class="highlight svelte-c3nowd">10 named levels</span> with a numeric rank — from Director (100) down to Helper Gr. II (5).</p> <p class="svelte-c3nowd"><span class="highlight svelte-c3nowd" style="color:var(--purple)">Directors and GMs float</span> — their punch routes
    to wherever they're physically present. This avoids the fiction of a Director "belonging" to one plant.</p> <p class="svelte-c3nowd"><span class="highlight svelte-c3nowd" style="color:var(--amber)">Operators, Helper Gr. I and II</span> require a supervisor
    to confirm their WEB punches before they count toward attendance. Device punches bypass this — hardware is trusted.</p> <p style="color:var(--muted);font-size:12px;margin-top:auto;" class="svelte-c3nowd">The rank field enables leave policy inheritance — policies can be restricted to rank ≥ 40 (officer and above)
    with a single config flag.</p></div>`);
  });
}
function Ch3Shifts($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const shifts = [
      {
        id: "gen",
        name: "General Shift",
        start: "09:30",
        end: "18:30",
        crossesMidnight: false,
        trackOT: false,
        allowedGenders: null,
        minStaff: 0,
        color: "#58a6ff",
        left: 39.58,
        width: 37.5,
        gen: true
      },
      {
        id: "a",
        name: "A · Morning",
        start: "06:00",
        end: "14:00",
        crossesMidnight: false,
        trackOT: true,
        allowedGenders: null,
        minStaff: 10,
        color: "#3fb950",
        left: 25,
        width: 33.33,
        gen: false
      },
      {
        id: "b",
        name: "B · Afternoon",
        start: "14:00",
        end: "22:00",
        crossesMidnight: false,
        trackOT: true,
        allowedGenders: null,
        minStaff: 10,
        color: "#d29922",
        left: 58.33,
        width: 33.33,
        gen: false
      },
      {
        id: "c",
        name: "C · Night",
        start: "22:00",
        end: "06:00",
        crossesMidnight: true,
        trackOT: true,
        allowedGenders: ["MALE"],
        minStaff: 8,
        color: "#f85149",
        left: 91.67,
        width: 8.33,
        gen: false
      }
    ];
    let segsVisible = [false, false, false, false];
    let chipsVisible = false;
    $$renderer2.push(`<div class="scene svelte-1yxwv9n"><div class="section-title svelte-1yxwv9n">24-Hour Shift Coverage</div> <div class="timeline-wrap svelte-1yxwv9n"><div class="timeline-header svelte-1yxwv9n"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div> <div class="timeline-bar svelte-1yxwv9n"><div${attr_class("shift-seg svelte-1yxwv9n", void 0, { "visible": segsVisible[3] })} style="left:91.67%;width:8.33%;background:rgba(248,81,73,0.25);color:#f85149"></div> <div${attr_class("shift-seg svelte-1yxwv9n", void 0, { "visible": segsVisible[3] })} style="left:0%;width:25%;background:rgba(248,81,73,0.25);color:#f85149"><span class="shift-seg-label svelte-1yxwv9n">C · Night</span></div> <div${attr_class("shift-seg svelte-1yxwv9n", void 0, { "visible": segsVisible[1] })} style="left:25%;width:33.33%;background:rgba(63,185,80,0.25);color:#3fb950"><span class="shift-seg-label svelte-1yxwv9n">A · Morning</span></div> <div${attr_class("shift-seg svelte-1yxwv9n", void 0, { "visible": segsVisible[2] })} style="left:58.33%;width:33.33%;background:rgba(210,153,34,0.25);color:#d29922"><span class="shift-seg-label svelte-1yxwv9n">B · Afternoon</span></div> <div${attr_class("shift-seg shift-gen svelte-1yxwv9n", void 0, { "visible": segsVisible[0] })} style="left:39.58%;width:37.5%;color:#58a6ff;border-color:#58a6ff;background:rgba(88,166,255,0.08)"><span class="shift-seg-label svelte-1yxwv9n">General · HQ</span></div></div> <div class="timeline-markers svelte-1yxwv9n"><span>0</span><span>3h</span><span>6h</span><span>9h</span><span>12h</span><span>15h</span><span>18h</span><span>21h</span><span>24h</span></div></div> <div${attr_class("shift-chips svelte-1yxwv9n", void 0, { "visible": chipsVisible })}><!--[-->`);
    const each_array = ensure_array_like(shifts);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let sh = each_array[$$index];
      $$renderer2.push(`<div class="shift-chip svelte-1yxwv9n"><div class="shift-dot svelte-1yxwv9n"${attr_style(`background:${stringify(sh.color)}`)}></div> <span class="chip-name svelte-1yxwv9n">${escape_html(sh.name)}</span> <span class="chip-times svelte-1yxwv9n">${escape_html(sh.start)}–${escape_html(sh.end)}</span> `);
      if (sh.trackOT) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="badge amber svelte-1yxwv9n">OT</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (sh.crossesMidnight) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="badge red svelte-1yxwv9n">↻ midnight</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (sh.allowedGenders) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="badge red svelte-1yxwv9n">♂ only</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="gender-note svelte-1yxwv9n">⚠ C Shift: Male only · Factories Act compliance</div> <div class="scripted-note svelte-1yxwv9n"><span class="scripted-badge svelte-1yxwv9n">SCRIPTED</span> <span>Shifts not yet seeded for Meridian. Data reflects design spec.</span></div></div> <div class="narration svelte-1yxwv9n"><h3 class="svelte-1yxwv9n">Three Shifts, One Clock</h3> <p class="svelte-1yxwv9n">Factory workers rotate through 3 shifts covering all 24 hours. The <span class="highlight svelte-1yxwv9n">General Shift</span> (09:30–18:30) is HQ-only — no overtime tracking for executives.</p> <p class="svelte-1yxwv9n">The <span class="highlight svelte-1yxwv9n" style="color:var(--red)">C Shift (Night)</span> crosses midnight — 22:00 to 06:00.
    Avkash marks this with <code class="svelte-1yxwv9n">crossesMidnight: true</code> so attendance spans two calendar dates correctly.</p> <p class="svelte-1yxwv9n">A legal restriction applies: <span class="highlight svelte-1yxwv9n" style="color:var(--red)">no female workers at night</span> in the SEZ plant (Factories Act). The <code class="svelte-1yxwv9n">allowedGenders</code> field enforces this at shift assignment time.</p> <p style="color:var(--muted);font-size:12px;margin-top:auto;" class="svelte-1yxwv9n">General Shift has <code class="svelte-1yxwv9n">trackOT: false</code> — a policy decision, not a system limitation.</p></div>`);
  });
}
function Ch4Punch($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let markerDropped = false;
    let markerPos = 3.125;
    let badgeVisible = false;
    $$renderer2.push(`<div class="scene svelte-14jdzrz"><div class="section-title svelte-14jdzrz">Punch-In · A Shift · Assembly Team</div> <div class="punch-scene svelte-14jdzrz"><div class="shift-meta svelte-14jdzrz">A Shift: 06:00 → 14:00  ·  Grace: 10 min  ·  OT threshold: 9h</div> <div class="shift-bar svelte-14jdzrz"><div class="grace-line svelte-14jdzrz" style="left:2.08%"><div class="grace-label svelte-14jdzrz">06:10 (grace ends)</div></div> <div${attr_class("punch-marker svelte-14jdzrz", void 0, {
      "dropped": markerDropped,
      "placed": badgeVisible
    })}${attr_style(`left:${stringify(markerPos)}%`)}><div class="punch-time-label svelte-14jdzrz">${escape_html("06:05")}</div> <div class="punch-dot svelte-14jdzrz"${attr_style(`background:${"var(--blue)"}`)}></div> <div class="punch-line svelte-14jdzrz"></div></div> <span class="bar-label-left svelte-14jdzrz">06:00</span> <span class="bar-label-right svelte-14jdzrz">14:00</span></div></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="actions svelte-14jdzrz"><button class="action-btn svelte-14jdzrz">${escape_html("Punch in late →")}</button></div> <div class="emp-note svelte-14jdzrz">Sara Khan · Assembly Team · WEB punch (requires supervisor confirmation)</div> <div class="scripted-note svelte-14jdzrz"><span class="scripted-badge svelte-14jdzrz">SCRIPTED</span> <span class="svelte-14jdzrz">POST /attendance/punch requires device auth (DEVICE_AUTH error for WEB sessions). Animation shows expected API response.</span></div></div> <div class="narration svelte-14jdzrz"><h3 class="svelte-14jdzrz">The First Punch</h3> <p class="svelte-14jdzrz"><span class="highlight svelte-14jdzrz">Sara Khan</span>, Assembly team, clocks in for her A Shift (06:00–14:00).</p> <p class="svelte-14jdzrz">The system computes attendance marks from the shift's <code class="svelte-14jdzrz">graceMinutes</code> field —
    not a hardcoded rule. Every shift can have its own grace window.</p> <p class="svelte-14jdzrz"><span class="highlight svelte-14jdzrz" style="color:var(--green)">06:05 → ON_TIME.</span> The grace window hasn't expired.</p> <p class="svelte-14jdzrz"><span class="highlight svelte-14jdzrz" style="color:var(--amber)">06:25 → LATE.</span> More than 10 minutes past shift start.
    The mark changes and the hours calculation adjusts.</p> <p style="color:var(--muted);font-size:12px;margin-top:auto;" class="svelte-14jdzrz">WEB punches from team members require supervisor confirmation. Device terminal punches
    bypass this — hardware is trusted; browser is not.</p></div>`);
  });
}
function Ch5OtGap($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let puneFillW = "0%";
    let sezFillW = "0%";
    let puneOtW = "0%";
    let sezOtW = "0%";
    let threshVisible = false;
    let otLabelVisible = false;
    $$renderer2.push(`<div class="scene svelte-1gzs3ff"><div class="section-title svelte-1gzs3ff">Overtime Threshold Comparison — Same Hours, Different Rules</div> <div class="ot-scene svelte-1gzs3ff"><div class="ot-plant svelte-1gzs3ff"><h4 class="svelte-1gzs3ff">📍 Coimbatore Plant <span class="badge muted svelte-1gzs3ff">STANDARD</span></h4> <div class="plant-meta svelte-1gzs3ff">Deepak · Operator · Worked 10.5h</div> <div class="hours-labels svelte-1gzs3ff"><span>0h</span><span>3h</span><span>6h</span><span>9h</span><span>12h</span></div> <div class="hours-track svelte-1gzs3ff"><div class="hours-fill svelte-1gzs3ff"${attr_style(`width:${stringify(puneFillW)}`)}></div> <div class="ot-fill svelte-1gzs3ff"${attr_style(`left:75%;width:${stringify(puneOtW)}`)}></div> <div${attr_class("threshold-line svelte-1gzs3ff", void 0, { "visible": threshVisible })} style="left:75%"><div class="threshold-label svelte-1gzs3ff">9h</div></div></div> <div${attr_class("ot-label svelte-1gzs3ff", void 0, { "visible": otLabelVisible })}>▲ 1.5h Overtime (OT)</div> <div class="regime-note svelte-1gzs3ff">Threshold: <strong class="svelte-1gzs3ff">9h</strong> (STANDARD regime)</div></div> <div class="ot-plant svelte-1gzs3ff"><h4 class="svelte-1gzs3ff">📍 Bengaluru HQ <span class="badge gold svelte-1gzs3ff">SEZ</span></h4> <div class="plant-meta svelte-1gzs3ff">Anwar · Operator · Worked 10.5h</div> <div class="hours-labels svelte-1gzs3ff"><span>0h</span><span>3h</span><span>6h</span><span>9h</span><span>12h</span></div> <div class="hours-track svelte-1gzs3ff"><div class="hours-fill svelte-1gzs3ff"${attr_style(`width:${stringify(sezFillW)}`)}></div> <div class="ot-fill svelte-1gzs3ff"${attr_style(`left:83.33%;width:${stringify(sezOtW)}`)}></div> <div${attr_class("threshold-line svelte-1gzs3ff", void 0, { "visible": threshVisible })} style="left:83.33%"><div class="threshold-label svelte-1gzs3ff">10h</div></div></div> <div${attr_class("ot-label svelte-1gzs3ff", void 0, { "visible": otLabelVisible })}>▲ 0.5h Overtime (OT)</div> <div class="regime-note svelte-1gzs3ff">Threshold: <strong class="svelte-1gzs3ff">10h</strong> (SEZ · Factories Act 2017)</div></div></div> <div class="diff-callout svelte-1gzs3ff">⚖ Same 10.5 hours worked  ·  <strong>3× more OT pay</strong> at the standard plant (1.5h vs 0.5h)</div> <div class="scripted-note svelte-1gzs3ff"><span class="scripted-badge svelte-1gzs3ff">SCRIPTED</span> <span>OT seed data not yet added. Animation shows the design spec behavior.</span></div></div> <div class="narration svelte-1gzs3ff"><h3 class="svelte-1gzs3ff">The Overtime Gap</h3> <p class="svelte-1gzs3ff">The SEZ labour regime follows the <span class="highlight svelte-1gzs3ff">Factories Act (Amendment) 2017</span>,
    which raises the daily OT threshold from 9 hours to 10 hours.</p> <p class="svelte-1gzs3ff">Avkash reads <code class="svelte-1gzs3ff">overtimeThresholdHours</code> directly from the location record — <strong>no hardcoded rules</strong>. The same resolver handles all regimes.</p> <p class="svelte-1gzs3ff">Result: Deepak at Coimbatore earns <span class="highlight svelte-1gzs3ff" style="color:var(--amber)">1.5h OT pay</span>.
    Anwar at Bengaluru earns <span class="highlight svelte-1gzs3ff" style="color:var(--amber)">0.5h OT pay</span>. Same clock. Different laws.</p> <p style="color:var(--muted);font-size:12px;margin-top:auto;" class="svelte-1gzs3ff">When a location's regime changes (e.g. new SEZ notification), updating the single <code class="svelte-1gzs3ff">regime</code> field re-calibrates all future attendance computations automatically.</p></div>`);
  });
}
function Ch6Transfer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { transferCount } = $$props;
    let effectiveVisible = false;
    let otBadgeFlipping = false;
    let empLocation = "Coimbatore Plant";
    let otText = "9h OT";
    let otColor = "green";
    $$renderer2.push(`<div class="scene svelte-1jze3ow"><div class="section-title svelte-1jze3ow">Transfer Management</div> <div class="plant-cards svelte-1jze3ow"><div class="plant-card coimbatore svelte-1jze3ow"><div class="plant-name svelte-1jze3ow">🏭 Coimbatore Plant</div> <div class="plant-city svelte-1jze3ow">Coimbatore, Tamil Nadu</div> <div class="plant-ot svelte-1jze3ow">OT Threshold</div> <div class="ot-badge green svelte-1jze3ow">9h (STANDARD)</div></div> <div class="plant-card bengaluru svelte-1jze3ow"><div class="plant-name svelte-1jze3ow">🏢 Bengaluru HQ</div> <div class="plant-city svelte-1jze3ow">Bengaluru, Karnataka</div> <div class="plant-ot svelte-1jze3ow">OT Threshold</div> <div class="ot-badge amber svelte-1jze3ow">10h (SEZ)</div></div></div> <div class="transfer-wrap svelte-1jze3ow"><div class="emp-wrap svelte-1jze3ow"${attr_style(`transform: translateX(${"0"}); transition: transform 0.6s cubic-bezier(0.34,1.56,0.64,1)`)}><div class="emp-avatar svelte-1jze3ow"><div class="avatar-circle svelte-1jze3ow">S</div> <div class="emp-info svelte-1jze3ow"><div class="emp-name svelte-1jze3ow">Sara Khan</div> <div class="emp-role svelte-1jze3ow">Assembly Team · <span class="svelte-1jze3ow">${escape_html(empLocation)}</span></div></div> <div${attr_class("emp-ot-badge svelte-1jze3ow", void 0, {
      "flipping": otBadgeFlipping,
      "green": otColor === "green",
      "amber": otColor === "amber"
    })}>${escape_html(otText)}</div></div> <div${attr_class("effective-note svelte-1jze3ow", void 0, { "visible": effectiveVisible })}>Effective from 2026-06-10 →</div></div> <div class="actions svelte-1jze3ow">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="action-btn svelte-1jze3ow">Transfer to Bengaluru →</button>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="live-note svelte-1jze3ow"><span class="live-badge svelte-1jze3ow">LIVE</span> <span class="svelte-1jze3ow">GET /transfers returns real data (${escape_html(transferCount)} transfers in seed). Transfer animation is scripted — mutation NOT sent to API.</span></div></div> <div class="narration svelte-1jze3ow"><h3 class="svelte-1jze3ow">On the Move</h3> <p class="svelte-1jze3ow"><span class="highlight svelte-1jze3ow">Sara Khan</span> is transferred to the Bengaluru HQ for the new production line ramp-up.</p> <p class="svelte-1jze3ow">From <span class="highlight svelte-1jze3ow">2026-06-10</span>, her attendance is computed against the HQ's <span class="highlight svelte-1jze3ow" style="color:var(--amber)">10h OT threshold</span>. The transfer record carries a <code class="svelte-1jze3ow">fromDate</code> — past punches are not retroactively changed.</p> <p class="svelte-1jze3ow">The system resolves which location applies for a given punch date by walking the transfer history,
    picking the record whose <code class="svelte-1jze3ow">fromDate ≤ punchDate</code>.</p> <p style="color:var(--muted);font-size:12px;margin-top:auto;" class="svelte-1jze3ow">Future-dated transfers are queued and applied by the nightly cron.
    HR can schedule them in advance during notice periods.</p></div>`);
  });
}
function Ch7Probation($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { policies, leaveTypes } = $$props;
    let probBarWidth = "90%";
    let elNumber = 0;
    const elTypeName = "Earned Leave";
    const elType = derived(() => leaveTypes.find((t) => t.name === elTypeName));
    const elPolicy = derived(() => elType() ? policies.find((p) => p.leaveTypeId === elType().leaveTypeId) : null);
    $$renderer2.push(`<div class="scene svelte-h25svk"><div class="section-title svelte-h25svk">Probation Period · Sunita Yadav</div> <div class="sunita-card svelte-h25svk"><div class="emp-header svelte-h25svk"><div class="avatar-s svelte-h25svk">S</div> <div class="svelte-h25svk"><div class="emp-name-lg svelte-h25svk">Sunita Yadav</div> <div class="emp-sub svelte-h25svk">Helper Gr. I · Coimbatore Plant · Joined Nov 2025</div></div> <div class="status-wrap svelte-h25svk">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="badge amber svelte-h25svk">PROBATION</span>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="prob-meta svelte-h25svk">Probation period: Nov 2025 → May 2026 (240 working days)</div> <div class="probation-timeline svelte-h25svk"><div class="probation-bar svelte-h25svk"${attr_style(`width:${stringify(probBarWidth)}`)}></div></div> <div class="prob-dates svelte-h25svk"><span class="svelte-h25svk">Nov 2025 (joined)</span> <span class="svelte-h25svk">${escape_html("May 2026 (probation ends)")}</span></div></div> <div class="el-counter-wrap svelte-h25svk"><div class="svelte-h25svk"><div class="el-label svelte-h25svk">Earned Leave (EL) Balance</div> <div class="el-num-row svelte-h25svk"><div class="el-number svelte-h25svk">${escape_html(elNumber)}</div> <div class="el-denom svelte-h25svk">/ ${escape_html(elPolicy()?.maxLeaves ?? 15)}</div></div></div> <div class="el-lock svelte-h25svk">${escape_html("🔒")}</div> <div class="el-lock-note svelte-h25svk">`);
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`EL locked during probation — accrues after 240 working days (Factories Act)`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="policy-table svelte-h25svk"><div class="pt-header svelte-h25svk"><span class="svelte-h25svk">Leave Type</span> <span class="svelte-h25svk">Max Leaves</span> <span class="svelte-h25svk">Accruals</span> <span class="svelte-h25svk">Probation Cap</span></div> <!--[-->`);
    const each_array = ensure_array_like(policies);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let p = each_array[$$index];
      const lt = leaveTypes.find((t) => t.leaveTypeId === p.leaveTypeId);
      $$renderer2.push(`<div class="pt-row svelte-h25svk"><span class="svelte-h25svk">${escape_html(lt?.name ?? p.leaveTypeId.slice(0, 8))}</span> <span class="svelte-h25svk">${escape_html(p.maxLeaves)}</span> <span${attr_class("svelte-h25svk", void 0, { "yes": p.accruals, "no": !p.accruals })}>${escape_html(p.accruals ? "Yes" : "No")}</span> <span class="prob-cap svelte-h25svk">${escape_html(p.probationMaxLeaves ?? "—")}</span></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="action-btn primary svelte-h25svk">Advance to June 2026 →</button>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="narration svelte-h25svk"><h3 class="svelte-h25svk">On Probation</h3> <p class="svelte-h25svk"><span class="highlight svelte-h25svk">Sunita Yadav</span> joined as a Helper Gr. I in November 2025.
    Factory workers must complete <span class="highlight svelte-h25svk">240 days of work</span> (Factories Act)
    before Earned Leave accrues.</p> <p class="svelte-h25svk">During probation, a <span class="highlight svelte-h25svk" style="color:var(--amber)">policy overlay</span> caps her EL at 0 regardless of what the base leave policy says.
    The overlay is scoped to <code class="svelte-h25svk">employmentStatus = PROBATION</code>.</p> <p class="svelte-h25svk">On <span class="highlight svelte-h25svk">June 1, 2026</span> — after the daily cron runs — she graduates automatically.
    The cron calls <code class="svelte-h25svk">runProbationCompletion()</code>, transitions her status to ACTIVE,
    and immediately posts ${escape_html(elPolicy()?.maxLeaves ?? 15)} days of EL credit.</p> <p class="svelte-h25svk">The leave policy table above is <span class="highlight svelte-h25svk" style="color:var(--green)">live from the API</span> —
    real Meridian seed data.</p> <p style="color:var(--muted);font-size:12px;margin-top:auto;" class="svelte-h25svk">The policy overlay pattern means zero special-casing in the leave resolver —
    it reads overlays, base policy, and location in priority order.</p></div>`);
  });
}
function Ch8Leave($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let currentBalance = 0;
    let calDays = [
      { id: "sep26", name: "MON", num: 26, state: "normal" },
      { id: "sep27", name: "TUE", num: 27, state: "normal" },
      { id: "sep28", name: "WED", num: 28, state: "normal" }
    ];
    $$renderer2.push(`<div class="scene svelte-ri2dp0"><div class="section-title svelte-ri2dp0">Leave Application · Casual Leave · September 2026</div> <div class="leave-cal svelte-ri2dp0"><div class="cal-header svelte-ri2dp0">September 2026 — Q2 Quarter-End Freeze</div> <div class="cal-grid svelte-ri2dp0"><!--[-->`);
    const each_array = ensure_array_like(calDays);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let day = each_array[$$index];
      $$renderer2.push(`<div${attr_class("cal-day svelte-ri2dp0", void 0, {
        "highlight": day.state === "highlight",
        "blocked": day.state === "blocked"
      })}><div class="day-name svelte-ri2dp0">${escape_html(day.name)}</div> <div class="day-num svelte-ri2dp0">${escape_html(day.num)}</div> `);
      if (day.id === "sep28" && day.state === "blocked") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="day-badge red svelte-ri2dp0">BLOCKED</div>`);
      } else if (day.state === "highlight") {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="day-badge blue svelte-ri2dp0">Selected</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="balance-row svelte-ri2dp0"><div class="svelte-ri2dp0"><div class="balance-label svelte-ri2dp0">Sara Khan · CL Balance</div> <div class="balance-num svelte-ri2dp0">${escape_html(currentBalance)}</div></div> <div class="badge blue svelte-ri2dp0">Casual Leave</div></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="actions svelte-ri2dp0">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="action-btn primary svelte-ri2dp0">Apply CL for Sep 28 →</button>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="live-note svelte-ri2dp0"><span class="live-badge svelte-ri2dp0">LIVE</span> <span class="svelte-ri2dp0">Real API call as Sara Khan. Sep 28 is inside the Q2 Quarter-End Freeze blackout window.</span></div></div> <div class="narration svelte-ri2dp0"><h3 class="svelte-ri2dp0">Leave Day — and the Blackout</h3> <p class="svelte-ri2dp0"><span class="highlight svelte-ri2dp0">Sara Khan</span> (Assembly team) applies for Casual Leave on Sep 28, 2026.</p> <p class="svelte-ri2dp0">The Q2 FY2027 <span class="highlight svelte-ri2dp0" style="color:var(--red)">Quarter-End Freeze</span> covers Sep 25–30.
    The leave evaluator runs the blackout check <strong class="svelte-ri2dp0">before</strong> any ledger write —
    blocking is clean, not a cancellation.</p> <p class="svelte-ri2dp0">The <code class="svelte-ri2dp0">LEAVE_BLACKOUT_PERIOD</code> response is a <span class="highlight svelte-ri2dp0" style="color:var(--green)">real API call</span> — the console shows live HTTP status + response time.</p> <p class="svelte-ri2dp0">Blackout policies can be scoped to a location, leave type, or org-wide. Here it's scoped to
    the Assembly team's location for audit-week protection.</p> <p style="color:var(--muted);font-size:12px;margin-top:auto;" class="svelte-ri2dp0">The policy evaluator runs before the ledger write — blocking is clean, not a cancellation.
    No leave row is created for blocked applications.</p></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Ch9HalfDay($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let midlineVisible = false;
    let firstHalfVisible = false;
    let secondHalfVisible = false;
    let firstHalfApplied = false;
    let secondHalfApplied = false;
    let applyingFirst = false;
    $$renderer2.push(`<div class="scene svelte-riaf6j"><div class="section-title svelte-riaf6j">Half-Day Leave · Sara Khan · A Shift · 2026-09-01</div> <div class="shift-meta svelte-riaf6j">A Shift: 06:00 → 14:00  ·  Midpoint: 10:00</div> <div class="half-day-wrap svelte-riaf6j"><div class="midpoint-label svelte-riaf6j">10:00 (midpoint)</div> <div${attr_class("midpoint-line svelte-riaf6j", void 0, { "visible": midlineVisible })}></div> <div class="half-day-bar svelte-riaf6j"><div${attr_class("half-first svelte-riaf6j", void 0, { "visible": firstHalfVisible, "applied": firstHalfApplied })}>FIRST_HALF<br class="svelte-riaf6j"/><span class="half-sub svelte-riaf6j">06:00–10:00</span></div> <div${attr_class("half-second svelte-riaf6j", void 0, { "visible": secondHalfVisible, "applied": secondHalfApplied })}>SECOND_HALF<br class="svelte-riaf6j"/><span class="half-sub svelte-riaf6j">10:00–14:00</span></div></div> <div class="shift-times svelte-riaf6j"><span class="svelte-riaf6j">06:00</span><span class="svelte-riaf6j">14:00</span></div></div> <div class="actions svelte-riaf6j">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="action-btn primary svelte-riaf6j"${attr("disabled", applyingFirst, true)}>${escape_html("Apply FIRST_HALF →")}</button>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
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
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="live-note svelte-riaf6j"><span class="live-badge svelte-riaf6j">LIVE</span> <span class="svelte-riaf6j">Real API calls as Sara Khan. Test leaves on 2026-09-01 are cancelled on reset.</span></div></div> <div class="narration svelte-riaf6j"><h3 class="svelte-riaf6j">Half a Day</h3> <p class="svelte-riaf6j"><span class="highlight svelte-riaf6j">Sara Khan</span> needs the afternoon off — she'll work the morning.
    Avkash models this as <code class="svelte-riaf6j">FIRST_HALF</code> + <code class="svelte-riaf6j">SECOND_HALF</code>.</p> <p class="svelte-riaf6j">The midpoint is computed from the shift's actual <code class="svelte-riaf6j">start</code> and <code class="svelte-riaf6j">end</code> —
    not clock-based MORNING/AFTERNOON labels. A night shift worker's "morning" is at 02:00.</p> <p class="svelte-riaf6j">Attempting to apply <span class="highlight svelte-riaf6j" style="color:var(--red)">FIRST_HALF a second time</span> triggers a real <code class="svelte-riaf6j">ConflictError: LEAVE_OVERLAP</code>. The guard runs before any ledger write —
    the balance is protected.</p> <p class="svelte-riaf6j">Both half-day calls hit the live API. The LEAVE_OVERLAP response is from the real server.</p> <p style="color:var(--muted);font-size:12px;margin-top:auto;" class="svelte-riaf6j">This model also enables "split" leave days: EL for the morning, Comp-Off for the afternoon —
    each half tracked independently.</p></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const TOTAL_CHAPTERS = 9;
    let currentChapter = 0;
    let direction = "forward";
    let transitioning = false;
    let consoleEntry = null;
    const pills = [
      { n: 0, label: "0 · Intro" },
      { n: 1, label: "1 · Company" },
      { n: 2, label: "2 · Ladder" },
      { n: 3, label: "3 · Shifts" },
      { n: 4, label: "4 · Punch" },
      { n: 5, label: "5 · OT Gap" },
      { n: 6, label: "6 · Transfer" },
      { n: 7, label: "7 · Probation" },
      { n: 8, label: "8 · Leave" },
      { n: 9, label: "9 · Half Day" }
    ];
    function goTo(n) {
      if (n < 0 || n > TOTAL_CHAPTERS || n === currentChapter || transitioning) return;
      direction = n > currentChapter ? "forward" : "backward";
      transitioning = true;
      setTimeout(
        () => {
          currentChapter = n;
          consoleEntry = null;
          transitioning = false;
        },
        50
      );
    }
    function handleKeydown(e) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(currentChapter + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(currentChapter - 1);
      }
    }
    onDestroy(() => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", handleKeydown);
      }
    });
    head("1du1zi4", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Demo — Avkash</title>`);
      });
    });
    $$renderer2.push(`<div class="demo-shell svelte-1du1zi4"><nav class="demo-nav svelte-1du1zi4"><div class="nav-logo svelte-1du1zi4">avk<span class="svelte-1du1zi4">|</span>ash</div> <div class="ch-pills svelte-1du1zi4" role="navigation" aria-label="Demo chapters"><!--[-->`);
    const each_array = ensure_array_like(pills);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let pill = each_array[$$index];
      $$renderer2.push(`<button${attr_class("ch-pill svelte-1du1zi4", void 0, { "active": currentChapter === pill.n })}${attr("aria-current", currentChapter === pill.n ? "step" : void 0)}>${escape_html(pill.label)}</button>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="demo-api-status svelte-1du1zi4"><div class="api-dot" id="demo-api-dot"></div> <span class="api-label" id="demo-api-label">API</span></div></nav> <div class="stage svelte-1du1zi4"><!---->`);
    {
      $$renderer2.push(`<div${attr_class("chapter-wrap svelte-1du1zi4", void 0, {
        "entering-forward": direction === "forward",
        "entering-backward": direction === "backward"
      })}>`);
      if (currentChapter === 0) {
        $$renderer2.push("<!--[0-->");
        Ch0Intro($$renderer2);
      } else if (currentChapter === 1) {
        $$renderer2.push("<!--[1-->");
        Ch1Company($$renderer2, { orgData: data.orgData });
      } else if (currentChapter === 2) {
        $$renderer2.push("<!--[2-->");
        Ch2Ladder($$renderer2);
      } else if (currentChapter === 3) {
        $$renderer2.push("<!--[3-->");
        Ch3Shifts($$renderer2);
      } else if (currentChapter === 4) {
        $$renderer2.push("<!--[4-->");
        Ch4Punch($$renderer2);
      } else if (currentChapter === 5) {
        $$renderer2.push("<!--[5-->");
        Ch5OtGap($$renderer2);
      } else if (currentChapter === 6) {
        $$renderer2.push("<!--[6-->");
        Ch6Transfer($$renderer2, { transferCount: data.transferCount });
      } else if (currentChapter === 7) {
        $$renderer2.push("<!--[7-->");
        Ch7Probation($$renderer2, {
          policies: data.leavePolicies,
          leaveTypes: data.leaveTypes
        });
      } else if (currentChapter === 8) {
        $$renderer2.push("<!--[8-->");
        Ch8Leave($$renderer2, { saraBalance: data.saraClBalance });
      } else if (currentChapter === 9) {
        $$renderer2.push("<!--[9-->");
        Ch9HalfDay($$renderer2);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!----></div> <div class="nav-btns svelte-1du1zi4"><button class="nav-btn svelte-1du1zi4"${attr("disabled", currentChapter === 0, true)} aria-label="Previous chapter">←</button> <button class="nav-btn svelte-1du1zi4"${attr("disabled", currentChapter === TOTAL_CHAPTERS, true)} aria-label="Next chapter">→</button></div> `);
    DemoConsole($$renderer2, { entry: consoleEntry });
    $$renderer2.push(`<!----></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CSsOoUVR.js.map

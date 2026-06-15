import { n as escape_html, l as attr_class, o as stringify, aw as attr_style, m as attr, k as ensure_array_like, y as derived } from './index-DX9vaW0y.js';
import './root-D7heMfFX.js';
import './state.svelte-DsCXTBTP.js';
import { E as ErrorBanner } from './ErrorBanner-wLi6mrbE.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    const subject = derived(() => data.subject);
    const emp = derived(() => data.employeeProfile);
    const teams = derived(() => data.teams);
    const locations = derived(() => data.locations);
    const GROUPS = [
      {
        key: "basic",
        label: "Basic Info",
        icon: "👤",
        fields: ["employeeCode", "designation"],
        labels: { employeeCode: "Employee Code", designation: "Designation" }
      },
      {
        key: "contact",
        label: "Contact",
        icon: "📞",
        fields: [
          "personalEmail",
          "personalPhone",
          "phoneNumber",
          "address",
          "emergencyContact"
        ],
        labels: {
          personalEmail: "Personal Email",
          personalPhone: "Personal Phone",
          phoneNumber: "Work Phone",
          address: "Address",
          emergencyContact: "Emergency Contact"
        }
      },
      {
        key: "employment",
        label: "Employment",
        icon: "💼",
        fields: [
          "employmentType",
          "employmentStatus",
          "levelId",
          "workLocation",
          "reportingManagerId",
          "probationEndsOn",
          "confirmedOn",
          "exitDate",
          "exitReason"
        ],
        labels: {
          employmentType: "Employment Type",
          employmentStatus: "Status",
          levelId: "Level",
          workLocation: "Work Location",
          reportingManagerId: "Reporting Manager",
          probationEndsOn: "Probation Ends",
          confirmedOn: "Confirmed On",
          exitDate: "Exit Date",
          exitReason: "Exit Reason"
        }
      },
      {
        key: "compensation",
        label: "Compensation",
        icon: "💰",
        fields: ["salary", "bankAccount", "bankIfsc", "bankName"],
        labels: {
          salary: "Salary",
          bankAccount: "Bank Account",
          bankIfsc: "IFSC Code",
          bankName: "Bank Name"
        }
      },
      {
        key: "identity",
        label: "Identity / DPDP",
        icon: "🪪",
        fields: [
          "pan",
          "aadhaar",
          "passport",
          "dateOfBirth",
          "gender",
          "maritalStatus",
          "nationality"
        ],
        labels: {
          pan: "PAN",
          aadhaar: "Aadhaar",
          passport: "Passport",
          dateOfBirth: "Date of Birth",
          gender: "Gender",
          maritalStatus: "Marital Status",
          nationality: "Nationality"
        }
      },
      {
        key: "medical",
        label: "Medical",
        icon: "🏥",
        fields: ["disability", "conditions", "bloodGroup"],
        labels: {
          disability: "Disability",
          conditions: "Conditions",
          bloodGroup: "Blood Group"
        }
      }
    ];
    const groupAccess = derived(() => data.groupAccess);
    function isGroupLocked(groupKey, groupFields) {
      const hasFieldsInResponse = groupFields.some((f) => f in emp());
      if (hasFieldsInResponse) return false;
      const access = groupAccess()[groupKey] ?? "none";
      return access === "none";
    }
    function formatVal(val) {
      if (val === null || val === void 0 || val === "") return "—";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    }
    function getTeamName(teamId) {
      if (!teamId) return "—";
      return teams().find((t) => t.teamId === teamId)?.name ?? teamId.slice(0, 8) + "…";
    }
    function getLocationName(locationId) {
      if (!locationId) return "—";
      return locations().find((l) => l.id === locationId)?.name ?? locationId.slice(0, 8) + "…";
    }
    const statusColors = {
      ACTIVE: "var(--green)",
      PROBATION: "var(--amber)",
      NOTICE_PERIOD: "var(--amber)",
      RESIGNED: "var(--red)",
      TERMINATED: "var(--red)",
      ON_LONG_LEAVE: "var(--blue)"
    };
    function statusColor(s) {
      if (!s) return "var(--muted)";
      return statusColors[s] ?? "var(--muted)";
    }
    $$renderer2.push(`<div class="profile-page svelte-1twwlea"><div class="breadcrumb svelte-1twwlea"><a href="/employees" class="breadcrumb-link svelte-1twwlea">← Employee Directory</a> <span class="breadcrumb-sep svelte-1twwlea">/</span> <span class="breadcrumb-current svelte-1twwlea">${escape_html(subject().name)}</span></div> <div class="profile-header svelte-1twwlea"><div class="profile-avatar svelte-1twwlea">${escape_html(subject().name.slice(0, 2).toUpperCase())}</div> <div class="profile-meta svelte-1twwlea"><h1 class="profile-name svelte-1twwlea">${escape_html(subject().name)}</h1> <div class="profile-sub svelte-1twwlea"><span class="profile-email svelte-1twwlea">${escape_html(subject().email)}</span> <span${attr_class(`profile-role role-${stringify(subject().role.toLowerCase())}`, "svelte-1twwlea")}>${escape_html(subject().role)}</span> `);
    if (emp().employmentStatus) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="status-chip svelte-1twwlea"${attr_style(`color: ${stringify(statusColor(emp().employmentStatus))}`)}>${escape_html(emp().employmentStatus)}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="profile-org svelte-1twwlea">`);
    if (subject().teamId) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="org-chip svelte-1twwlea">Team: ${escape_html(getTeamName(subject().teamId))}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (subject().locationId) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="org-chip svelte-1twwlea">Location: ${escape_html(getLocationName(subject().locationId))}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (subject().joinedOn) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="org-chip svelte-1twwlea">Joined: ${escape_html(subject().joinedOn)}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div> `);
    if (data.canEdit) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="profile-actions svelte-1twwlea">`);
      {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<button class="btn-primary svelte-1twwlea">Edit Profile</button>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (data.isSelf) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="self-badge svelte-1twwlea">Your profile</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (form?.updateSuccess) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="success-banner svelte-1twwlea">Profile updated successfully.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.updateError) {
      $$renderer2.push("<!--[0-->");
      ErrorBanner($$renderer2, { error: form.updateError });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <form method="post" action="?/updateProfile"><input type="hidden" name="_etag"${attr("value", data.etag ?? "")}/> <div class="sections svelte-1twwlea"><!--[-->`);
    const each_array = ensure_array_like(GROUPS);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let group = each_array[$$index_1];
      const locked = isGroupLocked(group.key, group.fields);
      $$renderer2.push(`<div${attr_class("section svelte-1twwlea", void 0, { "section--locked": locked })}><div class="section-header svelte-1twwlea"><span class="section-icon svelte-1twwlea">${escape_html(group.icon)}</span> <span class="section-label svelte-1twwlea">${escape_html(group.label)}</span> `);
      if (locked) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="locked-badge svelte-1twwlea">🔒 Not visible to your role — field-group: ${escape_html(group.key)}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (locked) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="locked-body svelte-1twwlea"><p class="locked-desc svelte-1twwlea">The <strong class="svelte-1twwlea">${escape_html(group.label)}</strong> group is not accessible to your role. `);
        if (group.key === "compensation") {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`Compensation data (salary, bank details) requires <code class="svelte-1twwlea">hr_admin</code> or <code class="svelte-1twwlea">subject</code> relation.`);
        } else if (group.key === "identity") {
          $$renderer2.push("<!--[1-->");
          $$renderer2.push(`Identity / DPDP data (PAN, Aadhaar, passport) requires <code class="svelte-1twwlea">hr_admin</code> relation. Reads are audited.`);
        } else if (group.key === "medical") {
          $$renderer2.push("<!--[2-->");
          $$renderer2.push(`Medical data requires <code class="svelte-1twwlea">hr_admin</code> relation. Reads are audited.`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`This field group is restricted by the current field-policy configuration.`);
        }
        $$renderer2.push(`<!--]--></p> <p class="locked-hint svelte-1twwlea">An ADMIN can change field-group access in <a href="/admin/field-policies" class="locked-link svelte-1twwlea">Admin → Field Policies</a>.</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="fields-grid svelte-1twwlea"><!--[-->`);
        const each_array_1 = ensure_array_like(group.fields);
        for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
          let field = each_array_1[$$index];
          if (field in emp()) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="field-row svelte-1twwlea"><span class="field-label svelte-1twwlea">${escape_html(group.labels[field] ?? field)}</span> `);
            {
              $$renderer2.push("<!--[-1-->");
              $$renderer2.push(`<span class="field-value svelte-1twwlea">${escape_html(formatVal(emp()[field]))}</span>`);
            }
            $$renderer2.push(`<!--]--></div>`);
          } else if (group.key === "basic") {
            $$renderer2.push("<!--[1-->");
            $$renderer2.push(`<div class="field-row svelte-1twwlea"><span class="field-label svelte-1twwlea">${escape_html(group.labels[field] ?? field)}</span> `);
            {
              $$renderer2.push("<!--[-1-->");
              $$renderer2.push(`<span class="field-value field-value--empty svelte-1twwlea">—</span>`);
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></form> `);
    if (data.user.role !== "ADMIN" && data.user.role !== "OWNER" && !data.isSelf) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="demo-note svelte-1twwlea"><span class="demo-note-icon svelte-1twwlea">ℹ️</span> <div class="demo-note-text svelte-1twwlea"><strong class="svelte-1twwlea">Field-group visibility:</strong> Your role (${escape_html(data.user.role)}) determines which sections are visible.
        Locked sections have their fields <em class="svelte-1twwlea">absent</em> (not null) in the API response — the web client infers the locked state from the missing keys.
        This is the Plan 51 DPDP field-group enforcement in action.</div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Ceu0PxXo.js.map

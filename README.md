# Avkash

Open-core HR infrastructure for teams that need control over:

- Leave
- Attendance
- People data
- Organisation structure
- HR policies
- Field-level access

Avkash is built for companies where HR rules are not simple. Shifts, alternate Saturdays, location rules, probation, approvals, transfers, and access control all matter.

The public repo is the self-hostable core. Avkash Cloud is the commercial product with hosted UI, payroll, compliance, performance, and other private modules.

---

## Why Avkash

Most HR software is closed SaaS.

That can be a problem when:

- Employee data needs to stay under your control
- Company policies do not fit a generic workflow
- Attendance depends on shifts, devices, sites, or supervisors
- Leave rules vary by level, location, probation, or business unit
- You need to build custom HR workflows on top of a real backend

Avkash gives you a programmable HR core instead of a black box.

---

## What Is Open

The open core includes:

- **People** - employees, profiles, teams, roles, departments, business units, org levels
- **Leave** - requests, approvals, balances, accruals, comp-off, encashments, delegations, blackout periods
- **Attendance** - punches, shifts, workweeks, alternate Saturdays, supervisor flows, regularisation, overtime
- **Policies** - leave policies, applicability rules, level restrictions, holidays, location-aware rules
- **Access control** - OpenFGA-based relationship and field-level permissions
- **Notifications** - email and SMS dispatch with local fallbacks
- **Slack** - login and optional leave notifications
- **Multi-tenancy** - every request is scoped by `orgId`

The open core is meant to be useful by itself. It is not a demo repo.

---

## Open Core Vs Cloud

| Area | Open core | Avkash Cloud / private modules |
|---|---|---|
| Hosting | Self-hosted API and worker | Managed SaaS |
| UI | Not included | Hosted UI |
| People, leave, attendance, policy | Included | Included |
| OpenFGA authorization | Included | Included |
| Payroll | Not included | Commercial module |
| Statutory compliance | Not included | Commercial module |
| Performance, recruitment, analytics | Not included | Commercial modules |
| License | AGPL-3.0 | Commercial |

Commercial license exceptions are available for organisations that cannot use AGPL.

---

## Who It Is For

Use Avkash if you are:

- A company that wants self-hosted control over HR data
- An HR-tech builder who needs a backend foundation
- A team operating with India-style attendance, leave, shift, and compliance complexity
- A developer extending HR workflows with custom rules and approvals
- Evaluating an open-core alternative to closed HR SaaS

Use Avkash Cloud if you want:

- Hosted UI
- Managed deployment
- Payroll
- Compliance
- Performance and other commercial modules

---

## Documentation

- [Technical README](docs/technical-readme.md) - self-hosting, environment variables, development commands, API entry points
- [Architecture README](docs/architecture-readme.md) - stack, package layout, open-core boundary, current status
- [Enterprise authorization demo](docs/demo-enterprise-authz.md) - OpenFGA and field-access walkthrough

---

## License

- Open core: AGPL-3.0. See [LICENSE](LICENSE).
- Copyright: Zero8 Dot Dev Pvt Ltd.
- Contributions may require signing the [Contributor License Agreement](CLA.md).
- Commercial license exceptions are available through Zero8 Dot Dev Pvt Ltd.

---

## Contributing

- Open an issue before a non-trivial pull request.
- Keep changes scoped and aligned with the open-core boundary.
- By contributing, you agree that your contribution is licensed under the project license.
- A signed [CLA](CLA.md) may be required before merge.


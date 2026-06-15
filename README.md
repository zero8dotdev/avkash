# Avkash

Open-core HR infrastructure for companies that need control over leave, attendance, people data, and policy logic.

Most HR systems are delivered as closed SaaS products. That works until your policies become local, your compliance rules become specific, or your employee data cannot sit inside a black box. Avkash is built as a self-hostable HR core: the public repository gives you the foundation, and commercial modules add the parts larger companies usually buy later.

The open core is licensed under AGPL-3.0. Avkash Cloud is the commercial superset, with hosted deployment, UI, payroll, compliance, performance, and other private modules.

---

## Why Avkash Exists

HR software looks simple from the outside: employees apply for leave, managers approve it, attendance gets marked, and payroll consumes the result. In practice, every company has exceptions.

Factories have shifts, grace windows, alternate Saturdays, device punches, overtime rules, and location-based policies. Growing companies need org levels, transfers, delegations, probation rules, and field-level access control. Indian and emerging-market teams often need software that can adapt to local operating reality instead of forcing everything into one global SaaS workflow.

Avkash treats HR as infrastructure. The public core gives teams a programmable, inspectable backend for the everyday HR primitives. The commercial layer adds the heavier workflows around payroll, statutory compliance, performance, and managed hosting.

---

## What You Get In The Open Core

- **People and organisation** - employees, teams, departments, business units, org levels, locations, roles, and transfers
- **Leave management** - requests, approvals, accruals, balances, comp-off, encashments, delegations, blackout periods, and policy restrictions
- **Attendance** - device-based punches, shifts, workweek patterns, alternate Saturdays, supervisor flows, regularisation, overtime, and gap detection
- **Policy engine** - leave policies, applicability rules, level restrictions, holiday calendars, and location-aware behaviour
- **Field access control** - per-field visibility and write gates through OpenFGA, so sensitive employee data is not exposed casually
- **Notifications** - email and SMS dispatch with local-development fallbacks
- **Slack integration** - Slack login and optional leave notifications
- **Multi-tenancy** - every query is scoped by `orgId`; cross-tenant data access is blocked by construction

The public core is intended to be useful on its own. It is not a thin SDK or a teaser repo.

---

## Open Core Vs Cloud

| Area | Public core (`avkash`) | Avkash Cloud / private modules |
|---|---|---|
| Hosting | Self-hosted API and worker | Managed SaaS |
| UI | Not bundled in this repo | Hosted product UI |
| HR foundation | People, org, leave, attendance, holidays, policies | Included |
| Authorisation | OpenFGA relationship and field-level access | Included, plus provider operations |
| Payroll | Not included | Commercial module |
| Statutory compliance | Not included | Commercial module |
| Performance / recruitment / analytics | Not included | Commercial modules |
| License | AGPL-3.0 | Commercial |

Commercial license exceptions are available for organisations that want to use the core but cannot adopt AGPL terms.

---

## Who This Is For

Avkash is a good fit if you are:

- Running an organisation that needs self-hosted control over HR data
- Building an HR product and want a real backend foundation instead of starting from tables and CRUD
- Operating in India or a similar market where policies, attendance rules, shifts, and compliance needs vary heavily by company
- Extending HR workflows with custom rules, integrations, or approval paths
- Evaluating an open-core alternative to closed HR SaaS

It is not the right repo if you want a turnkey hosted product with UI today. For that, use Avkash Cloud.

---

## Documentation

- [Technical README](docs/technical-readme.md) - self-hosting, environment variables, development commands, and API entry points
- [Architecture README](docs/architecture-readme.md) - stack, monorepo layout, package boundaries, and current project status
- [Enterprise authorization demo](docs/demo-enterprise-authz.md) - OpenFGA and field-access walkthrough

---

## License

Avkash core is licensed under the GNU Affero General Public License v3.0. See [LICENSE](LICENSE).

Contributions may require signing the [Contributor License Agreement](CLA.md). The CLA lets Zero8 Dot Dev Pvt Ltd offer commercial license exceptions while keeping the public core open.

---

## Contributing

Contributions are welcome. Open an issue before sending a non-trivial pull request so the design can be discussed first.

By contributing, you agree that your contribution is licensed under the project license and that a signed [CLA](CLA.md) may be required before merge.

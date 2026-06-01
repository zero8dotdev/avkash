# Avkash — HRMS Platform Plan

> Full product, technical, and go-to-market plan for building a production-grade HRMS
> targeting Indian small and mid-size companies in tier 2+ cities.

## Document Index

| # | File | Description |
|---|------|-------------|
| 01 | [Market Strategy](./01-market-strategy.md) | Target market, ICP, competition, positioning |
| 02 | [Product Roadmap](./02-product-roadmap.md) | Phased feature rollout with priorities |
| 03 | [Technical Architecture](./03-technical-architecture.md) | Stack decisions, system design, rationale |
| 04 | [Database Design](./04-database-design.md) | Full schema for all modules |
| 05 | [Features](./05-features/) | Per-module detailed specs |
| — | [Core HR](./05-features/01-core-hr.md) | People, org, roles, lifecycle |
| — | [Leave & Attendance](./05-features/02-leave-attendance.md) | Leave, shifts, attendance |
| — | [Payroll & Compliance](./05-features/03-payroll-compliance.md) | Salary, tax, statutory India |
| — | [Performance](./05-features/04-performance.md) | Goals, reviews, feedback |
| — | [Onboarding & Offboarding](./05-features/05-onboarding-offboarding.md) | Lifecycle workflows |
| — | [Documents](./05-features/06-documents.md) | Storage, e-sign, templates |
| — | [Recruitment (ATS)](./05-features/07-recruitment.md) | Hiring pipeline |
| — | [Integrations](./05-features/08-integrations.md) | Slack, WhatsApp, Tally, etc. |
| — | [Analytics & Reporting](./05-features/09-analytics-reporting.md) | Dashboards, reports |
| 06 | [Deployment Strategy](./06-deployment.md) | Docker, K8s, cloud, self-hosted |
| 07 | [Pricing & Monetization](./07-pricing-monetization.md) | Tiers, Indian market pricing |
| 08 | [Go-to-Market](./08-go-to-market.md) | Reach, channels, sales motion |
| 09 | [Migration from Supabase](./09-migration-supabase.md) | Step-by-step technical migration |
| 10 | [Timeline & Milestones](./10-timeline-milestones.md) | Realistic execution timeline |

## The One-Line Mission

> Replace the HR manager's WhatsApp group, Excel sheet, and paper forms — for every
> small company in tier 2 India that can't afford Darwinbox but deserves better than chaos.

## Current State

- **Codebase:** Next.js 15, React 19, Supabase (auth + DB), Ant Design, Tailwind
- **Working:** Org/team setup, leave management, holiday calendar, basic Slack integration, billing
- **Immediate priority:** Migrate off Supabase → Bun + PostgreSQL + Better Auth (see [09](./09-migration-supabase.md))
- **Then:** Build toward Phase 1 launch (see [02](./02-product-roadmap.md))

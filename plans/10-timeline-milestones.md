# 10 — Timeline & Milestones

Realistic timeline for a 1–2 developer team (founder + 1 dev, or 2 founders).

---

## Overview

```
Month 0–2   → Phase 0: Foundation (Supabase migration + infra)
Month 2–5   → Phase 1: Core product (Attendance + Payroll + WhatsApp)
Month 5–6   → Soft Launch: First 10 paying customers
Month 6–10  → Phase 2: Grow & retain (Performance + Onboarding + Docs)
Month 10    → Growth Launch: CA reseller program, 100 customers target
Month 10+   → Phase 3: Enterprise features, scale
```

---

## Month 0–2: Foundation

**Goal:** Clean architecture, no Supabase dependency, local dev works cleanly.

### Week 1–2
- [ ] Set up monorepo (Turborepo): `apps/web`, `apps/api`, `packages/db`
- [ ] Bun + Hono API: scaffold, health check, basic auth middleware
- [ ] Better Auth: installed, Google OAuth working, magic links working
- [ ] Drizzle: schema for existing tables, migration scripts working
- [ ] New PostgreSQL running (Neon + local Docker)

### Week 3–4
- [ ] Migrate all existing Supabase read queries → Drizzle
- [ ] Middleware updated to Better Auth session
- [ ] AppContext updated
- [ ] Existing leave + org + team features working end-to-end

### Week 5–6
- [ ] Migrate all write queries (inserts, updates, deletes)
- [ ] Remove `@supabase/supabase-js` and `@supabase/ssr` completely
- [ ] Hindi i18n setup (next-intl): English + Hindi JSON files scaffolded
- [ ] Docker Compose working (all services)
- [ ] Slack OAuth re-wired through Better Auth

### Week 7–8
- [ ] QA: full manual test of all existing features
- [ ] Fix all broken flows
- [ ] Deploy to staging (Fly.io + Neon + Vercel)
- [ ] **Milestone: App works exactly as before, no Supabase**

---

## Month 2–5: Phase 1 (Core Product)

### Month 2–3: People & Leave (extend existing)
- [ ] Department + Designation tables + UI
- [ ] Employee profile extended (employment type, status, direct manager, PAN/Aadhaar fields)
- [ ] Employee directory with search + filter
- [ ] Bulk employee CSV import
- [ ] Carry-forward with expiry
- [ ] Compensatory off
- [ ] WFH tracking
- [ ] Manager delegation for approvals
- [ ] Leave calendar improvements
- [ ] Leave reports (balance summary, utilization)
- [ ] **Hindi UI: translate all leave + employee labels**

### Month 3–4: Attendance
- [ ] Shift definition + assignment UI
- [ ] AttendanceRecord table + API
- [ ] Daily attendance marking (manual by manager)
- [ ] Monthly attendance grid view
- [ ] Late/overtime tracking
- [ ] Regularization workflow
- [ ] Biometric: ZKTeco CSV import
- [ ] Biometric: ZKTeco webhook (push SDK)
- [ ] EOD cron: auto-mark absent

### Month 3–4: WhatsApp Bot
- [ ] MSG91 WhatsApp Business API setup
- [ ] Webhook receiver + state machine
- [ ] Employee: check balance, apply leave, check-in/out
- [ ] Manager: receive approval requests, approve/reject
- [ ] Daily team summary for managers
- [ ] Redis session state for conversations

### Month 4–5: Payroll
- [ ] Salary structure builder
- [ ] Employee salary assignment
- [ ] Payroll run flow (draft → finalize)
- [ ] PF / ESI / PT calculation engine
- [ ] Payslip PDF generation (Puppeteer or react-pdf)
- [ ] Payslip delivery (WhatsApp + email)
- [ ] Tally export (XML journal entries)
- [ ] Bank transfer file (HDFC format + generic CSV)
- [ ] PF ECR file generation
- [ ] Reimbursements workflow

### Month 5: Documents (MVP)
- [ ] Document vault per employee
- [ ] Upload + categorize + access control
- [ ] Document expiry alerts
- [ ] Offer letter / appointment letter template builder
- [ ] Generate letter for employee → PDF → send via WhatsApp

### Month 5: Polish & Launch Prep
- [ ] Hindi translations complete for Phase 1 modules
- [ ] Mobile-responsive audit (all pages work on 375px phone)
- [ ] Performance: all API calls < 200ms
- [ ] Error handling + user-friendly error messages (in Hindi)
- [ ] Onboarding wizard for new companies (simplified version)

**Milestone: Ship to first 10 beta customers. Do white-glove onboarding.**

---

## Month 5–6: Soft Launch

- Onboard 10 companies personally (free, in exchange for feedback)
- Target: 2 manufacturing, 2 retail, 2 healthcare, 2 construction, 2 education
- Weekly check-in call with each
- Prioritize bugs and UX issues from feedback
- Build first 3 case study testimonials
- Start CA outreach: first 10 CAs in Indore + Surat

**Revenue target: ₹1 Lakh MRR by end of Month 6** (from 30–40 paying companies)

---

## Month 6–10: Phase 2 (Grow & Retain)

### Month 6–7: Onboarding & Offboarding
- [ ] Onboarding template builder
- [ ] Pre-boarding portal (new hire form link)
- [ ] Onboarding checklist instance + tracking
- [ ] IT asset management
- [ ] Offboarding workflow + FnF settlement
- [ ] Exit interview form

### Month 7–8: Performance Reviews
- [ ] Review cycle setup
- [ ] Goal setting + tracking
- [ ] Self-review + manager review form
- [ ] Probation review trigger + workflow
- [ ] PIP tracking

### Month 8–9: Recruitment (ATS)
- [ ] Job posting + career page
- [ ] Application form (public link)
- [ ] Kanban pipeline
- [ ] Interview scheduling + feedback
- [ ] Offer → employee conversion

### Month 9–10: Reporting & Analytics
- [ ] Owner dashboard (today's snapshot + monthly KPIs)
- [ ] All statutory reports (PF register, ESI register, Form 16, salary register)
- [ ] Attendance reports (monthly sheet, absenteeism, overtime)
- [ ] Leave reports
- [ ] Payroll reports
- [ ] Excel/PDF exports

### Month 9–10: CA Reseller Portal
- [ ] CA partner signup + verification
- [ ] Multi-org dashboard for CA (see all client orgs)
- [ ] Commission tracking + monthly payout
- [ ] CA-specific onboarding (white-label setup)

**Revenue target: ₹5 Lakh MRR by end of Month 10** (from 150–200 paying companies)

---

## Month 10+: Phase 3 (Enterprise & Scale)

### Month 10–12
- [ ] SSO (Google Workspace, Microsoft)
- [ ] Multi-location payroll (different PT slabs)
- [ ] Kubernetes Helm chart
- [ ] Enterprise security features
- [ ] Public API + webhooks
- [ ] Form 16 with digital signature
- [ ] Mobile app (React Native — Android first)

### Month 12+
- [ ] Microsoft Teams integration
- [ ] Benefits administration
- [ ] Advanced compliance registers
- [ ] Labour law audit reports
- [ ] White-label for enterprise customers
- [ ] Expand to 10+ cities with field sales team

---

## Resource Requirements

### Now (Month 0–5)
- **Founder/Lead Dev** (you): architecture, backend, product decisions
- **1 Frontend Dev**: Next.js UI implementation
- **Freelance designer**: Figma designs for new modules
- **Cost**: ~₹1.5–2L/month (1 mid-level dev + design)

### Month 5–10
- **Add 1 Backend Dev**: payroll engine, compliance, WhatsApp bot
- **Add 1 Sales/BD person**: CA outreach, city launches
- **Cost**: ~₹4–5L/month

### Month 10+
- **Add Customer Success**: onboarding + retention
- **Add 2–3 Dev**: mobile, enterprise features
- **Add SDRs** (sales development reps): city-by-city
- **Cost**: ~₹12–15L/month

---

## Critical Path (cannot be delayed without delaying launch)

```
Supabase migration
  → Drizzle ORM working
    → Payroll calculation engine
      → Payslip PDF generation
        → WhatsApp payslip delivery
          → First payroll run for beta customer ← LAUNCH GATE
```

Everything else can be parallelized or deferred.

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| WhatsApp API approval takes too long | Medium | High | Use Interakt/Wati as BSP (faster approval) |
| Biometric device integration complexity | Medium | Medium | Start with CSV import only; push API is phase 2 |
| Payroll calculation bugs | High | High | Extensive unit tests; beta with real company data |
| CA reseller adoption slow | Medium | High | Reduce barrier: free for CA's own firm |
| Supabase migration breaks existing features | Medium | High | Maintain feature flags, never delete Supabase until stable |
| Team bandwidth (only 2 devs) | High | High | Strict phase-gating; don't build Phase 2 until Phase 1 is solid |

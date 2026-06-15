# 02 — Product Roadmap

## Guiding Principle

Ship the smallest version that solves a real, complete problem for our ICP.
Each phase must be independently useful — companies should be able to sign up mid-roadmap
and get value immediately.

---

## Phase 0 — Foundation (Now → Month 2)

**Goal:** Clean house before building. Migrate off Supabase, stabilize architecture.

| Task                                                       | Priority |
| ---------------------------------------------------------- | -------- |
| Migrate DB: Supabase → self-hosted PostgreSQL              | Critical |
| Migrate auth: Supabase Auth → Better Auth                  | Critical |
| Replace Supabase JS client → Drizzle ORM + direct Postgres | Critical |
| Set up Bun + Hono API layer                                | Critical |
| Hindi i18n foundation (i18next setup)                      | High     |
| WhatsApp Business API proof of concept                     | High     |
| Biometric device webhook skeleton                          | Medium   |
| Fix/complete existing Slack integration                    | Medium   |
| Set up Docker Compose for self-hosting                     | High     |

**Output:** Clean, self-hostable codebase. No Supabase dependency.

---

## Phase 1 — Launch-Ready Core (Month 2 → Month 5)

**Goal:** A complete product for a 50-person manufacturing company in Jaipur.
This company needs: employee records, attendance, leaves, payroll, WhatsApp approvals.

### 1A — People & Org (Month 2–3)

- [ ] Department hierarchy (multi-level)
- [ ] Designation / Job title management
- [ ] Employment type (full-time, part-time, contractor, intern, daily wage)
- [ ] Employee lifecycle status (Active, Probation, On Notice, Terminated, On Leave of Absence)
- [ ] Direct manager assignment
- [ ] Custom employee fields (configurable per org)
- [ ] Employee directory with search
- [ ] Bulk employee import via CSV
- [ ] Employee self-service profile update
- [ ] Emergency contact records
- [ ] PAN, Aadhaar, bank account fields (masked, access-controlled)

### 1B — Attendance & Shifts (Month 3–4)

- [ ] Shift definitions (Morning 9–5, Night 10pm–6am, etc.)
- [ ] Shift assignment per employee / team
- [ ] Daily attendance record (Present, Absent, Half-day, On Leave, Holiday, Week-off)
- [ ] Manual attendance marking by manager
- [ ] Biometric device integration (ZKTeco / HID via webhook/CSV import)
- [ ] Late arrival / early departure tracking
- [ ] Overtime tracking (with configurable rates)
- [ ] Regularization requests (employee explains absence)
- [ ] Monthly attendance summary per employee
- [ ] Attendance-based payroll integration

### 1C — Leave (Extend Existing) (Month 2–3)

- [ ] Carry-forward with expiry date support
- [ ] Leave encashment rules (configurable)
- [ ] Compensatory off (comp-off) earned + redemption
- [ ] Work-from-home tracking (separate from leave but same calendar)
- [ ] Leave calendar (team + org views)
- [ ] Manager delegation for approvals
- [ ] Leave reports: balance summary, utilization, trends
- [ ] WhatsApp leave apply + approve (see integrations)

### 1D — Payroll & Statutory Compliance (Month 3–5)

- [ ] Salary structure builder (Basic, HRA, Special Allowance, Conveyance, custom components)
- [ ] Gross-to-net calculation engine
- [ ] PF deduction (Employee 12% + Employer 12% + admin charges)
- [ ] ESI deduction (applicable if gross ≤ ₹21,000)
- [ ] Professional Tax (state-wise slabs — Maharashtra, Karnataka, etc.)
- [ ] TDS calculation (old + new tax regime)
- [ ] Income tax declaration form (for employees to submit proof)
- [ ] Monthly payroll run (lock + finalize flow)
- [ ] Payslip generation (PDF, downloadable by employee)
- [ ] Payslip delivery via WhatsApp / email
- [ ] Salary revision history
- [ ] Arrears calculation
- [ ] Reimbursement claims (bills upload + approval)
- [ ] Tally export (salary journal entries in Tally-compatible format)
- [ ] PF ECR file generation (upload to EPFO)
- [ ] ESI return file generation
- [ ] Form 16 generation (Part A + B)
- [ ] Bank transfer file (HDFC / ICICI / SBI format)

### 1E — WhatsApp Integration (Month 3–4)

- [ ] Leave request via WhatsApp (employee messages bot → request created)
- [ ] Leave approval via WhatsApp (manager gets notification, taps Approve/Reject)
- [ ] Payslip delivery via WhatsApp (auto-sent on payroll finalization)
- [ ] Attendance punch-in via WhatsApp (for non-biometric companies)
- [ ] Leave balance check ("How many leaves do I have?")
- [ ] Hindi + English language support in bot

### 1F — Documents (Month 4–5)

- [ ] Employee document vault (upload ID proofs, certificates, contracts)
- [ ] Document categories and access control
- [ ] Offer letter template builder (merge fields)
- [ ] Appointment letter, experience letter generation
- [ ] E-sign integration (basic: PDF + digital signature capture)
- [ ] Document expiry alerts (visa, certifications)
- [ ] Bulk document generation (generate letters for 50 employees at once)

**Phase 1 Outcome:** A company can run their entire HR on Avkash — from hire to payslip.

---

## Phase 2 — Grow & Retain (Month 5 → Month 10)

**Goal:** Reduce churn. Give companies a reason to never leave.

### 2A — Onboarding & Offboarding

- [ ] Onboarding checklist builder (per department/role)
- [ ] Pre-boarding portal (new hire fills info before day 1)
- [ ] IT asset tracking and assignment
- [ ] Task assignment to multiple people (IT setup, ID card, bank account opening)
- [ ] Probation period tracking and review trigger
- [ ] Exit workflow — notice period, clearance, FnF settlement
- [ ] Full & Final calculation (earned salary, leave encashment, gratuity)

### 2B — Performance Management

- [ ] Goal setting (individual, team, org)
- [ ] Check-in cadence (weekly/monthly self-updates)
- [ ] Annual/quarterly performance review cycle
- [ ] Rating scales (configurable)
- [ ] Manager review + employee self-review
- [ ] Performance history per employee
- [ ] PIP (Performance Improvement Plan) workflow

### 2C — Announcements & Policies

- [ ] Company-wide announcements (shown on dashboard, WhatsApp push)
- [ ] Policy document library (upload HR policy, code of conduct, etc.)
- [ ] Employee acknowledgement tracking (did they read the policy?)

### 2D — Recruitment (Basic ATS)

- [ ] Job opening creation (internal + external posting)
- [ ] Application intake form (shareable link)
- [ ] Kanban pipeline (Applied → Screening → Interview → Offer → Hired)
- [ ] Interview scheduling
- [ ] Offer letter generation from ATS
- [ ] One-click convert candidate → employee

### 2E — Multi-Location Support

- [ ] Multiple offices per org with different holidays, PT slabs, leave policies
- [ ] Location-based attendance (geo-fence check-in)
- [ ] Location manager role
- [ ] Consolidated reporting across locations

### 2F — Reporting & Analytics

- [ ] Headcount dashboard (growth over time, by dept/location)
- [ ] Attrition / turnover rate
- [ ] Leave utilization heatmap by month
- [ ] Attendance adherence % per department
- [ ] Payroll cost trend
- [ ] Custom report builder (drag-and-drop filter + columns)
- [ ] Export: Excel, PDF, CSV

---

## Phase 3 — Enterprise & Ecosystem (Month 10+)

**Goal:** Move upmarket to 200–1,000 employee companies. Build moat.

### 3A — Benefits Administration

- [ ] Health insurance plan configuration
- [ ] Enrollment workflow
- [ ] Claim submission and tracking
- [ ] Flexible benefits (meal vouchers, phone allowance)

### 3B — Advanced Compliance

- [ ] Gratuity calculation and tracking
- [ ] Maternity Benefit Act compliance
- [ ] Shops & Establishments Act registers (Form-wise)
- [ ] Labour law audit reports

### 3C — Integrations Ecosystem

- [ ] Microsoft Teams (same as Slack)
- [ ] Google Workspace (calendar, directory sync)
- [ ] Zoho Books / QuickBooks integration
- [ ] Webhook API (external tools subscribe to HR events)
- [ ] Public REST API with API keys

### 3D — Mobile App

- [ ] React Native app (Android-first, given ICP)
- [ ] Employee self-service on mobile
- [ ] Manager approvals on mobile
- [ ] Offline attendance marking (sync when online)

### 3E — SSO & Enterprise Security

- [ ] Google SSO
- [ ] Microsoft SSO
- [ ] SAML 2.0
- [ ] IP allowlisting
- [ ] Audit log export
- [ ] Data export / GDPR controls

### 3F — Self-Hosted Packaging

- [ ] One-click Docker Compose deploy
- [ ] Helm chart for Kubernetes
- [ ] Auto-update mechanism
- [ ] Commercial license exception workflow for AGPL-restricted customers

---

## Feature Priority Matrix

```
                HIGH VALUE to ICP
                       |
   Biometric ←—————————+—————————→ WhatsApp Bot
   Payroll / PF        |           Leave Mgmt
   Tally Export        |           Attendance
                       |
EASY TO BUILD ——————————+—————————— HARD TO BUILD
                       |
   Hindi UI            |           Full ATS
   Announcements       |           Performance
   Document vault      |           Benefits
                       |
                LOW VALUE to ICP
```

Build: top-right quadrant first (high value + easy), then top-left (high value + hard).

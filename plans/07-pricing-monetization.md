# 07 — Pricing & Monetization

---

## Pricing Philosophy

- **Per employee, per month** — scales with company growth (aligns our revenue with their success)
- **No seat minimums** — a 35-person company should not pay for 50 seats
- **Free tier is real** — not crippled, actually useful. Goal: get them in, let them grow
- **Annual billing saves them money** — and improves our cash flow
- **GST included in pricing display** (required for Indian B2B)

---

## Tier Structure

### Free — ₹0/month

**Up to 25 employees. Forever.**

- Core HR: employee profiles, org structure
- Leave management (all features)
- Holiday calendar
- Basic attendance (manual marking)
- WhatsApp integration (limited: 100 messages/month)
- 5 GB document storage
- Community support

> Goal: Acquire. 25-person companies that grow will upgrade. Word-of-mouth starter.

---

### Starter — ₹60/employee/month (billed monthly)

**₹50/employee/month (billed annually) — save 2 months**

Up to 100 employees.
Everything in Free, plus:

- Attendance with biometric integration
- Shift management
- Payroll (up to 2 salary structures)
- PF + ESI calculation and file generation
- Professional Tax (1 state)
- Payslip generation + WhatsApp delivery
- Document vault (unlimited storage)
- Onboarding checklists
- Tally export
- Email support (48-hour response)

> Target: 50–100 employee manufacturing/retail company. At 60 employees: ₹3,600/month.
> Comparable to 1 hour of an accountant's time.

---

### Growth — ₹100/employee/month (billed monthly)

**₹83/employee/month (billed annually) — save 2 months**

Up to 500 employees.
Everything in Starter, plus:

- Multi-location support
- Multiple salary structures (unlimited)
- All statutory compliance (all PT states, LWF, gratuity tracking)
- Form 16 generation
- Performance reviews
- Recruitment (ATS)
- Custom employee fields
- Custom report builder
- Hindi UI
- Bank transfer file generation
- Priority email support (24-hour response)
- WhatsApp support channel

> Target: 100–300 employee company that has an HR executive. At 150 employees: ₹15,000/month.

---

### Enterprise — Custom pricing

500+ employees, or:

- Multiple organizations under one account
- Self-hosted deployment
- SSO (SAML, Google Workspace, Microsoft)
- Dedicated onboarding + data migration
- SLA: 99.9% uptime, 4-hour support response
- Custom compliance modules (sector-specific)
- White-label option
- Dedicated account manager

> Start at ₹80/employee/month with annual commitment + setup fee.

---

## Add-ons (Future Revenue)

| Add-on                                         | Price                            | For       |
| ---------------------------------------------- | -------------------------------- | --------- |
| WhatsApp Business API                          | ₹999/month (includes 1,000 msgs) | All tiers |
| Additional WhatsApp messages                   | ₹0.50/message                    | All tiers |
| Biometric device setup assistance              | ₹2,999 one-time                  | Starter+  |
| Data migration from legacy HRMS                | ₹9,999 one-time                  | Growth+   |
| Payroll processing service (we do it for them) | 0.5% of payroll + ₹499/month     | Growth+   |
| CA partner integration                         | ₹499/month                       | Growth+   |

---

## Annual vs Monthly

| Plan       | Monthly  | Annual (per month) | Savings |
| ---------- | -------- | ------------------ | ------- |
| Starter    | ₹60/emp  | ₹50/emp            | 16.7%   |
| Growth     | ₹100/emp | ₹83/emp            | 17%     |
| Enterprise | Custom   | Custom + 20% off   | —       |

Annual billing paid upfront (12 months). GST (18%) added on invoice.

---

## CA Reseller Program

Target: 500 CA firms in 2 years.

- CA signs up as a reseller
- Gets their own white-label dashboard to manage all client orgs
- Earns 20% recurring commission
- Commission paid monthly via bank transfer
- CA can bill clients at any price they choose (margin play)

**Why CAs will do this:**

- Already does payroll for SME clients manually
- This automates 80% of their work
- Keeps client sticky to the CA's services
- Passive recurring income

**Onboarding CAs:**

- ₹0 cost to become a reseller
- Free training + certification
- Co-marketing support (their name on case studies)
- Priority support channel

---

## Competitive Price Positioning

| Product            | Starting Price                               |
| ------------------ | -------------------------------------------- |
| Keka               | ₹9,999/month minimum (~₹100/emp for 100 emp) |
| GreytHR            | ₹3,495/month for 50 emp (₹70/emp)            |
| Zoho People        | $1/emp/month (~₹85/emp)                      |
| sumHR              | ₹2,495/month for 25 emp (₹100/emp)           |
| **Avkash Starter** | **₹60/emp/month (no minimum)**               |
| **Avkash Free**    | **₹0 for ≤25 employees**                     |

We are 15–40% cheaper than competitors for the 30–150 employee segment,
with better WhatsApp integration and statutory compliance depth.

---

## Revenue Projections

### Conservative Case

| Time     | Paying Companies | Avg ARR/Company | ARR     |
| -------- | ---------------- | --------------- | ------- |
| Month 6  | 50               | ₹36,000         | ₹18 L   |
| Month 12 | 200              | ₹48,000         | ₹96 L   |
| Month 18 | 500              | ₹60,000         | ₹3 Cr   |
| Month 24 | 1,200            | ₹72,000         | ₹8.6 Cr |
| Month 36 | 3,000            | ₹84,000         | ₹25 Cr  |

### Assumptions

- Average company: 80 employees
- Average tier: Starter (₹50/emp annual) = ₹48,000/year
- Churn: 2% monthly
- Growth: primarily from CA reseller network
- 5 CA resellers in month 1, 50 by month 12, 500 by month 24

---

## Billing Infrastructure

- **Razorpay Subscriptions** (existing) — monthly recurring
- **Razorpay Payment Links** — for annual upfront payments
- **GST-compliant invoices** — auto-generated, sent via email
- **Invoice format:** Avkash Technology Pvt Ltd (GSTIN: ...), HSN/SAC code for software services
- **Grace period:** 7 days after failed payment before account suspension
- **Data retention after churn:** 90 days (then archived), 12 months for self-hosted

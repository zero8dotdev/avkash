# 01 — Market Strategy

## Target Market

### Primary: Indian SMEs in Tier 2+ Cities

**Cities (non-exhaustive):**
Indore, Nagpur, Coimbatore, Surat, Jaipur, Vadodara, Lucknow, Bhopal, Visakhapatnam,
Rajkot, Madurai, Nashik, Aurangabad, Jodhpur, Raipur, Kochi, Chandigarh, Bhubaneswar,
Tiruppur, Salem, Ludhiana, Amritsar, Meerut, Agra, Dehradun

**Sectors (non-IT):**

- Manufacturing & light industry (textiles, plastics, metal fabrication)
- Retail chains and wholesale distributors
- Healthcare — private hospitals, nursing homes, polyclinics, diagnostic labs
- Education — private schools, colleges, coaching institutes
- Construction and real estate firms
- Logistics and transport companies
- Food processing and FMCG distribution
- CA / law / consulting firms (non-tech professional services)
- Auto dealerships and service centers
- Hospitality — hotel chains, restaurant groups

**Company size:** 30–500 employees
**Decision maker:** Business owner, HR head, or finance manager (often the same person)
**Budget range:** ₹30–150 per employee per month
**Tech literacy:** Low to moderate; smartphone-first, Windows desktop secondary

---

## Ideal Customer Profile (ICP)

### Primary ICP

- **Company:** Manufacturing/retail firm, 75–250 employees
- **Location:** Tier 2 city
- **Current HR system:** WhatsApp groups + Excel + paper registers
- **Pain:** Leave approvals via WhatsApp are chaotic, payroll done manually every month, no compliance tracking, owner cannot see who is absent without asking
- **Trigger to buy:** Owner just got fined for PF default OR a key employee left and onboarding the replacement was a mess
- **Buyer:** Owner or their trusted office manager / accountant
- **Champion:** HR executive (if they have one) or the accountant

### Secondary ICP

- **Company:** Private hospital or education group, 100–400 employees across 2–3 locations
- **Pain:** Multi-location leave tracking, shift management for nurses/staff, salary compliance
- **Buyer:** HR head or COO

---

## Market Size

- India has ~63 million MSMEs. ~6.3 million have 20+ employees (rough estimate).
- Tier 2+ cities hold ~60% of this segment.
- Non-IT SMEs in target range: ~1–2 million companies
- Addressable with digital-first product in next 3 years: ~200,000 companies
- At ₹5,000/month average ARR → ₹1,000 Cr TAM in accessible segment
- Realistic 3-year target: 5,000 paying companies → ₹25 Cr ARR

---

## Competition Analysis

| Product              | Strength                   | Weakness                                      | Our Edge                             |
| -------------------- | -------------------------- | --------------------------------------------- | ------------------------------------ |
| **GreytHR**          | Strong compliance, payroll | Complex UI, expensive for small cos           | Simpler, cheaper, WhatsApp-native    |
| **Keka**             | Good UX, HR-focused        | ₹9,999/mo minimum, overkill for 50-person cos | Affordable per-employee pricing      |
| **Zoho People**      | Brand trust, cheap         | Generic, poor mobile, confusing               | Purpose-built for our ICP            |
| **sumHR**            | Affordable, India-focused  | Outdated UX, limited integrations             | Modern stack, open source trust      |
| **Darwinbox**        | Enterprise-grade           | Enterprise pricing, not for SME               | Different league entirely            |
| **Excel + WhatsApp** | Free, familiar             | No structure, compliance risk                 | Replace the habit, not just the tool |

### Competitive Positioning

> "The only HRMS built specifically for the shop floor, not the IT floor."

Key differentiators:

1. **WhatsApp-first** — Leave requests, approvals, payslips via WhatsApp (where these companies already are)
2. **Statutory compliance baked in** — PF, ESI, PT auto-calculated, not an add-on
3. **Hindi UI** — First-class Hindi language support
4. **Self-hostable** — For companies with data privacy concerns (hospitals, law firms)
5. **Biometric integration** — ZKTeco, HID, Hikvision devices (factories, hospitals use these)
6. **Open source core** — Transparent, auditable, no vendor lock-in fear
7. **Tally integration** — Most tier 2 accountants live in Tally; payroll export must work with it

---

## Customer Acquisition Channels

### Primary Channels

**1. CA / Chartered Accountants as resellers**

- Every SME in India has a CA. CAs handle payroll/compliance for most of them.
- CAs are the most trusted advisor to these owners.
- Strategy: Reseller program — CA gets 20% recurring commission + their own white-label dashboard
- Target: 500 CA partners in first 2 years

**2. WhatsApp and word-of-mouth**

- These companies discover products through peer referrals, not Google ads
- Build a referral program: ₹500 per referred company that converts
- Seed with 10 happy customers in one city → word spreads fast in a business community

**3. Industry associations**

- CII (Confederation of Indian Industry) has tier 2 city chapters
- MSME clusters (textile clusters in Surat, auto parts clusters in Pune/Rajkot)
- Local chambers of commerce
- Partner with these for bulk introductions

**4. Direct field sales (later)**

- 1 salesperson per city cluster, 10 cities initially
- Laptop + demo, goes to industrial estates and business parks
- Closes ₹3,000–8,000/month deals face-to-face

**5. Content + SEO (slow but free)**

- Hindi blog content: "PF compliance guide for small business India"
- YouTube videos in Hindi on HR compliance, payslip rules
- These owners search in Hindi on YouTube more than Google

### Secondary Channels

- LinkedIn (HR professionals, not owners — for advocacy)
- Partnerships with Tally resellers (they visit the same customer base)
- Government MSME portal listings
- Local newspaper / trade publication ads (yes, these still work in tier 2)

---

## Pricing Philosophy

- **No per-seat minimums that exclude small companies** (unlike Keka's ₹9,999 floor)
- **Pay for what you use** — 35 employees, pay for 35
- **Annual billing encouraged** (2 months free = ~17% discount)
- **Free tier** for ≤25 employees (acquire them, grow with them)
- See [07-pricing-monetization.md](./07-pricing-monetization.md) for full tier breakdown

---

## Localization Requirements

| Requirement                      | Why                                       |
| -------------------------------- | ----------------------------------------- |
| Hindi UI (full)                  | Primary language of tier 2 city workforce |
| Indian date formats (DD/MM/YYYY) | Already in codebase                       |
| INR currency                     | Native                                    |
| GST-compliant invoicing          | Mandatory for B2B billing in India        |
| Indian phone number format       | +91 prefix, 10-digit validation           |
| PAN, Aadhaar field support       | Statutory compliance                      |
| Indian holiday calendar          | National + state-level holidays           |
| WhatsApp integration             | Primary communication channel             |
| MSG91 / Twilio India SMS         | OTP and notifications                     |
| Tally export                     | Accountant requirement                    |

---

## Key Risks

| Risk                                  | Mitigation                                                 |
| ------------------------------------- | ---------------------------------------------------------- |
| Low tech adoption in target segment   | WhatsApp-first product reduces friction                    |
| Price sensitivity                     | Free tier + affordable per-user pricing                    |
| "I'll just use Excel" inertia         | Show ROI: 1 PF fine > 1 year subscription                  |
| Compliance complexity varies by state | Start with central compliance (PF/ESI), add state PT later |
| Competition from funded players       | Open source trust + local CA network                       |
| Data privacy concerns                 | Self-hosted option + transparent codebase                  |

# Plan 26 — Marketing landing page

Status: **structure plan** (no code yet). Defines the page the `apps/web` Next.js stub becomes:
the public marketing site that turns a visitor into a free signup or a demo booking.

## Who this page is for (anchor: plans 01, 07, 08)

**One visitor, decided up front** — every section serves them:

- **Who:** business owner / HR head / finance manager of a 30–500 person firm in a Tier-2 city
  (manufacturing, retail, healthcare, education, logistics, hospitality). Often all three roles in
  one person.
- **Tech literacy:** low to moderate. **Smartphone-first**, Windows desktop secondary. Slow networks.
- **Today they use:** WhatsApp groups + Excel + paper registers.
- **Pain:** leave approvals are chaos, payroll is manual every month, no compliance tracking, the
  owner can't see who's absent without asking around.
- **Buying trigger:** a PF/compliance fine, or a messy onboarding after a key person left.

**Consequence for the page:** plain benefit language (no jargon, no "Bun/Hono/API-first"),
mobile-first layout, WhatsApp and biometric-device integration up front, transparent INR pricing,
compliance/trust heavy. Open-source / self-host / developer content is a **secondary credibility
strip**, not the lead — moved to its own page (see "Developer sliver").

## Conversion goals

1. **Primary CTA (everywhere):** _Start free — up to 25 employees_ → signup.
2. **Secondary CTA:** _Book a demo_ (for the owner who wants a human) → calendar/WhatsApp.
3. **Tertiary:** _Talk to us on WhatsApp_ (a visible number builds Tier-2 trust; the medium they
   already trust).

Pick **one** primary action per screen. Free-signup is the hero; demo is the fallback for the
cautious buyer.

## Voice & design principles

- **Benefit, not feature.** "See who's absent today, instantly" — not "real-time attendance resolver."
- **Show the phone.** Hero and feature shots are phone mockups (employee marking attendance, owner
  approving on WhatsApp), because that's how they'll use it.
- **Trust over hype.** "Your data stays in India", "Set up in a day", "No credit card", compliance
  badges. This audience fears being burned more than they crave features.
- **Fast & light.** Tier-2 = slower networks. Static/SSG pages, optimized images, fast LCP. A heavy
  page loses them before the hero renders.
- **Bilingual-ready.** English at launch; **Hindi** near-term (regional languages later). Design with
  a language switcher and copy that translates cleanly.

---

## Page structure (top → bottom)

Each section: **purpose · content · CTA**.

1. **Nav (sticky, minimal)**
   - Logo · Features · Pricing · Why Avkash · Login · **Start free** (button) · language switcher.
   - Visible WhatsApp/phone for trust. Collapses to a clean mobile menu.

2. **Hero**
   - Purpose: in 5 seconds, "this runs my team's HR from one app."
   - Headline (benefit): _Attendance, leave, and people — run your whole team from one app._
   - Subhead: _Built for Indian businesses. Replace WhatsApp groups, Excel sheets, and paper
     registers._
   - Primary CTA _Start free — up to 25 employees_ + secondary _Book a demo_ / _Watch 1-min video_.
   - Visual: phone mockup (app dashboard + a WhatsApp leave-approval).
   - Trust strip under CTA: _No credit card · Setup in a day · Data stored in India_.

3. **Trust bar / social proof**
   - Customer logos OR (pre-launch) _"Trusted by businesses across [cities]"_ + sector icons.
   - Honest placeholder if none yet — don't fake logos.

4. **Problem framing — "Sound familiar?"**
   - Mirror their day: leave requests lost in WhatsApp · payroll rebuilt in Excel every month ·
     "who's on leave today?" · the PF/compliance worry. Empathy before solution.

5. **How it works (3 steps)**
   - Add your team → employees mark attendance & request leave **on their phone** → you approve on
     WhatsApp and see everything in one dashboard. Low-friction mental model.

6. **Features (benefit-led, modular, with shots)** — grouped by the domains already built:
   - **Leave management** — requests, approvals, balances, policies.
   - **Attendance** — mobile punch, multiple locations, shifts & rosters, **biometric-device
     support** (big for manufacturing/retail — you already built Device ingest).
   - **People & org** — profiles, teams, roles, org structure.
   - **Holidays & policy** — location-aware holiday calendars, configurable policies.
   - **Reports that feed payroll** — the muster register: who's present/absent/late/OT at a glance.
   - **WhatsApp & Slack** — approvals and alerts where your team already is.
   - **Compliance-ready** — PF/ESI/labour-law-aware records (the buying trigger).

7. **Why Avkash (differentiators)**
   - vs WhatsApp+Excel (chaos → one system) · vs expensive enterprise HRMS (priced for Tier-2 India)
     · vs building it yourself. Pillars: **made for Indian SMEs**, **affordable INR pricing**,
     **smartphone-first**, **open-source = no lock-in, you can self-host and audit it** (open-source
     as a *trust* argument here, not a dev pitch).

8. **Integrations**
   - Lead with **WhatsApp**; then Slack; then biometric attendance devices; future: payroll/Tally,
     accounting. Speaks directly to retail/manufacturing reality.

9. **Pricing (from plan 07)**
   - Transparent tiers, **GST-inclusive**, free tier prominent (₹0, up to 25 forever), no seat
     minimums, annual-billing savings called out. CTA per tier. Anxiety-reducing copy: cancel
     anytime, your data is exportable.

10. **Testimonials / mini case study**
    - Real owner quotes when available (placeholder pre-launch). "Cut our monthly payroll prep from 3
      days to 3 hours" beats abstract praise.

11. **Security & trust**
    - Data residency (India), backups, role-based access, open-source auditability, compliance
      posture. Directly answers "can I trust them with my employee data?"

12. **FAQ**
    - Setup time · migrating from Excel · does it work on basic phones / poor internet · languages ·
      employee training · support channels · self-hosting · data export/lock-in.

13. **Final CTA band**
    - _Start free today_ + _Book a demo_ + WhatsApp contact. Last push for scrollers.

14. **Footer**
    - Product · Pricing · Why Avkash · Docs · **GitHub (open-source)** · Company · Privacy · Terms ·
      Refund/GST · Contact · social · language switcher.

---

## Developer / self-host sliver (separate, off the main funnel)

The technical audience (self-hosters, the open-source-curious, integrators) is real but **small and
different**. Give them a dedicated `/open-source` (or `/developers`) page: the stack, GitHub, license,
one-command self-host (link plan 11 — Coolify), the typed API. Link it only from the footer and the
"open-source = no lock-in" pillar. Keep it out of the business-owner flow so neither audience is
diluted.

---

## Cross-cutting

- **Mobile-first** breakpoints; the page is *designed* on a phone first, desktop second.
- **Performance budget:** fast LCP on a mid-range Android over 4G. SSG, image optimization, minimal JS.
- **i18n:** English at launch, Hindi structurally ready (copy keys, switcher). Don't hardcode strings.
- **SEO:** target "HR software for small business India", "attendance app", "leave management
  software India", city/sector long-tail. Proper metadata, OG images, sitemap. (Blog = later.)
- **Analytics + lead capture:** event tracking on CTAs, a lightweight demo/contact form → CRM/inbox.
- **Accessibility:** legible contrast, tap targets, keyboard nav — also helps SEO and slow devices.

## Tech approach (when we build)

- Lives in `apps/web` (currently a stub). Marketing pages as a **static/SSG route group**, kept
  separate from the authenticated product app so the funnel is fast and independently deployable.
- Section-component architecture (Hero, Features, Pricing, FAQ …) so copy/order iterate without
  rebuilds. Content (features, pricing, FAQ, testimonials) in typed data/MDX, not hardcoded in JSX.
- Deploy per plan 06/11.

## Build sequence

- **Phase 1 — launchable MVP:** Nav · Hero · How-it-works · Pricing · Final CTA · Footer + signup/demo
  CTAs wired. Enough to put a real URL live and start collecting signups.
- **Phase 2 — depth:** Features, Why Avkash, Integrations, Trust, FAQ, problem-framing.
- **Phase 3 — polish & scale:** Hindi i18n, testimonials/case studies, `/open-source` page, SEO/blog,
  analytics dashboards.

## Decisions needed (before Phase 1)

1. **Brand:** logo, colors, typography — exists or design first?
2. **Domain** and primary CTA destination (in-app signup ready, or waitlist first?).
3. **Demo flow:** self-serve calendar, WhatsApp, or call-back form?
4. **Launch language:** English-only, or English + Hindi from day one?
5. **Pre-launch social proof:** any pilot customers/quotes to feature, or run honest-placeholder?
6. **Visual assets:** real product screenshots vs. designed mockups for the hero/features.

## Out of scope (this plan)

The authenticated product UI, the blog/CMS, and the developer docs site — each its own effort.

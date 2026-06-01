# Feature: Recruitment (ATS)

Keep this lean. Our ICP doesn't need LinkedIn Recruiter features.
They need: post job → track applications → hire → auto-create employee. That's it.

---

## Job Postings

### Create a Job
- Title, department, designation, location
- Employment type (full-time / contract / daily wage)
- Number of openings
- Salary range (optional — for internal reference)
- Job description (rich text)
- Requirements / qualifications
- Closing date

### Visibility
- **Internal** (only HR sees applications, no public link)
- **Public** (shareable link, shows on company's career page)

### Career Page
- Auto-generated `/careers/[org-slug]` page listing all open jobs
- Embeddable widget for org's own website
- Mobile-friendly, no login required for candidates

---

## Application Pipeline (Kanban)

```
APPLIED → SCREENING → INTERVIEW → OFFER → HIRED
                                        ↘ REJECTED
                                        ↘ WITHDRAWN
```

### Per Job View
- Kanban board with cards per candidate
- Drag to move between stages
- Card shows: name, applied date, source, last activity
- Filter by source, date, designation

### Candidate Profile
- Name, email, phone
- Source (walk-in, referral, naukri, linkedin, etc.)
- Resume (PDF view in browser)
- Interview notes (each interviewer adds notes)
- Stage history with timestamps
- Assigned recruiter/interviewer

---

## Interview Management
- Schedule interview: date, time, interviewer(s), mode (in-person / phone / video)
- Interviewer gets email/WhatsApp notification
- After interview: interviewer submits feedback (rating + comments)
- Multiple interview rounds supported
- Calendar view of scheduled interviews

---

## Offer Management
- Generate offer letter from template (pre-fills candidate data)
- Offer: salary, joining date, designation, department
- Send to candidate via email / WhatsApp
- Candidate accepts/declines (tracked)
- Accepted → ready to convert

---

## Convert to Employee
One click after offer accepted:
1. Candidate data pre-fills new employee form
2. HR reviews + confirms
3. Employee record created, joining date set
4. Pre-boarding flow triggered
5. Candidate status → HIRED, linked to new userId

**Key: Zero re-entry of data.**

---

## Reports
- Open positions vs filled
- Time-to-hire per designation
- Source effectiveness (which source gives most hires?)
- Rejection reasons analysis
- Cost-per-hire (manual entry for now, job board spends)

---

## Referral Program (Phase 2)
- Employee shares a referral link
- Application tagged with referring employee
- Referral bonus tracked (₹X if referral is hired + completes 3 months)
- Paid out via payroll

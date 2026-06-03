# Feature: Integrations

---

## WhatsApp (Priority 1 for ICP)

WhatsApp is where tier 2 India does business. This is not a notification channel — it's a full UI.

### Why WhatsApp > Slack for our ICP

- Factory worker has WhatsApp, not Slack
- Owner manages business from WhatsApp groups
- No training required
- Works on 2G / basic Android

### Provider: Meta WhatsApp Business API

- Via BSP (Business Solution Provider): Interakt, Wati, or MSG91 WhatsApp
- MSG91 recommended — Indian provider, good rates, Hindi support
- Alt: Direct Meta Cloud API (cheaper, more setup)

### Employee Flows via WhatsApp

**Apply for Leave:**

```
Employee: "leave"
Bot: "Hi Rajan! Apply for leave:
     1. Casual Leave
     2. Sick Leave
     3. Earned Leave"
Employee: "2"
Bot: "From date? (DD/MM/YYYY)"
Employee: "20/03/2025"
Bot: "To date?"
Employee: "21/03/2025"
Bot: "Reason (optional)?"
Employee: "Doctor appointment"
Bot: "Confirm: Sick Leave, 20-21 Mar 2025 (2 days)?
     1. Yes  2. No"
Employee: "1"
Bot: "Leave request submitted! Your manager will be notified."
```

**Check Leave Balance:**

```
Employee: "balance"
Bot: "Hi Rajan, your leave balance:
     Casual Leave: 8 days
     Sick Leave: 4 days
     Earned Leave: 12.5 days"
```

**Attendance Check-in (for non-biometric cos):**

```
Employee sends: "in"
Bot: "Checked in at 9:32 AM. Good morning, Rajan!"
Employee sends: "out"
Bot: "Checked out at 6:45 PM. Total: 9h 13m"
```

**Payslip:**

```
Bot (on payroll finalization):
"Hi Rajan, your salary for March 2025 has been processed.
Gross: ₹28,500 | Net: ₹24,810
[Download Payslip] [View Details]"
```

### Manager Flows via WhatsApp

**Leave Approval:**

```
Manager receives:
"Leave Request from Rajan Patel:
Type: Sick Leave | 20-21 Mar 2025 | 2 days
Reason: Doctor appointment

Reply:
1. Approve
2. Reject"

Manager: "1"
Bot: "Approved! Rajan has been notified."
```

**Team Summary (Morning):**

```
Bot sends daily at 9 AM:
"Good morning, Vikram! Team status today:
✓ Present: 8/12
⊘ On Leave: 2 (Rajan, Priya)
⊘ Late: 1 (Suresh - 9:52 AM)
⊘ Absent: 1 (Mohan)"
```

### Implementation

- Webhook receives all WhatsApp messages
- State machine per conversation (tracks where user is in a flow)
- Session state stored in Redis (expires 30 min)
- All actions create real records in the DB
- Falls back to web URL for complex actions

---

## Slack (Existing — Deepen)

### Current State

- OAuth token storage
- Basic Slack status updates on leave
- Notification preferences

### Enhance to Match WhatsApp Feature Parity

- Slash commands: `/leave apply`, `/leave balance`, `/leave team`
- Home tab: personal dashboard in Slack
- Block Kit modals: full leave application form in Slack
- Manager approval via interactive messages
- Daily digest to manager channel

---

## Biometric Devices

### Supported

**ZKTeco (most common in India)**

- Integration via ZKTeco Push SDK
- Device sends punches to configured webhook URL
- No need to install software on PC
- Setup: provide API URL + device key in Avkash, configure on device

**HID (access control)**

- Via HID OSDP or REST API (model-dependent)
- Door access event = attendance event

**Hikvision**

- Attendance terminals (DS-K1 series)
- ISAPI push events to webhook

**Generic CSV Import**

- Any device can export punch log as CSV
- Standard import: User ID, Date, Time, In/Out flag
- Upload once or schedule via email attachment

### User Mapping

- During device setup, HR maps device-user-IDs to Avkash employees
- One-time setup via a mapping UI
- Unmapped punches flagged for HR attention

---

## Tally ERP / Tally Prime

See [payroll](./03-payroll-compliance.md) for full detail.

- Export payroll journal entries as Tally XML
- Import directly into Tally with one click
- No manual data entry for accountant

---

## Google Workspace

- **Google OAuth** — Sign in with Google
- **Google Calendar** — Sync leave events to personal calendar (existing iCal endpoint extended)
- **Google Directory** — Bulk import employees from Google Workspace (Phase 2)

---

## Microsoft 365 (Phase 2)

- Microsoft SSO
- Teams integration (same as Slack)
- Outlook calendar sync

---

## Email (Transactional)

Provider: **Resend** (modern, reliable, good India deliverability)
Fallback: **Nodemailer** + SMTP (for self-hosted)

Events that trigger email:

- Leave request submitted (to manager)
- Leave approved/rejected (to employee)
- New employee invite
- Payslip ready
- Document to sign
- Policy announcement
- Birthday / work anniversary (configurable)
- Probation ending in 7 days (to manager)
- PF/ESI due date reminder (to HR)

### Email Templates

- HTML templates with org logo
- Hindi + English variants
- Consistent with web UI design

---

## SMS (India)

Provider: **MSG91** (trusted Indian provider, good tier 2 reach)
Fallback: **Twilio India**

Used for:

- OTP for magic link auth (faster than email for some users)
- Leave approval notification (managers without WhatsApp bot)
- Payslip notification (fallback if WhatsApp fails)

---

## Webhook API (Phase 2)

Allow external systems to subscribe to Avkash events:

```json
POST /webhooks
{
  "event": "leave.approved",
  "orgId": "...",
  "payload": {
    "userId": "...",
    "leaveId": "...",
    "dates": {...}
  }
}
```

Events published:

- `employee.created`, `employee.updated`, `employee.terminated`
- `leave.requested`, `leave.approved`, `leave.rejected`
- `attendance.marked`
- `payroll.finalized`, `payslip.generated`
- `document.signed`

Use cases: sync to custom ERP, trigger Azure DevOps scripts, custom Slack bots.

---

## Public REST API (Phase 3)

- API key per org (not user-level)
- Rate limited: 1,000 requests/hour
- CRUD for all major resources
- OpenAPI spec published
- SDKs: TypeScript, Python

---

## Razorpay (Existing — keep)

Payment processing for SaaS subscriptions. Already integrated.
Extend with:

- GST-inclusive invoices (required for Indian B2B)
- Annual billing option (2 months free)
- Failed payment retry with WhatsApp nudge

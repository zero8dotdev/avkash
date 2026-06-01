# Feature: Leave & Attendance

---

## Leave Management (Extending Existing)

### What's Already Built
- Leave types, leave policies, apply/approve/reject flow
- Half-day support, working days calculation
- Overlap prevention, accruals, Slack notifications
- Holiday calendar

### What's New

**Carry Forward with Expiry**
- When financial year ends, roll over remaining balance
- Configure: "Carry forward max 10 days, expires March 31"
- System auto-creates LeaveCarryForward record
- Expired carried leaves alert HR before expiry

**Leave Encashment**
- Policy: "Encash up to 15 days per year at basic salary rate"
- Employee can request encashment (paid out in payroll)
- Requires HR approval
- Deducted from balance, added to payroll as earning

**Compensatory Off (Comp-Off)**
- Employee works on holiday/weekend → earns comp-off
- Manager approves the comp-off credit
- Employee can apply leave against comp-off balance
- Comp-off expires after configurable days (e.g., 90 days)

**Work From Home (WFH)**
- WFH tracked separately from leave (does not deduct balance)
- Policy: max WFH days per month (optional)
- Shows on attendance calendar
- Manager can approve/reject

**Manager Delegation**
- Manager going on leave → delegate approval rights to another manager
- Time-bound delegation (start date, end date)
- Delegated approver sees delegated team's pending requests

**Leave Calendar**
- Month/week view
- Who's on leave today, this week
- Color-coded by leave type
- Team filter, department filter
- Sync to Google Calendar / iCal feed (existing endpoint)

**Leave Reports**
- Balance summary per employee (all leave types, used / remaining / pending)
- Monthly utilization by department
- Year-over-year comparison
- Export to Excel

---

## Attendance

### Attendance Marking Sources
1. **Manual by manager** — HR/manager marks daily attendance in web UI
2. **Self-mark** — Employee marks own attendance (if policy allows)
3. **WhatsApp** — Employee sends check-in message via WhatsApp bot
4. **Mobile** (Phase 3) — GPS-verified check-in via app
5. **Biometric** — Auto-populated from ZKTeco/HID devices

### Daily Attendance States
| Status | Description |
|--------|-------------|
| PRESENT | Full day worked |
| HALF_DAY | Half day (morning or afternoon) |
| ABSENT | Unexcused absence |
| ON_LEAVE | Approved leave (linked to Leave record) |
| WFH | Work from home |
| HOLIDAY | Public holiday |
| WEEK_OFF | Designated weekly off (e.g., Sunday) |

### Shift Management
- Define shifts: name, start time, end time, grace period
- Assign shift to employee (with effective dates)
- Rotating shifts: assign weekly pattern
- Night shifts: cross-midnight supported
- Holiday / week-off auto-populated from team's work week + holiday calendar

### Late & Overtime
- Late if check-in > shift start + grace minutes
- Overtime = working minutes beyond shift end
- Configurable overtime rate (1.5x, 2x) for payroll
- Monthly overtime report

### Regularization
- Employee can request to regularize attendance (explain absence)
- Manager approves/rejects with reason
- If approved, AttendanceRecord.isRegularized = true
- Audit logged

### Biometric Integration
**Supported Devices:**
- ZKTeco (most common in Indian factories/offices)
- HID (enterprise access)
- Hikvision (CCTV + access)

**Integration Modes:**
1. **CSV Import** — Download punches from device software, upload CSV
2. **API Poll** — Avkash polls device API every 15 minutes (via BullMQ cron)
3. **Push Webhook** — Device pushes punch to Avkash webhook (for newer devices)

**Mapping:** Device user ID → Avkash User (mapped in BiometricDevice setup)

**Processing:**
- BiometricEvent created for each raw punch
- Worker matches IN/OUT pairs to create AttendanceRecord
- Unmatched punches flagged for HR review
- Missing punches trigger "mark absent at EOD" job

### Monthly Attendance Sheet
- Grid view: rows = employees, columns = dates
- Color-coded cells by status
- Edit any cell (manager)
- Lock attendance after payroll finalization
- Export as Excel (standard format)

### Attendance Analytics
- Attendance % per employee / team / department
- Late arrival frequency
- Absenteeism trends by month
- Department-level heatmap

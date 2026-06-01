# Feature: Onboarding & Offboarding

The first and last impression of an employee's journey. Critical for small companies where onboarding chaos leads to early attrition.

---

## Onboarding

### Pre-boarding (Before Day 1)
- System sends email/WhatsApp to new hire with a pre-boarding link
- New hire fills in their profile (address, emergency contact, PAN, bank details, tax declaration)
- No account needed yet — anonymous form with one-time token
- Data auto-populates employee profile when they join
- Document upload: ID proof, address proof, educational certificates

### Onboarding Templates
- HR creates templates per department/designation
- Template = ordered list of tasks with:
  - Task title
  - Who does it: HR, Manager, IT, Finance, or the Employee themselves
  - Due in X days from joining
  - Category: IT Setup, Admin, HR, Finance, Buddy

**Example: Manufacturing Floor Supervisor**
```
Day 0 (HR)     : Create ID card
Day 0 (IT)     : Create email account
Day 0 (IT)     : Assign laptop/tablet
Day 1 (Manager): Factory floor tour
Day 1 (Employee): Sign offer letter
Day 1 (HR)     : Submit original documents
Day 2 (Finance): Bank account opening form
Day 3 (Manager): Introduce to team
Day 7 (HR)     : PF account opening
Day 30 (Manager): First 30-day check-in
```

### Onboarding Checklist (Live Instance)
- When new employee created with joining date → system spawns checklist from template
- Each task assignee gets notification (web + WhatsApp)
- Real-time completion tracking
- HR sees % complete for all new joiners at a glance
- Overdue tasks flagged in red

### IT Asset Assignment
- Define asset types: laptop, mobile, access card, locker key, safety equipment
- Assign to employee with serial number + date
- Asset list on employee profile
- Generate: "Assets in possession" acknowledgement letter
- On offboarding: asset return checklist

---

## Offboarding

### Resignation Flow
1. Employee submits resignation (web or WhatsApp)
2. Manager acknowledges, sets last working day (notice period calculated)
3. Status changes to ON_NOTICE
4. Offboarding checklist auto-generated

### Offboarding Checklist
**Example:**
```
IT:      Revoke all system access
IT:      Collect laptop, access card
Finance: Recover outstanding advance
Finance: Calculate Full & Final
HR:      Exit interview
HR:      Experience letter generation
Manager: Knowledge transfer completed
Manager: Update team structure
```

### Exit Interview
- Simple form: reason for leaving, feedback on company/manager/culture
- Confidential (only OWNER/ADMIN can see)
- Aggregated exit reasons report (trends over time)

### Full & Final Settlement
See [payroll](./03-payroll-compliance.md) for calculation details.

- FnF payslip generated
- Includes: earned salary, leave encashment, gratuity, bonus proration
- Deducts: advances, notice period shortfall
- One-click bank transfer file

### Clearance Certificate
After all checklist tasks complete:
- System generates clearance certificate
- Required for PF withdrawal, background verification, etc.

---

## Probation Management
- Probation end date tracked on employee profile
- Alert to manager 7 days before expiry: "Complete probation review"
- After review, manager confirms: Regularize / Extend / Terminate
- Regularization letter auto-generated and sent to employee

---

## Analytics
- Average time to complete onboarding (by department)
- Onboarding task completion rates
- Early attrition (exits within 6 months of joining) — red flag
- Probation review pending list

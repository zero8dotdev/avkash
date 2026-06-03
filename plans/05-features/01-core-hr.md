# Feature: Core HR

## Overview

The foundation of the platform. Every other module depends on this being clean and complete.

---

## Employee Management

### Employee Profile

- Photo, name, email, phone
- Employee code (auto-generated: EMP001, or custom pattern per org)
- Department, designation, employment type, reporting manager
- Date of joining, probation end date, notice period
- Personal: DOB, gender, address
- Statutory: PAN (masked), Aadhaar (last 4 visible), PF number, ESI number
- Banking: account number (masked), IFSC, bank name
- Emergency contact
- Custom fields (configured per org)

### Employee Directory

- Search by name, department, designation, location
- Filter by status (Active, On Probation, etc.)
- Card and list views
- Exportable to CSV/Excel
- Visible to managers and above (configurable)

### Bulk Import

- CSV template download
- Upload → preview → validate → import
- Error report for failed rows
- Fields: all mandatory employee fields
- Maps to existing teams/departments by name

### Employee Lifecycle

| Status       | Meaning                               |
| ------------ | ------------------------------------- |
| ACTIVE       | Working normally                      |
| ON_PROBATION | Within probation period               |
| ON_NOTICE    | Submitted resignation, serving notice |
| ON_LOA       | Long leave of absence (unpaid)        |
| TERMINATED   | Involuntary exit                      |
| RESIGNED     | Completed notice, left                |

Transitions:

- Join → ON_PROBATION (if probation configured) → ACTIVE
- Resignation → ON_NOTICE → RESIGNED
- Dismissal → TERMINATED

---

## Organisation Structure

### Departments

- Create department hierarchy (nested)
- Assign department head
- View all employees in department
- Department-level leave policies (via teams or standalone)

### Designations

- Define levels (1–10 numeric, or custom labels)
- Used in offer letters, org chart, reporting filters
- Map to salary bands (future)

### Org Chart

- Visual tree of org structure
- Clickable employee cards
- Export as image
- Filter by department

### Teams (Existing — enhanced)

- Team now linked to department
- Work week and timezone per team
- Leave notification preferences per team

---

## Role & Permissions

### Roles

| Role    | Access                          |
| ------- | ------------------------------- |
| OWNER   | All data, billing, org settings |
| ADMIN   | All data except billing         |
| MANAGER | Own team's data + reports       |
| USER    | Own data only                   |

### Custom Permissions (Phase 2)

- Create custom roles with granular permissions per module
- Useful for: "HR Executive" (can edit all employees but not payroll)

---

## Custom Fields

- Admin defines extra fields on employees
- Types: text, number, date, select (dropdown), checkbox
- Visibility: ORG (all), MANAGER+, OWNER only
- Required or optional
- Shown in employee profile and edit forms
- Included in CSV export

---

## Self-Service

Employees can update:

- Profile photo
- Address and pincode
- Phone number
- Bank account details (with re-verification trigger)
- Emergency contact
- Tax declaration (for payroll)

Cannot update (requires HR):

- Date of joining
- Employee code
- Department / designation / reporting manager
- PAN / Aadhaar

---

## Audit Trail

Every change to employee data logs:

- Who changed it
- What changed (before → after)
- When
- Source (web, whatsapp, api)

Stored in ActivityLog (existing table, extended).

---

## UI/UX Notes

- Employee profile is a single-page layout with tabs: Overview, Attendance, Leaves, Payroll, Documents, Performance
- Edit inline where possible (click field → edit → save)
- Hindi labels available for all fields
- Mobile-responsive (manager needs to look up employee on phone)

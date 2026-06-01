# Feature: Documents

---

## Employee Document Vault

Every employee has a personal document vault. Think of it as their digital HR file.

### Document Categories
| Category | Examples | Who Uploads |
|----------|---------|------------|
| ID Proof | Aadhaar, PAN, Passport, Voter ID | Employee |
| Address Proof | Utility bill, Rental agreement | Employee |
| Educational | Degree, Diploma, Marksheets | Employee |
| Employment | Offer letter, Appointment letter, Contracts | HR |
| Tax | Form 16, IT returns, Tax declarations | HR + Employee |
| Statutory | PF, ESI documents | HR |
| Other | Training certificates, Awards | HR or Employee |

### Access Control
- Employee: see own documents
- Manager: see their direct reports' non-confidential documents
- HR/Admin: see all
- Confidential flag: OWNER/ADMIN only

### Storage
- Files stored in Cloudflare R2
- Accessed via signed URLs (expire after 1 hour)
- Never public
- Max file size: 10 MB per document
- Accepted formats: PDF, JPG, PNG, DOCX

### Document Expiry
- Set expiry date on documents (visa, contract, certification)
- Alert HR 30 days before expiry
- Alert HR again at 7 days
- Expired documents shown in red on employee profile

---

## Document Templates

HR builds reusable templates with merge fields.

### Supported Template Types
- Offer Letter
- Appointment / Joining Letter
- Confirmation Letter (after probation)
- Experience / Relieving Letter
- Salary Certificate / Salary Slip Letter
- NOC (No Objection Certificate)
- Warning Letter
- Termination Letter
- Custom (any type)

### Template Engine
- HTML + merge fields: `{{employee.name}}`, `{{employee.designation}}`, `{{org.name}}`, `{{salary.basic}}`, etc.
- WYSIWYG editor in web UI
- Preview with real employee data before generating
- Hindi text support

### Document Generation
- Select template + employee(s)
- Bulk generate for multiple employees
- Output: PDF stored in R2
- Auto-added to employee's document vault
- Send via WhatsApp or email

### E-Signature
- MVP: Aadhaar-based e-sign (via DigiLocker / Aadhaar XML) — legally valid in India
- Simple: employee receives document link → signs by clicking + OTP confirmation
- Signed PDF stored with digital signature metadata
- For self-hosted installs: simple click-sign acknowledgement

---

## Organisation Policy Library

Separate from employee documents — company-wide documents.

- Upload: HR Policy, Code of Conduct, Leave Policy Document, Safety Manual, etc.
- Version control (new upload = new version, old archived)
- Employee acknowledgement:
  - Employee sees policy in self-service portal
  - Clicks "I have read and understood this policy"
  - HR can see who acknowledged and who hasn't
  - Send reminder to unacknowledged employees

---

## Compliance Register

For Indian statutory compliance, companies need to maintain registers:

- **Muster Roll** (attendance register) — exportable from attendance module
- **Leave Register** — exportable from leave module
- **Wage Register** — exportable from payroll module
- **Form B** (Shops & Establishments) — generated from employee data

These are often inspected during labour department visits.

---

## Search & Retrieval
- Search documents by employee name, category, date range
- HR can find "all employees with contracts expiring this quarter"
- Bulk download as ZIP

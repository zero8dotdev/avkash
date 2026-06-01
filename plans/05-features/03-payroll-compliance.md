# Feature: Payroll & Statutory Compliance

This is the highest-value feature for Indian SMEs. Getting this right is what makes companies pay.

---

## Salary Structure

### Component Types
| Type | Example | How Calculated |
|------|---------|----------------|
| FIXED | Basic | Fixed amount per month |
| PCT_OF_GROSS | HRA (40% of gross) | % of total gross |
| PCT_OF_BASIC | Special Allowance (20% of basic) | % of basic |
| REIMBURSEMENT | Phone allowance | Fixed, non-taxable |
| VARIABLE | Performance bonus | Manual input per run |

### Pre-built Templates
- **Manufacturing Worker**: Basic (60%), HRA (20%), Conveyance (₹1,600), Special (rest)
- **Office Staff**: Basic (40%), HRA (40%), Conveyance, Medical (₹1,250), Special
- **Management**: CTC-based, flexible components

### Salary Assignment
- Assign structure to employee with CTC amount
- System resolves all component amounts
- Effective date (for mid-year revisions)
- Full revision history
- Arrears calculated if revision backdated

---

## Payroll Run Flow

```
1. HR initiates payroll run for Month/Year
2. System auto-populates:
   - Working days from org calendar
   - Paid days per employee (working days - LOP days)
   - LOP days from unpaid absences + unapproved leaves
   - Overtime amounts
   - Approved reimbursements
3. HR reviews → edits (override any value)
4. Run calculations (statutory deductions auto-computed)
5. Preview payslips
6. Finalize (locks attendance + leave for that month)
7. Generate all payslips as PDFs
8. Deliver: WhatsApp / email / both
9. Mark as Paid (after bank transfer)
```

### Gross-to-Net Calculation Engine

```
Gross = sum(all earnings)

PF (Employee) = min(Basic, PF_wage_ceiling) × 12%
PF (Employer) = min(Basic, PF_wage_ceiling) × 12%  [shown for employer's record]

ESI (Employee) = Gross × 0.75%  [if Gross ≤ ₹21,000]
ESI (Employer) = Gross × 3.25%  [shown for employer's record]

Professional Tax = state slab lookup by gross

TDS = (annual_taxable_income - exemptions - deductions) × slab_rate / 12

Net Payable = Gross - PF(emp) - ESI(emp) - PT - TDS - other_deductions
```

---

## Statutory Compliance (India)

### Provident Fund (PF / EPF)
- Employee contribution: 12% of basic (capped at ₹15,000 basic)
- Employer contribution: 12% (EPF 3.67% + EPS 8.33%)
- Admin charges: 0.5% (EDLI 0.5%)
- **ECR File generation** — upload directly to EPFO Unified Portal
- Monthly PF challan amount calculation
- Employee UAN management

### Employee State Insurance (ESI)
- Applicable if gross ≤ ₹21,000/month
- Employee: 0.75%, Employer: 3.25%
- **ESI Return file generation** (half-yearly)
- IP registration tracking

### Professional Tax (PT)
State-wise slab support:
| State | Slab (monthly) |
|-------|---------------|
| Maharashtra | ≤7,500: ₹0 / ≤10,000: ₹175 / >10,000: ₹200 |
| Karnataka | ≤15,000: ₹0 / ≤20,000: ₹150 / >20,000: ₹200 |
| West Bengal | ≤10,000: ₹0 / ≤15,000: ₹110 / >15,000: ₹130 |
| ... (all 10 PT states) | ... |

### TDS / Income Tax
- Old regime vs new regime per employee
- Tax declaration from employee (section 80C, HRA, LTA, etc.)
- Monthly TDS deduction spread evenly across year
- Adjust in later months based on actual proof submission
- **Form 16 Part A + B generation** (FY end)
- Form 24Q data export

### Gratuity
- Eligible after 5 years of continuous service
- Formula: (Last drawn basic / 26) × 15 × years of service
- Track gratuity liability per employee
- Show in FnF settlement

### Labour Welfare Fund (LWF)
- State-specific (Maharashtra, Karnataka, etc.)
- Half-yearly / annual deduction
- Employer + employee contribution

---

## Payslip

### Content
- Company logo + name + address + GSTIN
- Employee: name, code, designation, department
- Month/year, working days, paid days, LOP days
- Earnings table: component → amount
- Deductions table: PF, ESI, PT, TDS, other
- Gross / Total Deductions / Net Pay
- YTD (year-to-date) totals
- PF number, UAN, ESI IP number

### Delivery
- PDF stored in Cloudflare R2
- WhatsApp: "Here is your payslip for [Month YYYY]: [link]"
- Email with PDF attachment
- Employee can download anytime from self-service portal

### Format
- A4, print-friendly
- Hindi and English supported (configurable per org)
- Custom logo and colors (org branding)

---

## Reimbursements
- Employee submits claim: category, amount, bill date, description, photo of bill
- Manager approves
- Approved claims added to next payroll run automatically
- Taxable / non-taxable flag per category
- Annual cap per category (configurable)

---

## Tally Integration

Many Indian SME accountants use Tally ERP / Tally Prime. After payroll finalization:

**Export: Salary Journal Entry (Tally XML)**
```
Dr. Salary A/c (Gross)
  Cr. PF Payable A/c
  Cr. ESI Payable A/c
  Cr. PT Payable A/c
  Cr. TDS Payable A/c
  Cr. Salary Payable A/c (Net)
```

Import this XML directly into Tally with one click.

Also export:
- PF liability journal
- ESI liability journal
- Department-wise cost allocation

---

## Bank Transfer File
After payroll finalization, generate bank file for bulk salary transfer:

| Bank | Format |
|------|--------|
| HDFC | NetBanking bulk upload (CSV) |
| ICICI | CorpBanking format |
| SBI | SFTP/CINB format |
| Axis | Bulk payment CSV |
| Any bank | NEFT/RTGS format |

File contains: employee name, account number, IFSC, amount, narration (Salary Month Year).

---

## Full & Final Settlement (FnF)
On employee exit:

1. Calculate earned salary for last month (pro-rated to last working day)
2. Leave encashment (remaining balance × daily rate)
3. Gratuity (if eligible)
4. Bonus proration (if applicable)
5. Deduct: Outstanding advances, notice period shortfall
6. Generate FnF payslip
7. Get PF withdrawal paperwork

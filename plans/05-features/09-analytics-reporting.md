# Feature: Analytics & Reporting

Reports are the primary reason owners log in. "Who's absent? What's my payroll cost? Who hasn't completed onboarding?" — these 3 questions drive 80% of owner logins.

---

## Owner Dashboard

First thing an owner sees when they log in.

### Today's Snapshot
- Headcount: Total employees / Active / On leave today
- Attendance today: Present / Absent / Late / WFH
- Pending approvals: Leave requests, Reimbursements, Regularizations
- Upcoming: Probations ending this month, Contract renewals, Document expiries

### Monthly KPIs
- Payroll cost (current month vs last month trend)
- Attrition this month
- New joiners this month
- Average attendance %

---

## Manager Dashboard

- Team attendance today (grid: who's in, who's out)
- Leave calendar (team view)
- Pending approvals (leave, attendance regularization)
- Goal progress summary for team
- Probation review alerts

---

## Employee Dashboard

- My attendance this month (calendar)
- Leave balance summary
- Upcoming holidays
- Pending tasks (onboarding, policy acknowledgements)
- Pay day countdown + last payslip

---

## Standard Reports

All reports: filterable by date range, department, team, designation, employment type.
All reports: exportable as Excel / PDF / CSV.

### HR Reports
| Report | Key Metrics |
|--------|------------|
| Headcount Report | Total by dept/designation/type, new joiners, exits |
| Attrition Report | Exits by month, reason, tenure, department |
| Birthday & Anniversary | This week/month, for engagement |
| Probation Tracker | Due dates, overdue reviews |
| Document Expiry | Expiring in 30/60/90 days |

### Attendance Reports
| Report | Key Metrics |
|--------|------------|
| Daily Attendance | Per employee for selected date |
| Monthly Sheet | Full grid (employee × date) — printable |
| Late Arrivals | Frequency per employee |
| Absenteeism | Days absent %, trend by month |
| Overtime Report | Hours + cost by employee |
| Regularization Log | Who regularized what |

### Leave Reports
| Report | Key Metrics |
|--------|------------|
| Leave Balance | All employees, all types, remaining days |
| Leave Utilization | Used vs allocated, by month/quarter |
| Leave Encashment | This year |
| Pending Leaves | All pending approval, by manager |

### Payroll Reports
| Report | Key Metrics |
|--------|------------|
| Payroll Summary | Month-wise gross, net, deductions |
| Department Cost | Payroll cost breakdown by department |
| PF Register | All PF contributions, ECR-ready |
| ESI Register | All ESI contributions |
| TDS Summary | Monthly TDS per employee |
| Salary Register | All employees × month (statutory format) |
| Bank Transfer List | Net payable per employee + bank details |

### Compliance Reports
| Report | Key Metrics |
|--------|------------|
| PF ECR File | EPFO upload format |
| ESI Return | Half-yearly |
| Form 16 | Per employee, FY |
| PT Register | State-wise |
| Muster Roll | Statutory attendance register |
| Wage Register | Statutory wage register |

---

## Custom Report Builder (Phase 2)

- Drag-and-drop field selector
- Choose entity: Employee, Leave, Attendance, Payroll
- Add filters (dynamic)
- Group by (department, team, month, etc.)
- Save report as template
- Schedule: email weekly/monthly to HR

---

## Visualizations

Simple charts only (not complex BI):
- Attendance % trend by month (line chart)
- Headcount by department (bar chart)
- Leave type distribution (pie chart)
- Payroll cost by department (bar chart)
- Attrition trend (line chart)

Technology: Recharts (already React-compatible) or Ant Design Charts.

---

## Exports

- Excel (.xlsx): formatted with headers, filters ready
- PDF: print-ready statutory registers
- CSV: for import into other tools (Tally, accounting)
- Scheduled email exports (Phase 2)

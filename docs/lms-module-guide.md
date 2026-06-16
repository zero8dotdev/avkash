# LMS Module Guide

This guide explains how to think about building a Learning Management System module for Avkash.

The goal is not to show every line of code. The goal is to show how a real module works with the core:

- It understands core people and org data.
- It reacts to system-of-record events.
- It owns LMS-specific records.
- It contributes routes, jobs, subscribers, permissions, and employee profile sections.
- It can be open or private without changing the core.

---

## Product Example

Build an LMS for mandatory company training.

Common use cases:

- New hires must complete onboarding training.
- Factory workers must complete safety training.
- Managers must complete POSH or compliance training.
- Employees in a location must complete site-specific training.
- Expired certifications must trigger re-enrollment.
- HR needs reports for completion, overdue training, and audit history.

The LMS should feel native to Avkash, but it should not be hard-coded into the core.

---

## What Core Owns

The core is the system of record for HR facts.

The LMS should read these facts, but not own them:

- Organisation
- Employee
- User
- Team
- Department
- Business unit
- Location
- Org level
- Employment status
- Join date
- Transfers
- Role changes

The LMS should not create its own copy of "employee truth".

It can store LMS records that point to core records.

Examples:

- `course.orgId` points to the organisation.
- `enrollment.userId` points to the employee/user.
- `assignmentRule.locationId` points to a core location.
- `assignmentRule.departmentId` points to a core department.

---

## What LMS Owns

The LMS owns learning-specific data.

Examples:

- Course
- Course version
- Training material
- Quiz
- Enrollment
- Completion
- Certificate
- Assignment rule
- Due date
- Reminder state
- Audit log for LMS actions

This is module-owned data.

Core should not know the shape of these tables.

---

## The Main Flow

For mandatory training, the basic flow is:

```text
Core employee fact changes
  -> core emits domain event
  -> LMS subscriber receives event
  -> LMS evaluates assignment rules
  -> LMS creates or updates enrollments
  -> LMS emits LMS events
  -> notifications / reports / profile contributors react
```

Example:

```text
employee joined
  -> employee.created / employee.changed event
  -> LMS checks mandatory onboarding courses
  -> LMS enrolls employee
  -> LMS emits lms.enrollment.created
  -> notification module sends training email
```

---

## Module Manifest

The module declares what it contributes.

Example shape using the current Avkash manifest:

```ts
export const lmsModule: AvkashModule<Hono<PlatformEnv>> = {
  key: 'lms',
  title: 'Learning Management',
  entitlement: 'lms',
  dependsOn: ['org', 'users'],

  routes: (app) => {
    app.route('/lms/courses', courses);
    app.route('/lms/enrollments', enrollments);
    app.route('/lms/reports', reports);
  },

  subscribers: [
    enrollNewEmployeeInMandatoryCourses,
    reevaluateTrainingAfterTransfer,
    reevaluateTrainingAfterRoleChange,
  ],

  jobs: [sendTrainingReminders, markOverdueEnrollments, expireOldCertificates],

  profileContributors: [employeeTrainingProfileSection],

  authzModel: lmsAuthzModel,
  fieldGroups: lmsFieldGroups,
  i18n: lmsMessages,
};
```

Adding the module to a product should be one composition change:

```ts
createApp([...OPEN_MODULES, lmsModule]);
```

In Avkash Cloud, the LMS could live in the private repo. In the public product, it could live in the open repo. The shape is the same.

---

## Events LMS Should Listen To

The LMS should react to core events instead of polling core tables blindly.

Useful event categories:

| Core event type         | Why LMS cares                                                           |
| ----------------------- | ----------------------------------------------------------------------- |
| Employee joined         | Enroll in onboarding or mandatory base training                         |
| Employee transferred    | Recalculate department, location, business-unit, or role-based training |
| Team membership changed | Assign team-specific training                                           |
| Department changed      | Assign department-specific training                                     |
| Business unit changed   | Assign BU-specific training                                             |
| Org level changed       | Assign manager or seniority-specific training                           |
| Role changed            | Assign role-sensitive training                                          |
| Delegation created      | Allow delegate to approve training tasks if LMS supports approvals      |
| Employee deactivated    | Pause reminders or close open training tasks                            |

The handler should be idempotent.

Events are delivered at least once. The same event can be processed twice.

Use stable uniqueness rules:

- One active enrollment per `orgId + courseId + userId`.
- One subscriber processing record per `event.id + subscriber.key`, if needed.
- One certificate per `orgId + courseVersionId + userId`, if course versions matter.

---

## Events LMS Should Emit

The LMS should emit its own facts.

Examples:

- `lms.course.published`
- `lms.enrollment.created`
- `lms.enrollment.completed`
- `lms.enrollment.overdue`
- `lms.certificate.issued`
- `lms.certificate.expired`

Other modules can react to these.

Examples:

- Notifications sends reminders and completion emails.
- Analytics builds completion dashboards.
- Compliance consumes certificate status for statutory readiness.
- Performance records completion of manager training.

The LMS becomes a first-class source of facts without becoming part of core.

---

## Assignment Rules

Mandatory training usually needs rules.

Examples:

- Everyone must complete "Code of Conduct".
- All new hires must complete onboarding within 7 days.
- All factory workers in a location must complete safety training.
- All managers must complete manager training.
- All night-shift employees must complete night-shift safety training.
- All employees in a department must complete department SOP training.

Model these as LMS-owned assignment rules.

Example fields:

- `orgId`
- `courseId`
- `appliesToAll`
- `departmentId`
- `businessUnitId`
- `locationId`
- `orgLevelId`
- `role`
- `dueInDays`
- `recurrence`
- `active`

The rule references core entities, but the rule itself belongs to LMS.

---

## Event Handler Example

When an employee joins:

```text
1. Receive employee joined event.
2. Read current employee profile from core.
3. Find active LMS assignment rules for the employee's org.
4. Match rules against employee facts.
5. Create missing enrollments.
6. Skip enrollments that already exist.
7. Emit lms.enrollment.created for each new enrollment.
```

Important details:

- Do not trust stale event payloads for final decisions.
- Use the event as a trigger.
- Re-read current core state before assigning training.
- Make writes idempotent.
- Keep all LMS writes scoped by `orgId`.

---

## Profile Contribution

The LMS can add a section to the employee profile without core importing LMS.

Example profile section:

```text
Employee Profile
  - Core details
  - Team and department
  - Leave summary
  - Attendance summary
  - Training summary   <- contributed by LMS
```

The LMS profile contributor can return:

- Required courses
- Completed courses
- Overdue courses
- Certificates
- Upcoming expiries

If the org does not have the `lms` entitlement, this section is absent.

---

## Routes

The LMS should expose its own API surface.

Example routes:

```text
GET    /lms/courses
POST   /lms/courses
PATCH  /lms/courses/:id
POST   /lms/courses/:id/publish

GET    /lms/enrollments
POST   /lms/enrollments
PATCH  /lms/enrollments/:id/complete

GET    /lms/reports/completion
GET    /lms/reports/overdue
```

Routes should follow the same rules as core routes:

- Auth context first.
- `orgId` scoped reads and writes.
- Entitlement-gated module.
- Role checks for admin actions.
- Stable DTOs.
- Domain errors, not raw database errors.

---

## Jobs

The LMS will need background jobs.

Examples:

- Send reminders for training due soon.
- Mark training as overdue.
- Expire certificates.
- Re-enroll employees for recurring training.
- Produce scheduled compliance snapshots.

Jobs should be entitlement-aware.

If an organisation does not have LMS enabled, LMS jobs should not process it.

---

## Access Control

The LMS should contribute its own authorization model and field groups.

Example permissions:

- HR admin can create courses.
- HR admin can assign training.
- Manager can view team training status.
- Employee can view and complete their own courses.
- Compliance officer can view compliance training reports.

Example field groups:

- Course metadata
- Enrollment status
- Quiz score
- Certificate details
- Compliance-sensitive training status

The goal is the same as the rest of Avkash:

- Sensitive employee data is explicit.
- Visibility is policy-controlled.
- Modules do not bypass field access rules.

---

## Data Ownership Rules

For an LMS module, use these boundaries:

| Data                       | Owner                   |
| -------------------------- | ----------------------- |
| Employee identity          | Core                    |
| Team, department, location | Core                    |
| Employment status          | Core                    |
| Course                     | LMS                     |
| Assignment rule            | LMS                     |
| Enrollment                 | LMS                     |
| Completion                 | LMS                     |
| Certificate                | LMS                     |
| Training report            | LMS or analytics module |
| Compliance interpretation  | Compliance module       |

This keeps the system clean.

The LMS uses core facts, but it does not become the owner of those facts.

---

## Common Mistakes

Avoid these:

- Copying employee data into LMS tables as a second source of truth.
- Polling all employees every minute instead of reacting to domain events.
- Writing LMS-specific columns into core employee tables.
- Letting core import the LMS package.
- Making event handlers non-idempotent.
- Assigning training from stale event payloads without reading current state.
- Forgetting `orgId` on LMS tables or queries.
- Building private LMS assumptions into the public core.

---

## End State

When done well, the LMS feels native:

- Employee joins, LMS assigns onboarding automatically.
- Employee transfers, LMS recalculates required training.
- Manager opens a team view, LMS contributes training status.
- HR publishes a mandatory course, LMS enrolls matching employees.
- Notifications sends reminders.
- Compliance or analytics consumes LMS completion facts.
- Avkash core stays clean.

That is the Avkash plugin model in practice.

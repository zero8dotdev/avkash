# 04 — Database Design

All tables in PostgreSQL. Managed via Drizzle ORM migrations.
Existing tables are noted. New tables are marked **[NEW]**.

---

## Enums (Existing + New)

```sql
-- Existing
CREATE TYPE "Visibility" AS ENUM('ORG', 'TEAM', 'SELF');
CREATE TYPE "Role" AS ENUM('OWNER', 'MANAGER', 'USER', 'ANON', 'ADMIN');
CREATE TYPE "LeaveStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'DELETED');
CREATE TYPE "LeaveDuration" AS ENUM('FULL_DAY', 'HALF_DAY');
CREATE TYPE "Shift" AS ENUM('MORNING', 'AFTERNOON', 'NONE');
CREATE TYPE "AccuralFrequencyOptions" AS ENUM('MONTHLY', 'QUARTERLY');
CREATE TYPE "DaysOfWeek" AS ENUM('SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY');

-- New
CREATE TYPE "EmploymentType" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN', 'DAILY_WAGE', 'PROBATION');
CREATE TYPE "EmployeeStatus" AS ENUM('ACTIVE', 'ON_PROBATION', 'ON_NOTICE', 'ON_LOA', 'TERMINATED', 'RESIGNED');
CREATE TYPE "AttendanceStatus" AS ENUM('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF', 'WFH');
CREATE TYPE "PayrollStatus" AS ENUM('DRAFT', 'PROCESSING', 'FINALIZED', 'PAID');
CREATE TYPE "DocumentStatus" AS ENUM('PENDING_SIGN', 'SIGNED', 'EXPIRED', 'ARCHIVED');
CREATE TYPE "ApplicationStage" AS ENUM('APPLIED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED','WITHDRAWN');
CREATE TYPE "GoalStatus" AS ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ReviewStatus" AS ENUM('NOT_STARTED', 'SELF_REVIEW', 'MANAGER_REVIEW', 'COMPLETED');
CREATE TYPE "ClaimStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAID');
CREATE TYPE "TaxRegime" AS ENUM('OLD', 'NEW');
CREATE TYPE "BiometricEventType" AS ENUM('CHECK_IN', 'CHECK_OUT', 'BREAK_IN', 'BREAK_OUT');
```

---

## Module 1: Core HR

### Organisation (Existing — extend)

```sql
ALTER TABLE "Organisation" ADD COLUMN "gstin" VARCHAR(15);
ALTER TABLE "Organisation" ADD COLUMN "pan" VARCHAR(10);
ALTER TABLE "Organisation" ADD COLUMN "addressLine1" TEXT;
ALTER TABLE "Organisation" ADD COLUMN "addressLine2" TEXT;
ALTER TABLE "Organisation" ADD COLUMN "city" VARCHAR(100);
ALTER TABLE "Organisation" ADD COLUMN "state" VARCHAR(100);
ALTER TABLE "Organisation" ADD COLUMN "pincode" VARCHAR(6);
ALTER TABLE "Organisation" ADD COLUMN "pfRegistrationNo" VARCHAR(30);
ALTER TABLE "Organisation" ADD COLUMN "esiRegistrationNo" VARCHAR(30);
ALTER TABLE "Organisation" ADD COLUMN "defaultLanguage" VARCHAR(5) DEFAULT 'en';
ALTER TABLE "Organisation" ADD COLUMN "financialYearStart" VARCHAR(5) DEFAULT '04-01';
```

### Department [NEW]

```sql
CREATE TABLE "Department" (
  "deptId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"      UUID NOT NULL REFERENCES "Organisation"("orgId") ON DELETE CASCADE,
  "name"       VARCHAR(100) NOT NULL,
  "parentDeptId" UUID REFERENCES "Department"("deptId"),  -- for hierarchy
  "headUserId" UUID,  -- FK to User added after User table
  "createdAt"  TIMESTAMPTZ DEFAULT now(),
  UNIQUE("orgId", "name")
);
```

### Designation [NEW]

```sql
CREATE TABLE "Designation" (
  "designationId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"         UUID NOT NULL REFERENCES "Organisation"("orgId") ON DELETE CASCADE,
  "name"          VARCHAR(100) NOT NULL,
  "level"         INT DEFAULT 1,  -- 1=junior, 5=senior, 10=director, etc.
  UNIQUE("orgId", "name")
);
```

### User (Existing — extend significantly)

```sql
ALTER TABLE "User" ADD COLUMN "employeeCode"   VARCHAR(50);   -- EMP001
ALTER TABLE "User" ADD COLUMN "deptId"         UUID REFERENCES "Department"("deptId");
ALTER TABLE "User" ADD COLUMN "designationId"  UUID REFERENCES "Designation"("designationId");
ALTER TABLE "User" ADD COLUMN "employmentType" "EmploymentType" DEFAULT 'FULL_TIME';
ALTER TABLE "User" ADD COLUMN "status"         "EmployeeStatus" DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "reportingManagerId" UUID REFERENCES "User"("userId");
ALTER TABLE "User" ADD COLUMN "dateOfBirth"    DATE;
ALTER TABLE "User" ADD COLUMN "gender"         VARCHAR(20);
ALTER TABLE "User" ADD COLUMN "phone"          VARCHAR(15);
ALTER TABLE "User" ADD COLUMN "addressLine1"   TEXT;
ALTER TABLE "User" ADD COLUMN "city"           VARCHAR(100);
ALTER TABLE "User" ADD COLUMN "state"          VARCHAR(100);
ALTER TABLE "User" ADD COLUMN "pincode"        VARCHAR(6);
ALTER TABLE "User" ADD COLUMN "dateOfJoining"  DATE;
ALTER TABLE "User" ADD COLUMN "dateOfLeaving"  DATE;
ALTER TABLE "User" ADD COLUMN "probationEndDate" DATE;
ALTER TABLE "User" ADD COLUMN "noticePeriodDays" INT DEFAULT 30;
ALTER TABLE "User" ADD COLUMN "panEncrypted"   TEXT;  -- AES-256 encrypted
ALTER TABLE "User" ADD COLUMN "aadhaarEncrypted" TEXT; -- last 4 digits visible
ALTER TABLE "User" ADD COLUMN "bankAccountEncrypted" TEXT;
ALTER TABLE "User" ADD COLUMN "bankIFSC"       VARCHAR(11);
ALTER TABLE "User" ADD COLUMN "bankName"       VARCHAR(100);
ALTER TABLE "User" ADD COLUMN "pfAccountNo"    VARCHAR(30);
ALTER TABLE "User" ADD COLUMN "esiNo"          VARCHAR(20);
ALTER TABLE "User" ADD COLUMN "customFields"   JSONB DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN "emergencyContact" JSONB;
  -- { name, phone, relationship }
```

### CustomField [NEW]

```sql
CREATE TABLE "CustomField" (
  "fieldId"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"     UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "entityType" VARCHAR(50) NOT NULL,  -- 'USER', 'LEAVE', 'DOCUMENT'
  "fieldKey"  VARCHAR(100) NOT NULL,
  "fieldLabel" VARCHAR(100) NOT NULL,
  "fieldType" VARCHAR(30) NOT NULL,   -- 'text', 'number', 'date', 'select', 'checkbox'
  "options"   JSONB,                  -- for select type
  "required"  BOOLEAN DEFAULT false,
  "visible"   "Visibility" DEFAULT 'ORG',
  "sortOrder" INT DEFAULT 0,
  UNIQUE("orgId", "entityType", "fieldKey")
);
```

---

## Module 2: Leave & Attendance

### Leave (Existing — extend)

```sql
ALTER TABLE "Leave" ADD COLUMN "wfhFlag"          BOOLEAN DEFAULT false;
ALTER TABLE "Leave" ADD COLUMN "compOffEarnedFrom" UUID REFERENCES "Leave"("leaveId");
ALTER TABLE "Leave" ADD COLUMN "delegatedApproverId" UUID REFERENCES "User"("userId");
```

### LeaveCarryForward [NEW]

```sql
CREATE TABLE "LeaveCarryForward" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"       UUID NOT NULL REFERENCES "User"("userId"),
  "leaveTypeId"  UUID NOT NULL REFERENCES "LeaveType"("leaveTypeId"),
  "orgId"        UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "yearFrom"     INT NOT NULL,
  "yearTo"       INT NOT NULL,
  "daysCarried"  DECIMAL(5,2) NOT NULL,
  "expiresOn"    DATE,
  "createdAt"    TIMESTAMPTZ DEFAULT now()
);
```

### Shift [NEW]

```sql
CREATE TABLE "ShiftDefinition" (
  "shiftId"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"     UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "name"      VARCHAR(100) NOT NULL,
  "startTime" TIME NOT NULL,
  "endTime"   TIME NOT NULL,
  "crossesMidnight" BOOLEAN DEFAULT false,
  "graceMins" INT DEFAULT 10,    -- late arrival grace
  "color"     VARCHAR(7),
  UNIQUE("orgId", "name")
);

CREATE TABLE "ShiftAssignment" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"     UUID NOT NULL REFERENCES "User"("userId"),
  "shiftId"    UUID NOT NULL REFERENCES "ShiftDefinition"("shiftId"),
  "effectiveFrom" DATE NOT NULL,
  "effectiveTo"   DATE,
  "createdAt"  TIMESTAMPTZ DEFAULT now()
);
```

### AttendanceRecord [NEW]

```sql
CREATE TABLE "AttendanceRecord" (
  "recordId"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"         UUID NOT NULL REFERENCES "User"("userId"),
  "orgId"          UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "date"           DATE NOT NULL,
  "status"         "AttendanceStatus" NOT NULL,
  "checkInTime"    TIMESTAMPTZ,
  "checkOutTime"   TIMESTAMPTZ,
  "workingMins"    INT,
  "overtimeMins"   INT DEFAULT 0,
  "source"         VARCHAR(30) DEFAULT 'MANUAL',  -- MANUAL, BIOMETRIC, WHATSAPP, MOBILE
  "isRegularized"  BOOLEAN DEFAULT false,
  "regularizationReason" TEXT,
  "regularizationApprovedBy" UUID REFERENCES "User"("userId"),
  "createdAt"      TIMESTAMPTZ DEFAULT now(),
  UNIQUE("userId", "date")
);
CREATE INDEX ON "AttendanceRecord"("orgId", "date");
CREATE INDEX ON "AttendanceRecord"("userId", "date");
```

### BiometricDevice [NEW]

```sql
CREATE TABLE "BiometricDevice" (
  "deviceId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"       UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "name"        VARCHAR(100) NOT NULL,
  "vendor"      VARCHAR(50),   -- ZKTECO, HID, HIKVISION
  "serialNo"    VARCHAR(100),
  "locationId"  UUID,          -- FK to future Location table
  "apiEndpoint" TEXT,
  "apiKey"      TEXT,          -- encrypted
  "lastSyncAt"  TIMESTAMPTZ,
  "isActive"    BOOLEAN DEFAULT true
);

CREATE TABLE "BiometricEvent" (
  "eventId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviceId"    UUID NOT NULL REFERENCES "BiometricDevice"("deviceId"),
  "userId"      UUID REFERENCES "User"("userId"),
  "orgId"       UUID NOT NULL,
  "rawUserId"   VARCHAR(50),   -- device-side user ID before mapping
  "eventType"   "BiometricEventType" NOT NULL,
  "eventTime"   TIMESTAMPTZ NOT NULL,
  "isProcessed" BOOLEAN DEFAULT false,
  "createdAt"   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON "BiometricEvent"("isProcessed", "createdAt");
```

---

## Module 3: Payroll & Compliance

### SalaryStructure [NEW]

```sql
CREATE TABLE "SalaryStructure" (
  "structureId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"       UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "name"        VARCHAR(100) NOT NULL,  -- e.g. "Grade A - Manufacturing"
  "components"  JSONB NOT NULL,
  -- [{
  --   key: "basic", label: "Basic", type: "FIXED|PCT_OF_GROSS|PCT_OF_BASIC",
  --   value: 40, taxable: true, pfApplicable: true
  -- }, ...]
  "isDefault"   BOOLEAN DEFAULT false,
  "createdAt"   TIMESTAMPTZ DEFAULT now()
);
```

### EmployeeSalary [NEW]

```sql
CREATE TABLE "EmployeeSalary" (
  "salaryId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"       UUID NOT NULL REFERENCES "User"("userId"),
  "orgId"        UUID NOT NULL,
  "structureId"  UUID REFERENCES "SalaryStructure"("structureId"),
  "ctcAnnual"    DECIMAL(12,2) NOT NULL,
  "effectiveFrom" DATE NOT NULL,
  "effectiveTo"  DATE,
  "components"   JSONB NOT NULL,  -- resolved amounts at time of assignment
  "taxRegime"    "TaxRegime" DEFAULT 'NEW',
  "createdBy"    UUID REFERENCES "User"("userId"),
  "createdAt"    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON "EmployeeSalary"("userId", "effectiveFrom");
```

### PayrollRun [NEW]

```sql
CREATE TABLE "PayrollRun" (
  "runId"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"       UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "month"       INT NOT NULL,   -- 1-12
  "year"        INT NOT NULL,
  "status"      "PayrollStatus" DEFAULT 'DRAFT',
  "totalGross"  DECIMAL(14,2),
  "totalNet"    DECIMAL(14,2),
  "totalPF"     DECIMAL(12,2),
  "totalESI"    DECIMAL(12,2),
  "totalTDS"    DECIMAL(12,2),
  "runBy"       UUID REFERENCES "User"("userId"),
  "finalizedAt" TIMESTAMPTZ,
  "paidAt"      TIMESTAMPTZ,
  "notes"       TEXT,
  "createdAt"   TIMESTAMPTZ DEFAULT now(),
  UNIQUE("orgId", "month", "year")
);
```

### Payslip [NEW]

```sql
CREATE TABLE "Payslip" (
  "payslipId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "runId"        UUID NOT NULL REFERENCES "PayrollRun"("runId"),
  "userId"       UUID NOT NULL REFERENCES "User"("userId"),
  "orgId"        UUID NOT NULL,
  "month"        INT NOT NULL,
  "year"         INT NOT NULL,
  "workingDays"  INT NOT NULL,
  "paidDays"     DECIMAL(5,2) NOT NULL,
  "lopDays"      DECIMAL(5,2) DEFAULT 0,   -- Loss of Pay
  "earnings"     JSONB NOT NULL,            -- {basic: 20000, hra: 8000, ...}
  "deductions"   JSONB NOT NULL,            -- {pf: 2400, esi: 315, tds: 1200, ...}
  "grossEarnings" DECIMAL(12,2) NOT NULL,
  "totalDeductions" DECIMAL(12,2) NOT NULL,
  "netPayable"   DECIMAL(12,2) NOT NULL,
  "pdfUrl"       TEXT,                      -- R2 signed path
  "deliveredVia" JSONB,                     -- {whatsapp: true, email: true}
  "createdAt"    TIMESTAMPTZ DEFAULT now(),
  UNIQUE("runId", "userId")
);
```

### StatutoryConfig [NEW]

```sql
CREATE TABLE "StatutoryConfig" (
  "configId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"       UUID NOT NULL REFERENCES "Organisation"("orgId") UNIQUE,
  "pfEnabled"   BOOLEAN DEFAULT true,
  "pfEmployeeRate" DECIMAL(5,2) DEFAULT 12,
  "pfEmployerRate" DECIMAL(5,2) DEFAULT 12,
  "pfWageCeiling" DECIMAL(10,2) DEFAULT 15000,
  "esiEnabled"  BOOLEAN DEFAULT true,
  "esiWageCeiling" DECIMAL(10,2) DEFAULT 21000,
  "ptEnabled"   BOOLEAN DEFAULT true,
  "ptState"     VARCHAR(50),
  "ptSlabs"     JSONB,   -- [{upTo: 10000, amount: 0}, {upTo: 15000, amount: 150}, ...]
  "lwfEnabled"  BOOLEAN DEFAULT false,
  "lwfSlabs"    JSONB,
  "gratuityEnabled" BOOLEAN DEFAULT true,
  "gratuityEligibilityYears" INT DEFAULT 5
);
```

### Reimbursement [NEW]

```sql
CREATE TABLE "Reimbursement" (
  "claimId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"      UUID NOT NULL REFERENCES "User"("userId"),
  "orgId"       UUID NOT NULL,
  "category"    VARCHAR(100) NOT NULL,  -- Travel, Medical, Phone, etc.
  "amount"      DECIMAL(10,2) NOT NULL,
  "billDate"    DATE NOT NULL,
  "description" TEXT,
  "attachments" JSONB,    -- [{url, name, size}]
  "status"      "ClaimStatus" DEFAULT 'PENDING',
  "approvedBy"  UUID REFERENCES "User"("userId"),
  "payrollRunId" UUID REFERENCES "PayrollRun"("runId"),
  "createdAt"   TIMESTAMPTZ DEFAULT now()
);
```

### TaxDeclaration [NEW]

```sql
CREATE TABLE "TaxDeclaration" (
  "declarationId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"        UUID NOT NULL REFERENCES "User"("userId"),
  "orgId"         UUID NOT NULL,
  "financialYear" VARCHAR(9) NOT NULL,  -- '2024-2025'
  "regime"        "TaxRegime" DEFAULT 'NEW',
  "declarations"  JSONB NOT NULL,
  -- {
  --   section80C: {amount: 100000, proofs: [...]},
  --   hra: {rentPaid: 12000, landlordPan: 'ABCDE1234F'},
  --   ...
  -- }
  "status"        VARCHAR(20) DEFAULT 'DRAFT',
  "submittedAt"   TIMESTAMPTZ,
  "verifiedBy"    UUID REFERENCES "User"("userId"),
  "createdAt"     TIMESTAMPTZ DEFAULT now(),
  UNIQUE("userId", "financialYear")
);
```

---

## Module 4: Documents

### Document [NEW]

```sql
CREATE TABLE "Document" (
  "docId"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"       UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "userId"      UUID REFERENCES "User"("userId"),  -- null = org-level doc
  "name"        VARCHAR(255) NOT NULL,
  "category"    VARCHAR(100) NOT NULL,  -- 'offer_letter', 'id_proof', 'certificate', 'policy'
  "fileUrl"     TEXT NOT NULL,          -- R2 key
  "fileSizeBytes" INT,
  "mimeType"    VARCHAR(100),
  "status"      "DocumentStatus" DEFAULT 'PENDING_SIGN',
  "expiresOn"   DATE,
  "isConfidential" BOOLEAN DEFAULT false,
  "uploadedBy"  UUID REFERENCES "User"("userId"),
  "signedAt"    TIMESTAMPTZ,
  "signedByEmployee" BOOLEAN DEFAULT false,
  "createdAt"   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON "Document"("orgId", "userId");
CREATE INDEX ON "Document"("expiresOn") WHERE "expiresOn" IS NOT NULL;
```

### DocumentTemplate [NEW]

```sql
CREATE TABLE "DocumentTemplate" (
  "templateId"  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"       UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "name"        VARCHAR(100) NOT NULL,
  "type"        VARCHAR(50) NOT NULL,  -- 'offer_letter', 'appointment', 'experience', 'nda'
  "bodyHtml"    TEXT NOT NULL,         -- HTML with {{merge_fields}}
  "mergeFields" JSONB,                 -- available fields list
  "isDefault"   BOOLEAN DEFAULT false,
  "createdBy"   UUID REFERENCES "User"("userId"),
  "createdAt"   TIMESTAMPTZ DEFAULT now()
);
```

---

## Module 5: Onboarding & Offboarding

### OnboardingTemplate [NEW]

```sql
CREATE TABLE "OnboardingTemplate" (
  "templateId"  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"       UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "name"        VARCHAR(100) NOT NULL,
  "deptId"      UUID REFERENCES "Department"("deptId"),  -- null = all departments
  "designationId" UUID REFERENCES "Designation"("designationId"),
  "type"        VARCHAR(20) DEFAULT 'ONBOARDING',  -- or 'OFFBOARDING'
  "createdAt"   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "OnboardingTask" (
  "taskId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "templateId"  UUID NOT NULL REFERENCES "OnboardingTemplate"("templateId") ON DELETE CASCADE,
  "title"       VARCHAR(255) NOT NULL,
  "description" TEXT,
  "assignedRole" "Role",             -- who completes this: OWNER, MANAGER, USER (self)
  "dueDaysFromJoining" INT DEFAULT 0,
  "category"    VARCHAR(50),         -- IT, HR, Admin, Finance
  "sortOrder"   INT DEFAULT 0
);
```

### OnboardingInstance [NEW]

```sql
CREATE TABLE "OnboardingInstance" (
  "instanceId"  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"      UUID NOT NULL REFERENCES "User"("userId"),
  "orgId"       UUID NOT NULL,
  "templateId"  UUID REFERENCES "OnboardingTemplate"("templateId"),
  "type"        VARCHAR(20) DEFAULT 'ONBOARDING',
  "startDate"   DATE NOT NULL,
  "completedAt" TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "OnboardingTaskInstance" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "instanceId"   UUID NOT NULL REFERENCES "OnboardingInstance"("instanceId"),
  "taskId"       UUID NOT NULL REFERENCES "OnboardingTask"("taskId"),
  "assignedToId" UUID REFERENCES "User"("userId"),
  "dueDate"      DATE,
  "completedAt"  TIMESTAMPTZ,
  "notes"        TEXT
);
```

---

## Module 6: Performance

### ReviewCycle [NEW]

```sql
CREATE TABLE "ReviewCycle" (
  "cycleId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"      UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "name"       VARCHAR(100) NOT NULL,  -- "Q1 2025 Review"
  "type"       VARCHAR(20) DEFAULT 'ANNUAL',  -- ANNUAL, QUARTERLY, PROBATION
  "startDate"  DATE NOT NULL,
  "endDate"    DATE NOT NULL,
  "status"     VARCHAR(20) DEFAULT 'UPCOMING',  -- UPCOMING, ACTIVE, CLOSED
  "ratingScale" JSONB NOT NULL,
  -- [{value: 1, label: "Below Expectation"}, {value: 5, label: "Exceptional"}]
  "createdAt"  TIMESTAMPTZ DEFAULT now()
);
```

### Goal [NEW]

```sql
CREATE TABLE "Goal" (
  "goalId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"     UUID NOT NULL REFERENCES "User"("userId"),
  "orgId"      UUID NOT NULL,
  "cycleId"    UUID REFERENCES "ReviewCycle"("cycleId"),
  "title"      VARCHAR(255) NOT NULL,
  "description" TEXT,
  "metric"     VARCHAR(255),    -- "Achieve 95% attendance"
  "targetDate" DATE,
  "status"     "GoalStatus" DEFAULT 'ACTIVE',
  "progress"   INT DEFAULT 0,  -- 0-100
  "createdAt"  TIMESTAMPTZ DEFAULT now()
);
```

### Review [NEW]

```sql
CREATE TABLE "Review" (
  "reviewId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cycleId"      UUID NOT NULL REFERENCES "ReviewCycle"("cycleId"),
  "userId"       UUID NOT NULL REFERENCES "User"("userId"),
  "reviewerId"   UUID NOT NULL REFERENCES "User"("userId"),
  "orgId"        UUID NOT NULL,
  "status"       "ReviewStatus" DEFAULT 'NOT_STARTED',
  "selfRating"   DECIMAL(3,1),
  "managerRating" DECIMAL(3,1),
  "selfComments" TEXT,
  "managerComments" TEXT,
  "strengths"    TEXT,
  "improvements" TEXT,
  "goals"        JSONB,   -- snapshot of goals at review time
  "submittedAt"  TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ DEFAULT now(),
  UNIQUE("cycleId", "userId")
);
```

---

## Module 7: Recruitment

### JobPosting [NEW]

```sql
CREATE TABLE "JobPosting" (
  "jobId"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"       UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "deptId"      UUID REFERENCES "Department"("deptId"),
  "designationId" UUID REFERENCES "Designation"("designationId"),
  "title"       VARCHAR(255) NOT NULL,
  "description" TEXT,
  "requirements" TEXT,
  "location"    VARCHAR(100),
  "employmentType" "EmploymentType" DEFAULT 'FULL_TIME',
  "salaryMin"   DECIMAL(12,2),
  "salaryMax"   DECIMAL(12,2),
  "openings"    INT DEFAULT 1,
  "isPublic"    BOOLEAN DEFAULT false,
  "status"      VARCHAR(20) DEFAULT 'OPEN',  -- OPEN, CLOSED, ON_HOLD
  "closingDate" DATE,
  "createdBy"   UUID REFERENCES "User"("userId"),
  "createdAt"   TIMESTAMPTZ DEFAULT now()
);
```

### Candidate & Application [NEW]

```sql
CREATE TABLE "Candidate" (
  "candidateId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"       UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "name"        VARCHAR(255) NOT NULL,
  "email"       VARCHAR(255),
  "phone"       VARCHAR(15),
  "resumeUrl"   TEXT,
  "source"      VARCHAR(50),  -- REFERRAL, PORTAL, LINKEDIN, WALK_IN
  "customData"  JSONB,
  "createdAt"   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "Application" (
  "applicationId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "jobId"        UUID NOT NULL REFERENCES "JobPosting"("jobId"),
  "candidateId"  UUID NOT NULL REFERENCES "Candidate"("candidateId"),
  "orgId"        UUID NOT NULL,
  "stage"        "ApplicationStage" DEFAULT 'APPLIED',
  "notes"        TEXT,
  "assignedTo"   UUID REFERENCES "User"("userId"),
  "offeredSalary" DECIMAL(12,2),
  "joiningDate"  DATE,
  "convertedUserId" UUID REFERENCES "User"("userId"),
  "createdAt"    TIMESTAMPTZ DEFAULT now()
);
```

---

## Module 8: Communication

### Announcement [NEW]

```sql
CREATE TABLE "Announcement" (
  "announcementId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId"        UUID NOT NULL REFERENCES "Organisation"("orgId"),
  "teamId"       UUID REFERENCES "Team"("teamId"),  -- null = org-wide
  "title"        VARCHAR(255) NOT NULL,
  "body"         TEXT NOT NULL,
  "publishedAt"  TIMESTAMPTZ,
  "expiresAt"    TIMESTAMPTZ,
  "createdBy"    UUID REFERENCES "User"("userId"),
  "channels"     JSONB DEFAULT '["app"]',  -- ["app", "email", "whatsapp", "slack"]
  "createdAt"    TIMESTAMPTZ DEFAULT now()
);
```

---

## Module 9: Auth (Better Auth)

Better Auth manages its own tables via migration. Key tables it creates:

- `user` — auth user (email, name, emailVerified)
- `session` — session tokens with expiry
- `account` — OAuth provider accounts (Slack, Google)
- `verification` — magic link tokens

Map: `better_auth.user.id` → `public."User"."userId"` (1:1 after onboarding)

---

## Module 10: Billing (Existing — extend)

```sql
ALTER TABLE "Subscription" ADD COLUMN "planName" VARCHAR(50);
ALTER TABLE "Subscription" ADD COLUMN "billingCycle" VARCHAR(10) DEFAULT 'MONTHLY';
ALTER TABLE "Subscription" ADD COLUMN "employeeCount" INT;
ALTER TABLE "Subscription" ADD COLUMN "trialEndsAt" TIMESTAMPTZ;
ALTER TABLE "Subscription" ADD COLUMN "cancelledAt" TIMESTAMPTZ;
```

---

## Key Indexes Summary

```sql
-- Core HR
CREATE INDEX ON "User"("orgId", "status");
CREATE INDEX ON "User"("teamId");
CREATE INDEX ON "User"("deptId");
CREATE INDEX ON "User"("email");
CREATE INDEX ON "Department"("orgId");

-- Attendance
CREATE UNIQUE INDEX ON "AttendanceRecord"("userId", "date");
CREATE INDEX ON "AttendanceRecord"("orgId", "date");

-- Payroll
CREATE UNIQUE INDEX ON "PayrollRun"("orgId", "month", "year");
CREATE UNIQUE INDEX ON "Payslip"("runId", "userId");
CREATE INDEX ON "EmployeeSalary"("userId", "effectiveFrom");

-- Leaves (existing + new)
CREATE INDEX ON "Leave"("userId", "startDate");
CREATE INDEX ON "Leave"("orgId", "isApproved");

-- Documents
CREATE INDEX ON "Document"("orgId", "userId");
CREATE INDEX ON "Document"("expiresOn");

-- Applications
CREATE INDEX ON "Application"("jobId", "stage");
CREATE INDEX ON "BiometricEvent"("isProcessed", "createdAt");
```

---

## Views

```sql
-- Existing: leave_summary

-- New: employee_summary
CREATE VIEW "employee_summary" AS
SELECT
  u."userId", u."name", u."email", u."status", u."employmentType",
  u."dateOfJoining", u."orgId",
  d."name" AS "department",
  des."name" AS "designation",
  t."name" AS "team",
  mgr."name" AS "managerName"
FROM "User" u
LEFT JOIN "Department" d ON u."deptId" = d."deptId"
LEFT JOIN "Designation" des ON u."designationId" = des."designationId"
LEFT JOIN "Team" t ON u."teamId" = t."teamId"
LEFT JOIN "User" mgr ON u."reportingManagerId" = mgr."userId";

-- New: monthly_attendance_summary
CREATE VIEW "monthly_attendance_summary" AS
SELECT
  ar."userId", ar."orgId",
  EXTRACT(YEAR FROM ar."date") AS year,
  EXTRACT(MONTH FROM ar."date") AS month,
  COUNT(*) FILTER (WHERE ar."status" = 'PRESENT') AS present_days,
  COUNT(*) FILTER (WHERE ar."status" = 'ABSENT') AS absent_days,
  COUNT(*) FILTER (WHERE ar."status" = 'ON_LEAVE') AS leave_days,
  COUNT(*) FILTER (WHERE ar."status" = 'WFH') AS wfh_days,
  SUM(ar."overtimeMins") AS total_overtime_mins
FROM "AttendanceRecord" ar
GROUP BY ar."userId", ar."orgId", year, month;
```

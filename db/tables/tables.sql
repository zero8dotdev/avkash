-- Drop all existing tables and enums
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Drop all enums
    FOR r IN (SELECT t.typname FROM pg_type t LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE t.typtype = 'e' AND n.nspname = 'public') LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

CREATE TYPE "Visibility" AS ENUM('ORG', 'TEAM', 'SELF');

CREATE TYPE "DaysOfWeek" AS ENUM(
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY'
);

CREATE TYPE "AccuralFrequencyOptions" AS ENUM(
  'MONTHLY',
  'QUARTERLY'
);

CREATE TYPE "AccrueOnOptions" AS ENUM('BEGINNING', 'END');

CREATE TYPE "LeaveDuration" AS ENUM('FULL_DAY', 'HALF_DAY');

CREATE TYPE "Shift" AS ENUM('MORNING', 'AFTERNOON', 'NONE');

CREATE TYPE "LeaveStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'DELETED');

CREATE TYPE "Role" AS ENUM('OWNER', 'MANAGER', 'USER', 'ANON', 'ADMIN');

-- Updated Tables
CREATE TABLE
  "Organisation" (
    "orgId" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "subscriptionId" VARCHAR(255),
    "dateformat" VARCHAR(255) NOT NULL DEFAULT 'dd/mm/yyyy',
    "timeformat" VARCHAR(255) NOT NULL DEFAULT '12-hour',
    "location" VARCHAR(255)[],
    "visibility" "Visibility" NOT NULL DEFAULT 'SELF',
    "ownerId" UUID,
    "halfDayLeave" BOOLEAN NOT NULL DEFAULT FALSE,
    "initialSetup" VARCHAR(1) DEFAULT 0,
    "isSetupCompleted" BOOLEAN DEFAULT FALSE,
    "createdBy" VARCHAR(255),
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    "domain" VARCHAR(255),
  );


CREATE TABLE
  "Team" (
    "teamId" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "name" VARCHAR(255) NOT NULL,
    "orgId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "managers" UUID[],
    "location" VARCHAR(255),
    "startOfWorkWeek" "DaysOfWeek" DEFAULT 'MONDAY',
    "workweek" "DaysOfWeek" [] DEFAULT ARRAY[
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY'
    ]::"DaysOfWeek" [],
    "timeZone" VARCHAR(255),
    "notificationLeaveChanged" BOOLEAN NOT NULL DEFAULT FALSE,
    "notificationDailySummary" BOOLEAN NOT NULL DEFAULT FALSE,
    "notificationDailySummarySendOnTime" TEXT,
    "notificationWeeklySummary" BOOLEAN NOT NULL DEFAULT FALSE,
    "notificationWeeklySummaryTime" TEXT,
    "notificationWeeklySummarySendOnDay" "DaysOfWeek",
    "notificationToWhom" "Role"[] NOT NULL DEFAULT ARRAY['MANAGER']::"Role"[],
    "createdBy" VARCHAR(255),
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_team_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId")
  );

CREATE TABLE
  "User" (
    "userId" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "picture" TEXT,
    "teamId" UUID,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "accruedLeave" JSONB DEFAULT '{}'::jsonb,
    "usedLeave" JSONB DEFAULT '{}'::jsonb,
    "keyword" VARCHAR,
    "slackId" TEXT,
    "googleId" TEXT,
    "orgId" UUID,
    "overrides" JSONB DEFAULT '{}'::jsonb, -- Store overrides in JSONB
    "createdBy" VARCHAR(255),
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_user_team" FOREIGN KEY ("teamId") REFERENCES "Team" ("teamId") ON DELETE RESTRICT,
    CONSTRAINT "fk_user_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId")
  );

  CREATE TABLE
  "LeaveType" (
    "leaveTypeId" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "name" VARCHAR(255) NOT NULL,
    "color" VARCHAR(6),
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "orgId" UUID NOT NULL,
    "setSlackStatus" BOOLEAN NOT NULL DEFAULT TRUE,
    "emoji" VARCHAR,
    "statusMsg" VARCHAR(255),
    "createdBy" VARCHAR(255),
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_leavetype_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId")
  );


CREATE TABLE
  "Leave" (
    "leaveId" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "leaveTypeId" UUID NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "duration" "LeaveDuration" NOT NULL DEFAULT 'FULL_DAY',
    "shift" "Shift" NOT NULL DEFAULT 'NONE',
    "isApproved" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "userId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "reason" VARCHAR(255),
    "managerComment" VARCHAR(255),
    "orgId" UUID NOT NULL,
    "createdBy" VARCHAR(255),
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_leave_user" FOREIGN KEY ("userId") REFERENCES "User" ("userId"),
    CONSTRAINT "fk_leave_team" FOREIGN KEY ("teamId") REFERENCES "Team" ("teamId"),
    CONSTRAINT "fk_leave_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId"),
    CONSTRAINT "fk_leave_leavetype" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType" ("leaveTypeId") on delete cascade
  );


CREATE TABLE
  "LeavePolicy" (
    "leavePolicyId" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "leaveTypeId" UUID NOT NULL,
    "unlimited" BOOLEAN NOT NULL DEFAULT FALSE,
    "maxLeaves" INT,
    "accruals" BOOLEAN NOT NULL DEFAULT FALSE,
    "accrualFrequency" "AccuralFrequencyOptions",
    "accrueOn" "AccrueOnOptions",
    "rollOver" BOOLEAN NOT NULL DEFAULT FALSE,
    "rollOverLimit" INT,
    "teamId" UUID NOT NULL,
    "rollOverExpiry" VARCHAR(5) CHECK ("rollOverExpiry" ~ '^\d{2}/\d{2}$'),
    "autoApprove" BOOLEAN NOT NULL DEFAULT FALSE,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdBy" VARCHAR(255),
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_leavepolicy_team" FOREIGN KEY ("teamId") REFERENCES "Team" ("teamId"),
    CONSTRAINT "fk_leavepolicy_leavetype" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType" ("leaveTypeId")
  );

CREATE TABLE
  "Holiday" (
    "holidayId" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "name" VARCHAR(255) NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "location" VARCHAR(255),
    "isRecurring" BOOLEAN NOT NULL DEFAULT TRUE,
    "isCustom" BOOLEAN NOT NULL DEFAULT TRUE,
    "orgId" UUID NOT NULL,
    "createdBy" VARCHAR(255),
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_holiday_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId")
  );

CREATE TABLE
  "OrgAccessData" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "orgId" UUID,
    "slackAccessToken" TEXT,
    "slackRefreshToken" TEXT,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "ownerSlackId" TEXT,
    "createdBy" VARCHAR(255),
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_orgaccessdata_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId")
  );

CREATE TABLE
  "ActivityLog" (
    "id" SERIAL PRIMARY KEY,
    "orgId" UUID,
    "changedColumns" JSONB,
    "changedOn" TIMESTAMP(6) DEFAULT now(),
    "changedBy" VARCHAR(255),
    "tableName" VARCHAR,
    "teamId" UUID,
    "userId" UUID,
    "keyword" VARCHAR,
    "createdBy" VARCHAR(255),
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_activity_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId"),
    CONSTRAINT "fk_activity_team" FOREIGN KEY ("teamId") REFERENCES "Team" ("teamId"),
    CONSTRAINT "fk_activity_user" FOREIGN KEY ("userId") REFERENCES "User" ("userId")
  );

CREATE TABLE
  "PublicHolidays" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "country" VARCHAR(50),
    "iso" CHAR(2),
    "year" INT,
    "date" DATE,
    "day" VARCHAR(15),
    "name" VARCHAR(100),
    "type" VARCHAR(50)
  );

CREATE TABLE
  "PaySubMap" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "razorpayPaymentId" VARCHAR(255),
    "razorpaySignature" VARCHAR(255),
    "razorpaySubscriptionId" VARCHAR(255)
  );

CREATE TABLE
  "Subscription" (
    "id" VARCHAR(255) PRIMARY KEY,
    "entity" VARCHAR(50),
    "planId" VARCHAR(255),
    "customerId" VARCHAR(255),
    "status" VARCHAR(50),
    "currentStart" INTEGER,
    "currentEnd" INTEGER,
    "endedAt" INTEGER,
    "quantity" INTEGER,
    "note" VARCHAR(255),
    "chargeAt" INTEGER,
    "offerId" VARCHAR(255),
    "startAt" INTEGER,
    "endAt" INTEGER,
    "authAttempts" INTEGER,
    "totalCount" INTEGER,
    "paidCount" INTEGER,
    "customerNotify" BOOLEAN,
    "createdAt" INTEGER,
    "expireBy" INTEGER,
    "shortUrl" VARCHAR(255),
    "hasScheduledChanges" BOOLEAN,
    "scheduleChangeAt" INTEGER,
    "remainingCount" INTEGER
  );

CREATE TABLE
  "ContactEmail" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    "firstName" VARCHAR(255),
    "lastName" VARCHAR(255),
    "email" VARCHAR(255),
    "message" VARCHAR(255)
  );

-- Leave Table
CREATE INDEX idx_leave_user_id ON "Leave" ("userId");

CREATE INDEX idx_leave_team_id ON "Leave" ("teamId");

CREATE INDEX idx_leave_org_id ON "Leave" ("orgId");

CREATE INDEX idx_leave_user_start_date ON "Leave" ("userId", "startDate");

CREATE INDEX idx_leave_start_date ON "Leave" ("startDate");

CREATE INDEX idx_leave_end_date ON "Leave" ("endDate");

CREATE INDEX idx_leave_status ON "Leave" ("isApproved");

-- User Table
CREATE INDEX idx_user_org_id ON "User" ("orgId");

CREATE INDEX idx_user_team_id ON "User" ("teamId");

CREATE INDEX idx_user_email ON "User" ("email");

-- Team Table
CREATE INDEX idx_team_org_id ON "Team" ("orgId");

CREATE INDEX idx_team_manager ON "Team" ("managers");

-- Organisation Table
CREATE INDEX idx_organisation_subscription_id ON "Organisation" ("subscriptionId");

CREATE INDEX idx_organisation_owner_id ON "Organisation" ("ownerId");

-- LeaveType Table
CREATE INDEX idx_leavetype_org_id ON "LeaveType" ("orgId");

CREATE INDEX idx_leavetype_active ON "LeaveType" ("isActive");

-- LeavePolicy Table
CREATE INDEX idx_leavepolicy_type_team ON "LeavePolicy" ("leaveTypeId", "teamId");

CREATE INDEX idx_leavepolicy_active ON "LeavePolicy" ("isActive");

-- Holiday Table
CREATE INDEX idx_holiday_org_id ON "Holiday" ("orgId");

CREATE INDEX idx_holiday_date ON "Holiday" ("date");

CREATE INDEX idx_holiday_recurring ON "Holiday" ("isRecurring");

-- OrgAccessData Table
CREATE INDEX idx_orgaccessdata_org_id ON "OrgAccessData" ("orgId");


DROP VIEW IF EXISTS public.leave_summary;

CREATE OR REPLACE VIEW leave_summary AS
SELECT
  "userId",
  "leaveTypeId",
  "isApproved",
  COUNT(*) AS count
FROM
  "Leave"
GROUP BY
  "userId", "leaveTypeId", "isApproved";

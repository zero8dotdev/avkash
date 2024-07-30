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

-- Create Enums
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
    'BIWEEKLY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'HALF_YEARLY'
);

CREATE TYPE "AccrueOnOptions" AS ENUM('BEGINNING', 'END');

CREATE TYPE "LeaveDuration" AS ENUM('FULL_DAY', 'HALF_DAY');

CREATE TYPE "Shift" AS ENUM('MORNING', 'AFTERNOON', 'NONE');

CREATE TYPE "LeaveStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'DELETED');

CREATE TYPE "Role" AS ENUM('OWNER', 'MANAGER', 'USER', 'ANON');

-- Create Tables
CREATE TABLE "Organisation" (
    "orgId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "subscriptionId" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "dateformat" VARCHAR(255) NOT NULL DEFAULT 'DD-MM-YYYY',
    "timeformat" VARCHAR(255) NOT NULL DEFAULT 'HH:MM',
    "location" VARCHAR(255),
    "visibility" "Visibility" NOT NULL DEFAULT 'SELF',
    "startOfWorkWeek" "DaysOfWeek" NOT NULL DEFAULT 'MONDAY',
    "workweek" "DaysOfWeek"[] NOT NULL DEFAULT ARRAY[
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY'
    ]::"DaysOfWeek"[],
    "timeZone" VARCHAR(255),
    "notificationLeaveChanged" BOOLEAN NOT NULL DEFAULT FALSE,
    "notificationDailySummary" BOOLEAN NOT NULL DEFAULT FALSE,
    "notificationDailySummarySendOnTime" TEXT,
    "notificationWeeklySummary" BOOLEAN NOT NULL DEFAULT FALSE,
    "notificationWeeklySummaryTime" TEXT,
    "notificationWeeklySummarySendOnDay" "DaysOfWeek",
    "notificationToWhom" "Role" NOT NULL DEFAULT 'MANAGER',
    "ownerId" UUID,
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "createdBy" VARCHAR(255),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    "halfDayLeave" BOOLEAN NOT NULL DEFAULT FALSE,
    "initialSetup" BOOLEAN DEFAULT FALSE
);

CREATE TABLE "Team" (
    "teamId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "orgId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "manager" UUID,
    "location" VARCHAR(255),
    "startOfWorkWeek" "DaysOfWeek" DEFAULT 'MONDAY',
    "workweek" "DaysOfWeek"[] DEFAULT ARRAY[
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY'
    ]::"DaysOfWeek"[],
    "timeZone" VARCHAR(255),
    "notificationLeaveChanged" BOOLEAN NOT NULL DEFAULT FALSE,
    "notificationDailySummary" BOOLEAN NOT NULL DEFAULT FALSE,
    "notificationDailySummarySendOnTime" TEXT,
    "notificationWeeklySummary" BOOLEAN NOT NULL DEFAULT FALSE,
    "notificationWeeklySummaryTime" TEXT,
    "notificationWeeklySummarySendOnDay" "DaysOfWeek",
    "notificationToWhom" "Role" NOT NULL DEFAULT 'MANAGER',
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "createdBy" VARCHAR(255),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_team_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId")
);

CREATE TABLE "User" (
    "userId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "teamId" UUID,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "createdBy" VARCHAR(255),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    "accruedLeave" JSONB DEFAULT '{}'::jsonb,
    "usedLeave" JSONB DEFAULT '{}'::jsonb,
    "keyword" VARCHAR,
    "slackId" TEXT,
    "googleId" TEXT,
    "orgId" UUID,
    CONSTRAINT "fk_user_team" FOREIGN KEY ("teamId") REFERENCES "Team" ("teamId") ON DELETE RESTRICT,
    CONSTRAINT "fk_user_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId")
);

CREATE TABLE "Leave" (
    "leaveId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "leaveType" VARCHAR(255) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "duration" "LeaveDuration" NOT NULL,
    "shift" "Shift" NOT NULL,
    "isApproved" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "userId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "reason" VARCHAR(255),
    "managerComment" VARCHAR(255),
    "orgId" UUID NOT NULL,
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "createdBy" VARCHAR(255),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_leave_user" FOREIGN KEY ("userId") REFERENCES "User" ("userId"),
    CONSTRAINT "fk_leave_team" FOREIGN KEY ("teamId") REFERENCES "Team" ("teamId"),
    CONSTRAINT "fk_leave_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId")
);

CREATE TABLE "LeaveType" (
    "leaveTypeId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "color" VARCHAR(6),
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "orgId" UUID NOT NULL,
    "setSlackStatus" BOOLEAN NOT NULL DEFAULT TRUE,
    "emoji" VARCHAR,
    "statusMsg" VARCHAR(255),
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "createdBy" VARCHAR(255),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_leavetype_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId")
);

CREATE TABLE "LeavePolicy" (
    "leavePolicyId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "leaveTypeId" UUID NOT NULL,
    "unlimited" BOOLEAN NOT NULL DEFAULT FALSE,
    "maxLeaves" INT,
    "accruals" BOOLEAN NOT NULL DEFAULT FALSE,
    "accrualFrequency" "AccuralFrequencyOptions",
    "accrueOn" "AccrueOnOptions",
    "rollOver" BOOLEAN NOT NULL DEFAULT FALSE,
    "rollOverLimit" INT,
    "orgId" UUID NOT NULL,
    "rollOverExpiry" VARCHAR(5) CHECK ("rollOverExpiry" ~ '^\d{2}/\d{2}$'),
    "autoApprove" BOOLEAN NOT NULL DEFAULT FALSE,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "createdBy" VARCHAR(255),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_leavepolicy_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId"),
    CONSTRAINT "fk_leavepolicy_leavetype" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType" ("leaveTypeId")
);

CREATE TABLE "Holiday" (
    "holidayId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "location" VARCHAR(255),
    "isRecurring" BOOLEAN NOT NULL DEFAULT TRUE,
    "isCustom" BOOLEAN NOT NULL DEFAULT TRUE,
    "orgId" UUID NOT NULL,
    "createdOn" TIMESTAMP(6) DEFAULT now(),
    "createdBy" VARCHAR(255),
    "updatedBy" VARCHAR(255),
    "updatedOn" TIMESTAMP(6) DEFAULT now(),
    CONSTRAINT "fk_holiday_org" FOREIGN KEY ("orgId") REFERENCES "Organisation" ("orgId")
);

CREATE TABLE "ActivityLog" (
    "id" SERIAL PRIMARY KEY,
    "orgId" UUID,
    "changedColumns" JSONB,
    "changedOn" TIMESTAMP(6) DEFAULT now(),
    "changedBy" VARCHAR(255),
    "tableName" VARCHAR,
    "teamId" UUID,
    "userId" UUID,
    "keyword" VARCHAR
);

CREATE TABLE "OrgAccessData" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orgId" UUID,
    "SlackAccessToken" TEXT,
    "SlackRefreshToken" TEXT,
    "GoogleAccessToken" TEXT,
    "GoogleRefreshToken" TEXT
);

CREATE TABLE "PublicHolidays" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "country" VARCHAR(50),
    "iso" CHAR(2),
    "year" INT,
    "date" DATE,
    "day" VARCHAR(15),
    "name" VARCHAR(100),
    "type" VARCHAR(50)
);

CREATE TABLE "PaySubMap" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "razorpayPaymentId" VARCHAR(255),
    "razorpaySignature" VARCHAR(255),
    "razorpaySubscriptionId" VARCHAR(255)
);

CREATE TABLE "Subscription" (
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
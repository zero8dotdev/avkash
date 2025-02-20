

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."AccrueOnOptions" AS ENUM (
    'BEGINNING',
    'END'
);


ALTER TYPE "public"."AccrueOnOptions" OWNER TO "postgres";


CREATE TYPE "public"."AccuralFrequencyOptions" AS ENUM (
    'MONTHLY',
    'QUARTERLY'
);


ALTER TYPE "public"."AccuralFrequencyOptions" OWNER TO "postgres";


CREATE TYPE "public"."DaysOfWeek" AS ENUM (
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY'
);


ALTER TYPE "public"."DaysOfWeek" OWNER TO "postgres";


CREATE TYPE "public"."LeaveDuration" AS ENUM (
    'FULL_DAY',
    'HALF_DAY'
);


ALTER TYPE "public"."LeaveDuration" OWNER TO "postgres";


CREATE TYPE "public"."LeaveStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'DELETED'
);


ALTER TYPE "public"."LeaveStatus" OWNER TO "postgres";


CREATE TYPE "public"."Role" AS ENUM (
    'OWNER',
    'MANAGER',
    'USER',
    'ANON',
    'ADMIN'
);


ALTER TYPE "public"."Role" OWNER TO "postgres";


CREATE TYPE "public"."Shift" AS ENUM (
    'MORNING',
    'AFTERNOON',
    'NONE'
);


ALTER TYPE "public"."Shift" OWNER TO "postgres";


CREATE TYPE "public"."Visibility" AS ENUM (
    'ORG',
    'TEAM',
    'SELF'
);


ALTER TYPE "public"."Visibility" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_to_user_uuid_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ BEGIN
  -- First, try to update the row if it exists
  update public."User"
  set "userId" = new.id, "role" = 'USER', keyword = 'joined'
  where email = new.email;

  -- Check if the row was updated
  if found then
    return new;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."auth_to_user_uuid_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_accruals"("frequency" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    leavePolicy RECORD;
    accrualCount NUMERIC;
BEGIN
    -- Check if the frequency parameter is valid
    IF frequency NOT IN ('MONTHLY', 'QUARTERLY') THEN
        RAISE EXCEPTION 'Invalid frequency: %, only MONTHLY and QUARTERLY are supported', frequency;
    END IF;

    FOR leavePolicy IN
        SELECT * FROM "LeavePolicy"
        WHERE accruals = TRUE AND accrualFrequency = frequency::"AccrualFrequencyOptions"
    LOOP
        -- Calculate the accrual count based on accrualFrequency
        IF leavePolicy.accrualFrequency = 'MONTHLY' THEN
            accrualCount := leavePolicy.maxLeaves / 12;
        ELSIF leavePolicy.accrualFrequency = 'QUARTERLY' THEN
            accrualCount := leavePolicy.maxLeaves / 4;
        ELSE
            RAISE EXCEPTION 'Unsupported accrualFrequency in data: %', leavePolicy.accrualFrequency;
        END IF;

        -- Update accruedLeave for users belonging to the same organization
        UPDATE "User"
        SET accruedLeave = accruedLeave + accrualCount
        WHERE teamId IN (
            SELECT teamId
            FROM "Team"
            WHERE orgId = leavePolicy.orgId
        );
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."calculate_accruals"("frequency" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fetch_user_orgid"("id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Select the role, teamId, and orgId of the user where userId matches the given id
    SELECT "orgId" INTO org_id
    FROM "User"
    WHERE "userId" = id
    LIMIT 1;

    -- Return the result as a JSON object
    RETURN org_id;
END;
$$;


ALTER FUNCTION "public"."fetch_user_orgid"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fetch_user_role"("id" "uuid") RETURNS character varying
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    org_owner_id UUID;
    team_managers UUID[];
BEGIN
    -- Check if the user is an Organisation Owner
    SELECT "ownerId"
    INTO org_owner_id
    FROM "Organisation"
    WHERE "ownerId" = id
    LIMIT 1;

    IF org_owner_id IS NOT NULL THEN
        RETURN 'OWNER';
    END IF;

    -- Check if the user is a Team Manager
    SELECT "managers"
    INTO team_managers
    FROM "Team"
    WHERE id = ANY ("managers")
    LIMIT 1;

    IF team_managers IS NOT NULL AND id = ANY (team_managers) THEN
        RETURN 'MANAGER';
    END IF;

    -- Default to USER
    RETURN 'USER';
END;
$$;


ALTER FUNCTION "public"."fetch_user_role"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fetch_user_teamid"("id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    team_id UUID;
BEGIN
    -- Select the role, teamId, and orgId of the user where userId matches the given id
    SELECT "teamId" INTO team_id
    FROM "User"
    WHERE "userId" = id
    LIMIT 1;

    -- Return the result as a JSON object
    RETURN team_id;
END;
$$;


ALTER FUNCTION "public"."fetch_user_teamid"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_approved_activity_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare the isApproved column and add to changedColumns if different
        IF OLD."isApproved" IS DISTINCT FROM NEW."isApproved" THEN
            changedColumns := jsonb_set(changedColumns, '{isApproved}', jsonb_build_object('old', OLD."isApproved", 'new', NEW."isApproved"));
        END IF;

        -- Insert the log entry only if there are changes
        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "userId", "teamId", "changedColumns", "changedBy", keyword)
            VALUES (tableName, NEW."userId", NEW."teamId", changedColumns, NEW."updatedBy", 'leave_status');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."leave_approved_activity_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_request_activity_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    tableName TEXT := TG_TABLE_NAME;
    changedColumns JSONB := '{}'::jsonb;
BEGIN
    -- Check if the operation is an INSERT
    IF TG_OP = 'INSERT' THEN
        -- Log all new columns and their values as changed columns
        changedColumns := jsonb_build_object(
            'leaveTypeId', jsonb_build_object('new', NEW."leaveTypeId"),
            'startDate', jsonb_build_object('new', NEW."startDate"),
            'endDate', jsonb_build_object('new', NEW."endDate"),
            'duration', jsonb_build_object('new', NEW."duration"),
            'shift', jsonb_build_object('new', NEW."shift"),
            'isApproved', jsonb_build_object('new', NEW."isApproved"),
            'userId', jsonb_build_object('new', NEW."userId"),
            'teamId', jsonb_build_object('new', NEW."teamId"),
            'reason', jsonb_build_object('new', NEW."reason"),
            'managerComment', jsonb_build_object('new', NEW."managerComment"),
            'orgId', jsonb_build_object('new', NEW."orgId"),
            'createdOn', jsonb_build_object('new', NEW."createdOn"),
            'createdBy', jsonb_build_object('new', NEW."createdBy"),
            'updatedBy', jsonb_build_object('new', NEW."updatedBy"),
            'updatedOn', jsonb_build_object('new', NEW."updatedOn")
        );

        -- Log the entire new row
        INSERT INTO public."ActivityLog" ("tableName", "userId", "teamId", "changedColumns", "changedBy", "keyword")
        VALUES (tableName, NEW."userId", NEW."teamId", changedColumns, NEW."updatedBy", 'leave_request');
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."leave_request_activity_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leavepolicy_activity_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns if different
        IF OLD."leaveTypeId" IS DISTINCT FROM NEW."leaveTypeId" THEN
            changedColumns := jsonb_set(changedColumns, '{leaveTypeId}', jsonb_build_object('old', OLD."leaveTypeId", 'new', NEW."leaveTypeId"));
        END IF;
        IF OLD."unlimited" IS DISTINCT FROM NEW."unlimited" THEN
            changedColumns := jsonb_set(changedColumns, '{unlimited}', jsonb_build_object('old', OLD."unlimited", 'new', NEW."unlimited"));
        END IF;
        IF OLD."maxLeaves" IS DISTINCT FROM NEW."maxLeaves" THEN
            changedColumns := jsonb_set(changedColumns, '{maxLeaves}', jsonb_build_object('old', OLD."maxLeaves", 'new', NEW."maxLeaves"));
        END IF;
        IF OLD."accruals" IS DISTINCT FROM NEW."accruals" THEN
            changedColumns := jsonb_set(changedColumns, '{accruals}', jsonb_build_object('old', OLD."accruals", 'new', NEW."accruals"));
        END IF;
        IF OLD."accrualFrequency" IS DISTINCT FROM NEW."accrualFrequency" THEN
            changedColumns := jsonb_set(changedColumns, '{accrualFrequency}', jsonb_build_object('old', OLD."accrualFrequency", 'new', NEW."accrualFrequency"));
        END IF;
        IF OLD."accrueOn" IS DISTINCT FROM NEW."accrueOn" THEN
            changedColumns := jsonb_set(changedColumns, '{accrueOn}', jsonb_build_object('old', OLD."accrueOn", 'new', NEW."accrueOn"));
        END IF;
        IF OLD."rollOver" IS DISTINCT FROM NEW."rollOver" THEN
            changedColumns := jsonb_set(changedColumns, '{rollOver}', jsonb_build_object('old', OLD."rollOver", 'new', NEW."rollOver"));
        END IF;
        IF OLD."rollOverLimit" IS DISTINCT FROM NEW."rollOverLimit" THEN
            changedColumns := jsonb_set(changedColumns, '{rollOverLimit}', jsonb_build_object('old', OLD."rollOverLimit", 'new', NEW."rollOverLimit"));
        END IF;
        IF OLD."teamId" IS DISTINCT FROM NEW."teamId" THEN
            changedColumns := jsonb_set(changedColumns, '{teamId}', jsonb_build_object('old', OLD."teamId", 'new', NEW."teamId"));
        END IF;
        IF OLD."updatedBy" IS DISTINCT FROM NEW."updatedBy" THEN
            changedColumns := jsonb_set(changedColumns, '{updatedBy}', jsonb_build_object('old', OLD."updatedBy", 'new', NEW."updatedBy"));
        END IF;
        IF OLD."updatedOn" IS DISTINCT FROM NEW."updatedOn" THEN
            changedColumns := jsonb_set(changedColumns, '{updatedOn}', jsonb_build_object('old', OLD."updatedOn", 'new', NEW."updatedOn"));
        END IF;

        -- Insert the log entry only if there are changes
        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "teamId", "changedColumns", "changedBy", keyword)
            VALUES (tableName, NEW."teamId", changedColumns, NEW."updatedBy", 'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."leavepolicy_activity_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leavetype_activity_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns if different
        IF OLD."name" IS DISTINCT FROM NEW."name" THEN
            changedColumns := jsonb_set(changedColumns, '{name}', jsonb_build_object('old', OLD."name", 'new', NEW."name"));
        END IF;
        IF OLD."color" IS DISTINCT FROM NEW."color" THEN
            changedColumns := jsonb_set(changedColumns, '{color}', jsonb_build_object('old', OLD."color", 'new', NEW."color"));
        END IF;
        IF OLD."isActive" IS DISTINCT FROM NEW."isActive" THEN
            changedColumns := jsonb_set(changedColumns, '{isActive}', jsonb_build_object('old', OLD."isActive", 'new', NEW."isActive"));
        END IF;
        IF OLD."orgId" IS DISTINCT FROM NEW."orgId" THEN
            changedColumns := jsonb_set(changedColumns, '{orgId}', jsonb_build_object('old', OLD."orgId", 'new', NEW."orgId"));
        END IF;
        IF OLD."setSlackStatus" IS DISTINCT FROM NEW."setSlackStatus" THEN
            changedColumns := jsonb_set(changedColumns, '{setSlackStatus}', jsonb_build_object('old', OLD."setSlackStatus", 'new', NEW."setSlackStatus"));
        END IF;
        IF OLD."emoji" IS DISTINCT FROM NEW."emoji" THEN
            changedColumns := jsonb_set(changedColumns, '{emoji}', jsonb_build_object('old', OLD."emoji", 'new', NEW."emoji"));
        END IF;
        IF OLD."statusMsg" IS DISTINCT FROM NEW."statusMsg" THEN
            changedColumns := jsonb_set(changedColumns, '{statusMsg}', jsonb_build_object('old', OLD."statusMsg", 'new', NEW."statusMsg"));
        END IF;
        IF OLD."updatedBy" IS DISTINCT FROM NEW."updatedBy" THEN
            changedColumns := jsonb_set(changedColumns, '{updatedBy}', jsonb_build_object('old', OLD."updatedBy", 'new', NEW."updatedBy"));
        END IF;
        IF OLD."updatedOn" IS DISTINCT FROM NEW."updatedOn" THEN
            changedColumns := jsonb_set(changedColumns, '{updatedOn}', jsonb_build_object('old', OLD."updatedOn", 'new', NEW."updatedOn"));
        END IF;

        -- Insert the log entry only if there are changes
        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "orgId", "changedColumns", "changedBy", "keyword")
            VALUES (tableName, NEW."orgId", changedColumns, NEW."updatedBy", 'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."leavetype_activity_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."org_activity_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN

        IF OLD.dateformat IS DISTINCT FROM NEW.dateformat THEN
            changedColumns := jsonb_set(changedColumns, '{dateformat}', jsonb_build_object('old', OLD.dateformat, 'new', NEW.dateformat));
        END IF;

        IF OLD.timeformat IS DISTINCT FROM NEW.timeformat THEN
            changedColumns := jsonb_set(changedColumns, '{timeformat}', jsonb_build_object('old', OLD.timeformat, 'new', NEW.timeformat));
        END IF;

        IF OLD.location IS DISTINCT FROM NEW.location THEN
            changedColumns := jsonb_set(changedColumns, '{location}', jsonb_build_object('old', OLD.location, 'new', NEW.location));
        END IF;

        IF OLD.visibility IS DISTINCT FROM NEW.visibility THEN
            changedColumns := jsonb_set(changedColumns, '{visibility}', jsonb_build_object('old', OLD.visibility, 'new', NEW.visibility));
        END IF;

        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "orgId", "changedColumns", "changedBy", keyword)
            VALUES (tableName, NEW."orgId", changedColumns, NEW."updatedBy", 'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."org_activity_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."team_activity_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns if different
        IF OLD."name" IS DISTINCT FROM NEW."name" THEN
            changedColumns := jsonb_set(changedColumns, '{name}', jsonb_build_object('old', OLD."name", 'new', NEW."name"));
        END IF;
        IF OLD."orgId" IS DISTINCT FROM NEW."orgId" THEN
            changedColumns := jsonb_set(changedColumns, '{orgId}', jsonb_build_object('old', OLD."orgId", 'new', NEW."orgId"));
        END IF;
        IF OLD."isActive" IS DISTINCT FROM NEW."isActive" THEN
            changedColumns := jsonb_set(changedColumns, '{isActive}', jsonb_build_object('old', OLD."isActive", 'new', NEW."isActive"));
        END IF;
        IF OLD."managers" IS DISTINCT FROM NEW."managers" THEN
            changedColumns := jsonb_set(changedColumns, '{managers}', jsonb_build_object('old', OLD."managers", 'new', NEW."managers"));
        END IF;
        IF OLD."location" IS DISTINCT FROM NEW."location" THEN
            changedColumns := jsonb_set(changedColumns, '{location}', jsonb_build_object('old', OLD."location", 'new', NEW."location"));
        END IF;
        IF OLD."startOfWorkWeek" IS DISTINCT FROM NEW."startOfWorkWeek" THEN
            changedColumns := jsonb_set(changedColumns, '{startOfWorkWeek}', jsonb_build_object('old', OLD."startOfWorkWeek", 'new', NEW."startOfWorkWeek"));
        END IF;
        IF OLD."workweek" IS DISTINCT FROM NEW."workweek" THEN
            changedColumns := jsonb_set(changedColumns, '{workweek}', jsonb_build_object('old', OLD."workweek", 'new', NEW."workweek"));
        END IF;
        IF OLD."timeZone" IS DISTINCT FROM NEW."timeZone" THEN
            changedColumns := jsonb_set(changedColumns, '{timeZone}', jsonb_build_object('old', OLD."timeZone", 'new', NEW."timeZone"));
        END IF;
        IF OLD."notificationLeaveChanged" IS DISTINCT FROM NEW."notificationLeaveChanged" THEN
            changedColumns := jsonb_set(changedColumns, '{notificationLeaveChanged}', jsonb_build_object('old', OLD."notificationLeaveChanged", 'new', NEW."notificationLeaveChanged"));
        END IF;
        IF OLD."notificationDailySummary" IS DISTINCT FROM NEW."notificationDailySummary" THEN
            changedColumns := jsonb_set(changedColumns, '{notificationDailySummary}', jsonb_build_object('old', OLD."notificationDailySummary", 'new', NEW."notificationDailySummary"));
        END IF;
        IF OLD."notificationDailySummarySendOnTime" IS DISTINCT FROM NEW."notificationDailySummarySendOnTime" THEN
            changedColumns := jsonb_set(changedColumns, '{notificationDailySummarySendOnTime}', jsonb_build_object('old', OLD."notificationDailySummarySendOnTime", 'new', NEW."notificationDailySummarySendOnTime"));
        END IF;
        IF OLD."notificationWeeklySummary" IS DISTINCT FROM NEW."notificationWeeklySummary" THEN
            changedColumns := jsonb_set(changedColumns, '{notificationWeeklySummary}', jsonb_build_object('old', OLD."notificationWeeklySummary", 'new', NEW."notificationWeeklySummary"));
        END IF;
        IF OLD."notificationWeeklySummaryTime" IS DISTINCT FROM NEW."notificationWeeklySummaryTime" THEN
            changedColumns := jsonb_set(changedColumns, '{notificationWeeklySummaryTime}', jsonb_build_object('old', OLD."notificationWeeklySummaryTime", 'new', NEW."notificationWeeklySummaryTime"));
        END IF;
        IF OLD."notificationWeeklySummarySendOnDay" IS DISTINCT FROM NEW."notificationWeeklySummarySendOnDay" THEN
            changedColumns := jsonb_set(changedColumns, '{notificationWeeklySummarySendOnDay}', jsonb_build_object('old', OLD."notificationWeeklySummarySendOnDay", 'new', NEW."notificationWeeklySummarySendOnDay"));
        END IF;
        IF OLD."notificationToWhom" IS DISTINCT FROM NEW."notificationToWhom" THEN
            changedColumns := jsonb_set(changedColumns, '{notificationToWhom}', jsonb_build_object('old', OLD."notificationToWhom", 'new', NEW."notificationToWhom"));
        END IF;
        IF OLD."updatedBy" IS DISTINCT FROM NEW."updatedBy" THEN
            changedColumns := jsonb_set(changedColumns, '{updatedBy}', jsonb_build_object('old', OLD."updatedBy", 'new', NEW."updatedBy"));
        END IF;
        IF OLD."updatedOn" IS DISTINCT FROM NEW."updatedOn" THEN
            changedColumns := jsonb_set(changedColumns, '{updatedOn}', jsonb_build_object('old', OLD."updatedOn", 'new', NEW."updatedOn"));
        END IF;

        -- Insert the log entry only if there are changes
        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "teamId", "changedColumns", "changedBy", keyword)
            VALUES (tableName, NEW."teamId", changedColumns, NEW."updatedBy", 'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."team_activity_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_activity_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns if different
        IF OLD."name" IS DISTINCT FROM NEW."name" THEN
            changedColumns := jsonb_set(changedColumns, '{name}', jsonb_build_object('old', OLD."name", 'new', NEW."name"));
        END IF;
        IF OLD."email" IS DISTINCT FROM NEW."email" THEN
            changedColumns := jsonb_set(changedColumns, '{"email"}', jsonb_build_object('old', OLD."email", 'new', NEW."email"));
        END IF;
        IF OLD."picture" IS DISTINCT FROM NEW."picture" THEN
            changedColumns := jsonb_set(changedColumns, '{"picture"}', jsonb_build_object('old', OLD."picture", 'new', NEW."picture"));
        END IF;
        IF OLD."teamId" IS DISTINCT FROM NEW."teamId" THEN
            changedColumns := jsonb_set(changedColumns, '{"teamId"}', jsonb_build_object('old', OLD."teamId", 'new', NEW."teamId"));
        END IF;
        IF OLD."updatedBy" IS DISTINCT FROM NEW."updatedBy" THEN
            changedColumns := jsonb_set(changedColumns, '{"updatedBy"}', jsonb_build_object('old', OLD."updatedBy", 'new', NEW."updatedBy"));
        END IF;
        IF OLD."updatedOn" IS DISTINCT FROM NEW."updatedOn" THEN
            changedColumns := jsonb_set(changedColumns, '{"updatedOn"}', jsonb_build_object('old', OLD."updatedOn", 'new', NEW."updatedOn"));
        END IF;
        IF OLD."accruedLeave" IS DISTINCT FROM NEW."accruedLeave" THEN
            changedColumns := jsonb_set(changedColumns, '{accruedLeave}', jsonb_build_object('old', OLD."accruedLeave", 'new', NEW."accruedLeave"));
        END IF;
        IF OLD."usedLeave" IS DISTINCT FROM NEW."usedLeave" THEN
            changedColumns := jsonb_set(changedColumns, '{usedLeave}', jsonb_build_object('old', OLD."usedLeave", 'new', NEW."usedLeave"));
        END IF;
        IF OLD."keyword" IS DISTINCT FROM NEW."keyword" THEN
            changedColumns := jsonb_set(changedColumns, '{"keyword"}', jsonb_build_object('old', OLD."keyword", 'new', NEW."keyword"));
        END IF;
        IF OLD."slackId" IS DISTINCT FROM NEW."slackId" THEN
            changedColumns := jsonb_set(changedColumns, '{"slackId"}', jsonb_build_object('old', OLD."slackId", 'new', NEW."slackId"));
        END IF;
        IF OLD."googleId" IS DISTINCT FROM NEW."googleId" THEN
            changedColumns := jsonb_set(changedColumns, '{"googleId"}', jsonb_build_object('old', OLD."googleId", 'new', NEW."googleId"));
        END IF;
        IF OLD."orgId" IS DISTINCT FROM NEW."orgId" THEN
            changedColumns := jsonb_set(changedColumns, '{"orgId"}', jsonb_build_object('old', OLD."orgId", 'new', NEW."orgId"));
        END IF;

        -- Insert the log entry only if there are changes
        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "userId", "changedColumns", "changedBy", "keyword")
            VALUES (tableName, NEW."userId", changedColumns, NEW."updatedBy", 'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."user_activity_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_invite_log_function"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    tableName TEXT := TG_TABLE_NAME;
    changedColumns JSONB := '{}'::jsonb;
BEGIN
    -- Check if the operation is an INSERT
    IF TG_OP = 'INSERT' THEN
        -- Determine the keyword and insert accordingly
        IF NEW.keyword = 'joined' THEN
            INSERT INTO public."ActivityLog" ("tableName", "userId", "changedColumns", "changedBy", "keyword")
            VALUES (tableName, NEW."userId", NULL, NEW."updatedBy", 'joined');
        ELSE
            INSERT INTO public."ActivityLog" ("tableName", "userId", "changedColumns", "changedBy", "keyword")
            VALUES (tableName, NEW."userId", NULL, NEW."updatedBy", 'invitation');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."user_invite_log_function"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_leave_addon_log_fun"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare accruedLeave column and add to changedColumns if different
        IF OLD."accruedLeave" IS DISTINCT FROM NEW."accruedLeave" THEN
            changedColumns := jsonb_set(changedColumns, '{accruedLeave}', jsonb_build_object('old', OLD."accruedLeave", 'new', NEW."accruedLeave"));
        END IF;

        -- Insert the log entry only if there are changes
        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "userId", "changedColumns", "changedBy", keyword)
            VALUES (tableName, NEW."userId", changedColumns, NEW."updatedBy", 'accrual');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."user_leave_addon_log_fun"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ActivityLog" (
    "id" integer NOT NULL,
    "orgId" "uuid",
    "changedColumns" "jsonb",
    "changedOn" timestamp(6) without time zone DEFAULT "now"(),
    "changedBy" character varying(255),
    "tableName" character varying,
    "teamId" "uuid",
    "userId" "uuid",
    "keyword" character varying,
    "createdBy" character varying(255),
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"()
);


ALTER TABLE "public"."ActivityLog" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ActivityLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."ActivityLog_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ActivityLog_id_seq" OWNED BY "public"."ActivityLog"."id";



CREATE TABLE IF NOT EXISTS "public"."ContactEmail" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "firstName" character varying(255),
    "lastName" character varying(255),
    "email" character varying(255),
    "message" character varying(255)
);


ALTER TABLE "public"."ContactEmail" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Holiday" (
    "holidayId" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "date" timestamp(6) without time zone NOT NULL,
    "location" character varying(255),
    "isRecurring" boolean DEFAULT true NOT NULL,
    "isCustom" boolean DEFAULT true NOT NULL,
    "orgId" "uuid" NOT NULL,
    "createdBy" character varying(255),
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"()
);


ALTER TABLE "public"."Holiday" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Leave" (
    "leaveId" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "leaveTypeId" "uuid" NOT NULL,
    "startDate" "date" NOT NULL,
    "endDate" "date" NOT NULL,
    "duration" "public"."LeaveDuration" DEFAULT 'FULL_DAY'::"public"."LeaveDuration" NOT NULL,
    "shift" "public"."Shift" DEFAULT 'NONE'::"public"."Shift" NOT NULL,
    "isApproved" "public"."LeaveStatus" DEFAULT 'PENDING'::"public"."LeaveStatus" NOT NULL,
    "userId" "uuid" NOT NULL,
    "teamId" "uuid" NOT NULL,
    "reason" character varying(255),
    "managerComment" character varying(255),
    "orgId" "uuid" NOT NULL,
    "createdBy" character varying(255),
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"()
);


ALTER TABLE "public"."Leave" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."LeavePolicy" (
    "leavePolicyId" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "leaveTypeId" "uuid" NOT NULL,
    "unlimited" boolean DEFAULT false NOT NULL,
    "maxLeaves" integer,
    "accruals" boolean DEFAULT false NOT NULL,
    "accrualFrequency" "public"."AccuralFrequencyOptions",
    "accrueOn" "public"."AccrueOnOptions",
    "rollOver" boolean DEFAULT false NOT NULL,
    "rollOverLimit" integer,
    "teamId" "uuid" NOT NULL,
    "rollOverExpiry" character varying(5),
    "autoApprove" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdBy" character varying(255),
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"(),
    CONSTRAINT "LeavePolicy_rollOverExpiry_check" CHECK ((("rollOverExpiry")::"text" ~ '^\d{2}/\d{2}$'::"text"))
);


ALTER TABLE "public"."LeavePolicy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."LeaveType" (
    "leaveTypeId" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "color" character varying(6),
    "isActive" boolean DEFAULT true NOT NULL,
    "orgId" "uuid" NOT NULL,
    "setSlackStatus" boolean DEFAULT true NOT NULL,
    "emoji" character varying,
    "statusMsg" character varying(255),
    "createdBy" character varying(255),
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"()
);


ALTER TABLE "public"."LeaveType" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."OrgAccessData" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "orgId" "uuid",
    "slackAccessToken" "text",
    "slackRefreshToken" "text",
    "googleAccessToken" "text",
    "googleRefreshToken" "text",
    "ownerSlackId" "text",
    "createdBy" character varying(255),
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"()
);


ALTER TABLE "public"."OrgAccessData" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Organisation" (
    "orgId" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscriptionId" character varying(255),
    "dateformat" character varying(255) DEFAULT 'dd/mm/yyyy'::character varying NOT NULL,
    "timeformat" character varying(255) DEFAULT '12-hour'::character varying NOT NULL,
    "location" character varying(255)[],
    "visibility" "public"."Visibility" DEFAULT 'SELF'::"public"."Visibility" NOT NULL,
    "ownerId" "uuid",
    "halfDayLeave" boolean DEFAULT false NOT NULL,
    "initialSetup" character varying(1) DEFAULT 0,
    "isSetupCompleted" boolean DEFAULT false,
    "createdBy" character varying(255),
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"()
);


ALTER TABLE "public"."Organisation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PaySubMap" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "razorpayPaymentId" character varying(255),
    "razorpaySignature" character varying(255),
    "razorpaySubscriptionId" character varying(255)
);


ALTER TABLE "public"."PaySubMap" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PublicHolidays" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country" character varying(50),
    "iso" character(2),
    "year" integer,
    "date" "date",
    "day" character varying(15),
    "name" character varying(100),
    "type" character varying(50)
);


ALTER TABLE "public"."PublicHolidays" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Subscription" (
    "id" character varying(255) NOT NULL,
    "entity" character varying(50),
    "planId" character varying(255),
    "customerId" character varying(255),
    "status" character varying(50),
    "currentStart" integer,
    "currentEnd" integer,
    "endedAt" integer,
    "quantity" integer,
    "note" character varying(255),
    "chargeAt" integer,
    "offerId" character varying(255),
    "startAt" integer,
    "endAt" integer,
    "authAttempts" integer,
    "totalCount" integer,
    "paidCount" integer,
    "customerNotify" boolean,
    "createdAt" integer,
    "expireBy" integer,
    "shortUrl" character varying(255),
    "hasScheduledChanges" boolean,
    "scheduleChangeAt" integer,
    "remainingCount" integer
);


ALTER TABLE "public"."Subscription" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Team" (
    "teamId" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "orgId" "uuid" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "managers" "uuid"[],
    "location" character varying(255),
    "startOfWorkWeek" "public"."DaysOfWeek" DEFAULT 'MONDAY'::"public"."DaysOfWeek",
    "workweek" "public"."DaysOfWeek"[] DEFAULT ARRAY['MONDAY'::"public"."DaysOfWeek", 'TUESDAY'::"public"."DaysOfWeek", 'WEDNESDAY'::"public"."DaysOfWeek", 'THURSDAY'::"public"."DaysOfWeek", 'FRIDAY'::"public"."DaysOfWeek", 'SATURDAY'::"public"."DaysOfWeek", 'SUNDAY'::"public"."DaysOfWeek"],
    "timeZone" character varying(255),
    "notificationLeaveChanged" boolean DEFAULT false NOT NULL,
    "notificationDailySummary" boolean DEFAULT false NOT NULL,
    "notificationDailySummarySendOnTime" "text",
    "notificationWeeklySummary" boolean DEFAULT false NOT NULL,
    "notificationWeeklySummaryTime" "text",
    "notificationWeeklySummarySendOnDay" "public"."DaysOfWeek",
    "notificationToWhom" "public"."Role"[] DEFAULT ARRAY['MANAGER'::"public"."Role"] NOT NULL,
    "createdBy" character varying(255),
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"()
);


ALTER TABLE "public"."Team" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."User" (
    "userId" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "picture" "text",
    "teamId" "uuid",
    "role" "public"."Role" DEFAULT 'USER'::"public"."Role" NOT NULL,
    "accruedLeave" "jsonb" DEFAULT '{}'::"jsonb",
    "usedLeave" "jsonb" DEFAULT '{}'::"jsonb",
    "keyword" character varying,
    "slackId" "text",
    "googleId" "text",
    "orgId" "uuid",
    "overrides" "jsonb" DEFAULT '{}'::"jsonb",
    "createdBy" character varying(255),
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"()
);


ALTER TABLE "public"."User" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."leave_summary" AS
 SELECT "Leave"."userId",
    "Leave"."leaveTypeId",
    "Leave"."isApproved",
    "count"(*) AS "count"
   FROM "public"."Leave"
  GROUP BY "Leave"."userId", "Leave"."leaveTypeId", "Leave"."isApproved";


ALTER TABLE "public"."leave_summary" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ActivityLog" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ActivityLog_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ActivityLog"
    ADD CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ContactEmail"
    ADD CONSTRAINT "ContactEmail_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Holiday"
    ADD CONSTRAINT "Holiday_pkey" PRIMARY KEY ("holidayId");



ALTER TABLE ONLY "public"."LeavePolicy"
    ADD CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("leavePolicyId");



ALTER TABLE ONLY "public"."LeaveType"
    ADD CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("leaveTypeId");



ALTER TABLE ONLY "public"."Leave"
    ADD CONSTRAINT "Leave_pkey" PRIMARY KEY ("leaveId");



ALTER TABLE ONLY "public"."OrgAccessData"
    ADD CONSTRAINT "OrgAccessData_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Organisation"
    ADD CONSTRAINT "Organisation_pkey" PRIMARY KEY ("orgId");



ALTER TABLE ONLY "public"."PaySubMap"
    ADD CONSTRAINT "PaySubMap_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PublicHolidays"
    ADD CONSTRAINT "PublicHolidays_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Team"
    ADD CONSTRAINT "Team_pkey" PRIMARY KEY ("teamId");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("userId");



CREATE INDEX "idx_holiday_date" ON "public"."Holiday" USING "btree" ("date");



CREATE INDEX "idx_holiday_org_id" ON "public"."Holiday" USING "btree" ("orgId");



CREATE INDEX "idx_holiday_recurring" ON "public"."Holiday" USING "btree" ("isRecurring");



CREATE INDEX "idx_leave_end_date" ON "public"."Leave" USING "btree" ("endDate");



CREATE INDEX "idx_leave_org_id" ON "public"."Leave" USING "btree" ("orgId");



CREATE INDEX "idx_leave_start_date" ON "public"."Leave" USING "btree" ("startDate");



CREATE INDEX "idx_leave_status" ON "public"."Leave" USING "btree" ("isApproved");



CREATE INDEX "idx_leave_team_id" ON "public"."Leave" USING "btree" ("teamId");



CREATE INDEX "idx_leave_user_id" ON "public"."Leave" USING "btree" ("userId");



CREATE INDEX "idx_leave_user_start_date" ON "public"."Leave" USING "btree" ("userId", "startDate");



CREATE INDEX "idx_leavepolicy_active" ON "public"."LeavePolicy" USING "btree" ("isActive");



CREATE INDEX "idx_leavepolicy_type_team" ON "public"."LeavePolicy" USING "btree" ("leaveTypeId", "teamId");



CREATE INDEX "idx_leavetype_active" ON "public"."LeaveType" USING "btree" ("isActive");



CREATE INDEX "idx_leavetype_org_id" ON "public"."LeaveType" USING "btree" ("orgId");



CREATE INDEX "idx_orgaccessdata_org_id" ON "public"."OrgAccessData" USING "btree" ("orgId");



CREATE INDEX "idx_organisation_owner_id" ON "public"."Organisation" USING "btree" ("ownerId");



CREATE INDEX "idx_organisation_subscription_id" ON "public"."Organisation" USING "btree" ("subscriptionId");



CREATE INDEX "idx_team_manager" ON "public"."Team" USING "btree" ("managers");



CREATE INDEX "idx_team_org_id" ON "public"."Team" USING "btree" ("orgId");



CREATE INDEX "idx_user_email" ON "public"."User" USING "btree" ("email");



CREATE INDEX "idx_user_org_id" ON "public"."User" USING "btree" ("orgId");



CREATE INDEX "idx_user_team_id" ON "public"."User" USING "btree" ("teamId");



CREATE OR REPLACE TRIGGER "leave_approved_activity_audit_trigger" AFTER UPDATE ON "public"."Leave" FOR EACH ROW EXECUTE FUNCTION "public"."leave_approved_activity_audit"();



CREATE OR REPLACE TRIGGER "leave_request_activity_audit_trigger" AFTER INSERT ON "public"."Leave" FOR EACH ROW EXECUTE FUNCTION "public"."leave_request_activity_audit"();



CREATE OR REPLACE TRIGGER "leavepolicy_activity_audit_trigger" AFTER UPDATE ON "public"."LeavePolicy" FOR EACH ROW EXECUTE FUNCTION "public"."leavepolicy_activity_audit"();



CREATE OR REPLACE TRIGGER "leavetype_activity_audit_trigger" AFTER UPDATE ON "public"."LeaveType" FOR EACH ROW EXECUTE FUNCTION "public"."leavetype_activity_audit"();



CREATE OR REPLACE TRIGGER "org_activity_audit_trigger" AFTER UPDATE ON "public"."Organisation" FOR EACH ROW EXECUTE FUNCTION "public"."org_activity_audit"();



CREATE OR REPLACE TRIGGER "team_activity_audit_trigger" AFTER UPDATE ON "public"."Team" FOR EACH ROW EXECUTE FUNCTION "public"."team_activity_audit"();



CREATE OR REPLACE TRIGGER "user_activity_audit_trigger" AFTER UPDATE ON "public"."User" FOR EACH ROW EXECUTE FUNCTION "public"."user_activity_audit"();



CREATE OR REPLACE TRIGGER "user_invite_log_trigger" AFTER INSERT OR UPDATE ON "public"."User" FOR EACH ROW EXECUTE FUNCTION "public"."user_invite_log_function"();



CREATE OR REPLACE TRIGGER "user_leave_addon_log_trigger" AFTER UPDATE ON "public"."User" FOR EACH ROW EXECUTE FUNCTION "public"."user_leave_addon_log_fun"();



ALTER TABLE ONLY "public"."ActivityLog"
    ADD CONSTRAINT "fk_activity_org" FOREIGN KEY ("orgId") REFERENCES "public"."Organisation"("orgId");



ALTER TABLE ONLY "public"."ActivityLog"
    ADD CONSTRAINT "fk_activity_team" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("teamId");



ALTER TABLE ONLY "public"."ActivityLog"
    ADD CONSTRAINT "fk_activity_user" FOREIGN KEY ("userId") REFERENCES "public"."User"("userId");



ALTER TABLE ONLY "public"."Holiday"
    ADD CONSTRAINT "fk_holiday_org" FOREIGN KEY ("orgId") REFERENCES "public"."Organisation"("orgId");



ALTER TABLE ONLY "public"."Leave"
    ADD CONSTRAINT "fk_leave_leavetype" FOREIGN KEY ("leaveTypeId") REFERENCES "public"."LeaveType"("leaveTypeId") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Leave"
    ADD CONSTRAINT "fk_leave_org" FOREIGN KEY ("orgId") REFERENCES "public"."Organisation"("orgId");



ALTER TABLE ONLY "public"."Leave"
    ADD CONSTRAINT "fk_leave_team" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("teamId");



ALTER TABLE ONLY "public"."Leave"
    ADD CONSTRAINT "fk_leave_user" FOREIGN KEY ("userId") REFERENCES "public"."User"("userId");



ALTER TABLE ONLY "public"."LeavePolicy"
    ADD CONSTRAINT "fk_leavepolicy_leavetype" FOREIGN KEY ("leaveTypeId") REFERENCES "public"."LeaveType"("leaveTypeId");



ALTER TABLE ONLY "public"."LeavePolicy"
    ADD CONSTRAINT "fk_leavepolicy_team" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("teamId");



ALTER TABLE ONLY "public"."LeaveType"
    ADD CONSTRAINT "fk_leavetype_org" FOREIGN KEY ("orgId") REFERENCES "public"."Organisation"("orgId");



ALTER TABLE ONLY "public"."OrgAccessData"
    ADD CONSTRAINT "fk_orgaccessdata_org" FOREIGN KEY ("orgId") REFERENCES "public"."Organisation"("orgId");



ALTER TABLE ONLY "public"."Team"
    ADD CONSTRAINT "fk_team_org" FOREIGN KEY ("orgId") REFERENCES "public"."Organisation"("orgId");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "fk_user_org" FOREIGN KEY ("orgId") REFERENCES "public"."Organisation"("orgId");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "fk_user_team" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("teamId") ON DELETE RESTRICT;



ALTER TABLE "public"."ContactEmail" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Holiday" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Leave" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."LeavePolicy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."LeaveType" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Organisation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."PaySubMap" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Subscription" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Team" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_delete_users" ON "public"."User" FOR DELETE USING (("userId" = "auth"."uid"()));



CREATE POLICY "holiday_delete" ON "public"."Holiday" FOR DELETE USING (true);



CREATE POLICY "holiday_insert" ON "public"."Holiday" FOR INSERT WITH CHECK (true);



CREATE POLICY "holiday_select" ON "public"."Holiday" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = ANY ((ARRAY['MANAGER'::character varying, 'USER'::character varying, 'OWNER'::character varying])::"text"[])) AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "holiday_update" ON "public"."Holiday" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text") AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "leave_insert" ON "public"."Leave" FOR INSERT WITH CHECK (((("auth"."role"() = 'authenticated'::"text") AND ((("teamId" = "public"."fetch_user_teamid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'MANAGER'::"text")) OR (("orgId" = "public"."fetch_user_orgid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text")))) OR ("auth"."uid"() = "userId")));



CREATE POLICY "leave_select" ON "public"."Leave" FOR SELECT USING (((("auth"."role"() = 'authenticated'::"text") AND ((("teamId" = "public"."fetch_user_teamid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'MANAGER'::"text")) OR (("orgId" = "public"."fetch_user_orgid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text")))) OR ("auth"."uid"() = "userId")));



CREATE POLICY "leave_update" ON "public"."Leave" FOR UPDATE USING (((("auth"."role"() = 'authenticated'::"text") AND ((("teamId" = "public"."fetch_user_teamid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'MANAGER'::"text")) OR (("orgId" = "public"."fetch_user_orgid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text")))) OR ("auth"."uid"() = "userId")));



CREATE POLICY "leavepolicy_insert" ON "public"."LeavePolicy" FOR INSERT WITH CHECK (true);



CREATE POLICY "leavepolicy_select" ON "public"."LeavePolicy" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = ANY ((ARRAY['MANAGER'::character varying, 'USER'::character varying, 'OWNER'::character varying])::"text"[])) AND ("teamId" = "public"."fetch_user_teamid"("auth"."uid"())))));



CREATE POLICY "leavepolicy_update" ON "public"."LeavePolicy" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text") AND ("teamId" = "public"."fetch_user_teamid"("auth"."uid"())))));



CREATE POLICY "leavetype_insert" ON "public"."LeaveType" FOR INSERT WITH CHECK (true);



CREATE POLICY "leavetype_select" ON "public"."LeaveType" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = ANY ((ARRAY['MANAGER'::character varying, 'USER'::character varying, 'OWNER'::character varying])::"text"[])) AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "leavetype_update" ON "public"."LeaveType" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text") AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "org_insert" ON "public"."Organisation" FOR INSERT WITH CHECK (true);



CREATE POLICY "org_select" ON "public"."Organisation" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = ANY ((ARRAY['MANAGER'::character varying, 'USER'::character varying, 'OWNER'::character varying])::"text"[])) AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "org_update" ON "public"."Organisation" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text") AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "team_insert" ON "public"."Team" FOR INSERT WITH CHECK (true);



CREATE POLICY "team_select" ON "public"."Team" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (((("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text") AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"()))) OR ((("public"."fetch_user_role"("auth"."uid"()))::"text" = ANY ((ARRAY['MANAGER'::character varying, 'USER'::character varying])::"text"[])) AND ("teamId" = "public"."fetch_user_teamid"("auth"."uid"()))))));



CREATE POLICY "team_update" ON "public"."Team" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND (((("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text") AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"()))) OR ((("public"."fetch_user_role"("auth"."uid"()))::"text" = ANY ((ARRAY['MANAGER'::character varying, 'USER'::character varying])::"text"[])) AND ("teamId" = "public"."fetch_user_teamid"("auth"."uid"()))))));



CREATE POLICY "user_insert" ON "public"."User" FOR INSERT WITH CHECK (true);



CREATE POLICY "user_select" ON "public"."User" FOR SELECT USING (((("auth"."role"() = 'authenticated'::"text") AND ((("teamId" = "public"."fetch_user_teamid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'MANAGER'::"text")) OR (("orgId" = "public"."fetch_user_orgid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text")))) OR ("auth"."uid"() = "userId")));



CREATE POLICY "user_update" ON "public"."User" FOR UPDATE USING (((("auth"."role"() = 'authenticated'::"text") AND ((("teamId" = "public"."fetch_user_teamid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'MANAGER'::"text")) OR (("orgId" = "public"."fetch_user_orgid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text")))) OR ("auth"."uid"() = "userId")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";









































































































































































































GRANT ALL ON FUNCTION "public"."auth_to_user_uuid_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_to_user_uuid_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_to_user_uuid_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_accruals"("frequency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_accruals"("frequency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_accruals"("frequency" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fetch_user_orgid"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fetch_user_orgid"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_user_orgid"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fetch_user_role"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fetch_user_role"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_user_role"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fetch_user_teamid"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fetch_user_teamid"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_user_teamid"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."leave_approved_activity_audit"() TO "anon";
GRANT ALL ON FUNCTION "public"."leave_approved_activity_audit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_approved_activity_audit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."leave_request_activity_audit"() TO "anon";
GRANT ALL ON FUNCTION "public"."leave_request_activity_audit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_request_activity_audit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."leavepolicy_activity_audit"() TO "anon";
GRANT ALL ON FUNCTION "public"."leavepolicy_activity_audit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leavepolicy_activity_audit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."leavetype_activity_audit"() TO "anon";
GRANT ALL ON FUNCTION "public"."leavetype_activity_audit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leavetype_activity_audit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."org_activity_audit"() TO "anon";
GRANT ALL ON FUNCTION "public"."org_activity_audit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."org_activity_audit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."team_activity_audit"() TO "anon";
GRANT ALL ON FUNCTION "public"."team_activity_audit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."team_activity_audit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_activity_audit"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_activity_audit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_activity_audit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_invite_log_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_invite_log_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_invite_log_function"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_leave_addon_log_fun"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_leave_addon_log_fun"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_leave_addon_log_fun"() TO "service_role";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;


















GRANT ALL ON TABLE "public"."ActivityLog" TO "anon";
GRANT ALL ON TABLE "public"."ActivityLog" TO "authenticated";
GRANT ALL ON TABLE "public"."ActivityLog" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ActivityLog" TO "supabase_auth_admin";



GRANT ALL ON SEQUENCE "public"."ActivityLog_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ActivityLog_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ActivityLog_id_seq" TO "service_role";
GRANT SELECT,USAGE ON SEQUENCE "public"."ActivityLog_id_seq" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."ContactEmail" TO "anon";
GRANT ALL ON TABLE "public"."ContactEmail" TO "authenticated";
GRANT ALL ON TABLE "public"."ContactEmail" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."ContactEmail" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."Holiday" TO "anon";
GRANT ALL ON TABLE "public"."Holiday" TO "authenticated";
GRANT ALL ON TABLE "public"."Holiday" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."Holiday" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."Leave" TO "anon";
GRANT ALL ON TABLE "public"."Leave" TO "authenticated";
GRANT ALL ON TABLE "public"."Leave" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."Leave" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."LeavePolicy" TO "anon";
GRANT ALL ON TABLE "public"."LeavePolicy" TO "authenticated";
GRANT ALL ON TABLE "public"."LeavePolicy" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."LeavePolicy" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."LeaveType" TO "anon";
GRANT ALL ON TABLE "public"."LeaveType" TO "authenticated";
GRANT ALL ON TABLE "public"."LeaveType" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."LeaveType" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."OrgAccessData" TO "anon";
GRANT ALL ON TABLE "public"."OrgAccessData" TO "authenticated";
GRANT ALL ON TABLE "public"."OrgAccessData" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."OrgAccessData" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."Organisation" TO "anon";
GRANT ALL ON TABLE "public"."Organisation" TO "authenticated";
GRANT ALL ON TABLE "public"."Organisation" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."Organisation" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."PaySubMap" TO "anon";
GRANT ALL ON TABLE "public"."PaySubMap" TO "authenticated";
GRANT ALL ON TABLE "public"."PaySubMap" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."PaySubMap" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."PublicHolidays" TO "anon";
GRANT ALL ON TABLE "public"."PublicHolidays" TO "authenticated";
GRANT ALL ON TABLE "public"."PublicHolidays" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."PublicHolidays" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."Subscription" TO "anon";
GRANT ALL ON TABLE "public"."Subscription" TO "authenticated";
GRANT ALL ON TABLE "public"."Subscription" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."Subscription" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."Team" TO "anon";
GRANT ALL ON TABLE "public"."Team" TO "authenticated";
GRANT ALL ON TABLE "public"."Team" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."Team" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."User" TO "anon";
GRANT ALL ON TABLE "public"."User" TO "authenticated";
GRANT ALL ON TABLE "public"."User" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."User" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."leave_summary" TO "anon";
GRANT ALL ON TABLE "public"."leave_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_summary" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."leave_summary" TO "supabase_auth_admin";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

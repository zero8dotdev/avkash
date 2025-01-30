

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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";


CREATE TYPE "public"."AccrueOnOptions" AS ENUM (
    'BEGINNING',
    'END'
);


ALTER TYPE "public"."AccrueOnOptions" OWNER TO "postgres";


CREATE TYPE "public"."AccuralFrequencyOptions" AS ENUM (
    'BIWEEKLY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'HALF_YEARLY'
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
    'ANON'
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


CREATE OR REPLACE FUNCTION "public"."create_org_team_user"("org_name" "text", "team_name" "text", "user_name" "text", "user_email" "text", OUT "org_id" "uuid", OUT "team_id" "uuid", OUT "user_id" "uuid") RETURNS "record"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    existing_org RECORD;
    new_org_id UUID;
    new_team_id UUID;
    new_user_id UUID;
BEGIN
    -- Check if the organization already exists
    SELECT * INTO existing_org
    FROM "Organisation"
    WHERE name = org_name;

    IF FOUND THEN
        RAISE EXCEPTION 'Organisation already exists';
    ELSE
        -- Insert into Organisation
        INSERT INTO "Organisation" (name)
        VALUES (org_name)
        RETURNING "orgId" INTO new_org_id;

        -- Insert into Team
        INSERT INTO "Team" (name, "orgId")
        VALUES (team_name, new_org_id)
        RETURNING "teamId" INTO new_team_id;

        -- Insert into User
        INSERT INTO "User" (name, email, "teamId", role, "accruedLeave", "usedLeave","orgId")
        VALUES (user_name, user_email, new_team_id, 'OWNER', 0, 0, new_org_id)
        RETURNING "userId" INTO new_user_id;

        -- Update Team with manager
        UPDATE "Team"
        SET manager = new_user_id
        WHERE "teamId" = new_team_id;

        -- Set OUT parameters
        org_id := new_org_id;
        team_id := new_team_id;
        user_id := new_user_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."create_org_team_user"("org_name" "text", "team_name" "text", "user_name" "text", "user_email" "text", OUT "org_id" "uuid", OUT "team_id" "uuid", OUT "user_id" "uuid") OWNER TO "postgres";


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
    user_role TEXT;
BEGIN
    -- Select the role, teamId, and orgId of the user where userId matches the given id
    SELECT "role" INTO user_role
    FROM "User"
    WHERE "userId" = id
    LIMIT 1;

    -- Return the result as a JSON object
    RETURN user_role;
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


CREATE OR REPLACE FUNCTION "public"."get_leave_types_by_user_id"("id" "uuid") RETURNS TABLE("leavetypeid" "uuid", "name" character varying, "color" character varying, "isactive" boolean, "orgid" "uuid", "setslackstatus" boolean, "emoji" character varying, "statusmsg" character varying, "createdon" timestamp without time zone, "createdby" character varying, "updatedby" character varying, "updatedon" timestamp without time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        lt."leaveTypeId",
        lt."name",
        lt."color",
        lt."isActive",
        lt."orgId",
        lt."setSlackStatus",
        lt."emoji",
        lt."statusMsg",
        lt."createdOn",
        lt."createdBy",
        lt."updatedBy",
        lt."updatedOn"
    FROM
        "User" u
    JOIN
        "LeaveType" lt
    ON
        u."orgId" = lt."orgId"
    WHERE
        u."userId" = id;
END;
$$;


ALTER FUNCTION "public"."get_leave_types_by_user_id"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_leaves_by_team"("id" "uuid") RETURNS TABLE("leaveid" "uuid", "leavetype" character varying, "startdate" timestamp without time zone, "enddate" timestamp without time zone, "duration" "public"."LeaveDuration", "shift" "public"."Shift", "isapproved" "public"."LeaveStatus", "userid" "uuid", "username" character varying, "teamid" "uuid", "teamname" character varying, "reason" character varying, "orgid" "uuid", "orgname" character varying, "createdon" timestamp without time zone, "createdby" character varying, "updatedby" character varying, "updatedon" timestamp without time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lv."leaveId",
        lv."leaveType",
        lv."startDate",
        lv."endDate",
        lv."duration",
        lv."shift",
        lv."isApproved",
        lv."userId",
        usr."name" AS "userName",
        lv."teamId",
        team."name" AS "teamName",
        lv."reason",
        lv."orgId",
        org."name" AS "orgName",
        lv."createdOn",
        lv."createdBy",
        lv."updatedBy",
        lv."updatedOn"
    FROM 
        "Leave" lv
    JOIN 
        "User" usr ON lv."userId" = usr."userId"
    JOIN 
        "Team" team ON lv."teamId" = team."teamId"
    JOIN 
        "Organisation" org ON lv."orgId" = org."orgId"
    WHERE 
        lv."teamId" = id;
END;
$$;


ALTER FUNCTION "public"."get_leaves_by_team"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_leaves_by_user_id"("id" "uuid") RETURNS TABLE("leaveid" "uuid", "leavetype" character varying, "startdate" timestamp without time zone, "enddate" timestamp without time zone, "duration" "public"."LeaveDuration", "shift" "public"."Shift", "isapproved" "public"."LeaveStatus", "userid" "uuid", "teamid" "uuid", "reason" character varying, "orgid" "uuid", "createdon" timestamp without time zone, "createdby" character varying, "updatedby" character varying, "updatedon" timestamp without time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l."leaveId",
        l."leaveType",
        l."startDate",
        l."endDate",
        l."duration",
        l."shift",
        l."isApproved",
        l."userId",
        l."teamId",
        l."reason",
        l."orgId",
        l."createdOn",
        l."createdBy",
        l."updatedBy",
        l."updatedOn"
    FROM 
        "Leave" l
    WHERE 
        l."userId" = id;
END;
$$;


ALTER FUNCTION "public"."get_leaves_by_user_id"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_leaves_by_user_org"("id" "uuid") RETURNS TABLE("leaveid" "uuid", "leavetype" character varying, "startdate" timestamp without time zone, "enddate" timestamp without time zone, "duration" "public"."LeaveDuration", "shift" "public"."Shift", "isapproved" "public"."LeaveStatus", "userid" "uuid", "username" character varying, "teamid" "uuid", "teamname" character varying, "reason" character varying, "orgid" "uuid", "orgname" character varying, "createdon" timestamp without time zone, "createdby" character varying, "updatedby" character varying, "updatedon" timestamp without time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lv."leaveId",
        lv."leaveType",
        lv."startDate",
        lv."endDate",
        lv."duration",
        lv."shift",
        lv."isApproved",
        lv."userId",
        usr."name" AS "userName",
        lv."teamId",
        team."name" AS "teamName",
        lv."reason",
        lv."orgId",
        org."name" AS "orgName",
        lv."createdOn",
        lv."createdBy",
        lv."updatedBy",
        lv."updatedOn"
    FROM 
        "Leave" lv
    JOIN 
        "User" usr ON lv."userId" = usr."userId"
    JOIN 
        "Team" team ON lv."teamId" = team."teamId"
    JOIN 
        "Organisation" org ON lv."orgId" = org."orgId"
    WHERE 
        lv."orgId" = (SELECT "orgId" FROM "User" WHERE "userId" = id);
END;
$$;


ALTER FUNCTION "public"."get_leaves_by_user_org"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_by_id"("id" "uuid") RETURNS TABLE("teamid" "uuid", "name" character varying, "orgid" "uuid", "isactive" boolean, "manager" "uuid", "createdon" timestamp without time zone, "createdby" character varying, "updatedby" character varying, "updatedon" timestamp without time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        team."teamId",
        team."name",
        team."orgId",
        team."isActive",
        team."manager",
        team."createdOn",
        team."createdBy",
        team."updatedBy",
        team."updatedOn"
    FROM 
        "Team" team
    WHERE 
        team."teamId" = id;
END;
$$;


ALTER FUNCTION "public"."get_team_by_id"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_teams_by_org"("id" "uuid") RETURNS TABLE("teamid" "uuid", "name" character varying, "orgid" "uuid", "isactive" boolean, "manager" "uuid", "createdon" timestamp without time zone, "createdby" character varying, "updatedby" character varying, "updatedon" timestamp without time zone, "orgname" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        team."teamId",
        team."name",
        team."orgId",
        team."isActive",
        team."manager",
        team."createdOn",
        team."createdBy",
        team."updatedBy",
        team."updatedOn",
        org."name" AS "orgName"
    FROM 
        "Team" team
    JOIN 
        "Organisation" org ON team."orgId" = org."orgId"
    WHERE 
        team."orgId" = id;
END;
$$;


ALTER FUNCTION "public"."get_teams_by_org"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_data_by_id"("id" "uuid") RETURNS TABLE("userid" "uuid", "name" character varying, "email" character varying, "teamid" "uuid", "role" "public"."Role", "createdon" timestamp without time zone, "createdby" character varying, "updatedby" character varying, "updatedon" timestamp without time zone, "accruedleave" integer, "usedleave" integer, "keyword" character varying, "orgid" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u."userId",
        u."name",
        u."email",
        u."teamId",
        u."role",
        u."createdOn",
        u."createdBy",
        u."updatedBy",
        u."updatedOn",
        u."accruedLeave",
        u."usedLeave",
        u."keyword",
        u."orgId"
    FROM 
        "User" u
    WHERE 
        u."userId" = id;
END;
$$;


ALTER FUNCTION "public"."get_user_data_by_id"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_org_visibility"("id" "uuid") RETURNS character varying
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    org_visibility VARCHAR;
BEGIN
    SELECT o."visibility" INTO org_visibility
    FROM "User" u
    JOIN "Organisation" o ON u."orgId" = o."orgId"
    WHERE u."userId" = id;

    RETURN org_visibility;
END;
$$;


ALTER FUNCTION "public"."get_user_org_visibility"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_teams"("id" "uuid") RETURNS TABLE("teamid" "uuid", "name" character varying, "orgid" "uuid", "isactive" boolean, "manager" "uuid", "createdon" timestamp without time zone, "createdby" character varying, "updatedby" character varying, "updatedon" timestamp without time zone, "orgname" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        team."teamId",
        team."name",
        team."orgId",
        team."isActive",
        team."manager",
        team."createdOn",
        team."createdBy",
        team."updatedBy",
        team."updatedOn",
        org."name" AS "orgName"
    FROM 
        "Team" team
    JOIN 
        "Organisation" org ON team."orgId" = org."orgId"
    WHERE 
        org."orgId" = (SELECT "orgId" FROM "User" WHERE "userId" = id);
END;
$$;


ALTER FUNCTION "public"."get_user_teams"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_by_organization"("id" "uuid") RETURNS TABLE("userid" "uuid", "name" character varying, "email" character varying, "role" "public"."Role", "createdon" timestamp without time zone, "createdby" character varying, "updatedby" character varying, "updatedon" timestamp without time zone, "accruedleave" integer, "usedleave" integer, "keyword" character varying, "teamid" "uuid", "teamname" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        usr."userId",
        usr."name",
        usr."email",
        usr."role",
        usr."createdOn",
        usr."createdBy",
        usr."updatedBy",
        usr."updatedOn",
        usr."accruedLeave",
        usr."usedLeave",
        usr."keyword",
        usr."teamId",
        team."name" AS "teamName"
    FROM 
        "User" usr
    JOIN 
        "Organisation" org ON usr."orgId" = org."orgId"
    LEFT JOIN 
        "Team" team ON usr."teamId" = team."teamId"
    WHERE 
        usr."orgId" = (SELECT "orgId" FROM "User" WHERE "userId" = id);
END;
$$;


ALTER FUNCTION "public"."get_users_by_organization"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_by_team_id"("id" "uuid") RETURNS TABLE("userid" "uuid", "name" character varying, "email" character varying, "teamid" "uuid", "teamname" character varying, "role" "public"."Role", "createdon" timestamp without time zone, "createdby" character varying, "updatedby" character varying, "updatedon" timestamp without time zone, "accruedleave" integer, "usedleave" integer, "keyword" character varying, "orgid" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        usr."userId",
        usr."name",
        usr."email",
        usr."teamId",
        tm."name" AS "teamName",
        usr."role",
        usr."createdOn",
        usr."createdBy",
        usr."updatedBy",
        usr."updatedOn",
        usr."accruedLeave",
        usr."usedLeave",
        usr."keyword",
        usr."orgId"
    FROM 
        "User" usr
    JOIN 
        "Team" tm
    ON 
        usr."teamId" = tm."teamId"
    WHERE 
        usr."teamId" = id;
END;
$$;


ALTER FUNCTION "public"."get_users_by_team_id"("id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_with_teams"() RETURNS TABLE("userid" "uuid", "name" character varying, "email" character varying, "role" "public"."Role", "createdon" timestamp without time zone, "createdby" character varying, "updatedby" character varying, "updatedon" timestamp without time zone, "accruedleave" integer, "usedleave" integer, "keyword" character varying, "teamid" "uuid", "teamname" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        usr."userId",
        usr."name",
        usr."email",
        usr."role",
        usr."createdOn",
        usr."createdBy",
        usr."updatedBy",
        usr."updatedOn",
        usr."accruedLeave",
        usr."usedLeave",
        usr."keyword",
        usr."teamId",
        team."name" AS "teamName"
    FROM 
        "User" usr
    LEFT JOIN 
        "Team" team ON usr."teamId" = team."teamId";
END;
$$;


ALTER FUNCTION "public"."get_users_with_teams"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."holiday_log_fun"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    changedColumns TEXT[] := '{}';
    oldValues JSONB := '{}'::jsonb;
    newValues JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns, oldValues, and newValues if different
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            changedColumns := array_append(changedColumns, 'name');
            oldValues := jsonb_set(oldValues, '{name}', to_jsonb(OLD.name));
            newValues := jsonb_set(newValues, '{name}', to_jsonb(NEW.name));
        END IF;

        IF OLD.date IS DISTINCT FROM NEW.date THEN
            changedColumns := array_append(changedColumns, 'date');
            oldValues := jsonb_set(oldValues, '{date}', to_jsonb(OLD.date));
            newValues := jsonb_set(newValues, '{date}', to_jsonb(NEW.date));
        END IF;

        IF OLD."isRecurring" IS DISTINCT FROM NEW."isRecurring" THEN
            changedColumns := array_append(changedColumns, 'isRecurring');
            oldValues := jsonb_set(oldValues, '{isRecurring}', to_jsonb(OLD."isRecurring"));
            newValues := jsonb_set(newValues, '{isRecurring}', to_jsonb(NEW."isRecurring"));
        END IF;

        IF OLD."isCustom" IS DISTINCT FROM NEW."isCustom" THEN
            changedColumns := array_append(changedColumns, 'isCustom');
            oldValues := jsonb_set(oldValues, '{isCustom}', to_jsonb(OLD."isCustom"));
            newValues := jsonb_set(newValues, '{isCustom}', to_jsonb(NEW."isCustom"));
        END IF;

        IF OLD."orgId" IS DISTINCT FROM NEW."orgId" THEN
            changedColumns := array_append(changedColumns, 'orgId');
            oldValues := jsonb_set(oldValues, '{orgId}', to_jsonb(OLD."orgId"));
            newValues := jsonb_set(newValues, '{orgId}', to_jsonb(NEW."orgId"));
        END IF;

        -- Insert the log entry only if there are changes
        IF array_length(changedColumns, 1) > 0 THEN
            INSERT INTO public."OrgActivityLog" ("tableName", "orgId", "changedColumns", "oldValues", "newValues", "changedBy",keyword)
            VALUES (tableName, NEW."orgId", changedColumns, oldValues, newValues, NEW."updatedBy",'change');
        END IF;
    END IF;

    RETURN NEW;
END;

$$;


ALTER FUNCTION "public"."holiday_log_fun"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_approved_log_fun"() RETURNS "trigger"
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
            VALUES (tableName, NEW."userId", NEW."teamId", changedColumns, NEW."updatedBy", 'leave approve');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."leave_approved_log_fun"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_log_fun"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

DECLARE
    changedColumns TEXT[] := '{}';
    oldValues JSONB := '{}'::jsonb;
    newValues JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns, oldValues, and newValues if different
        IF OLD."leaveType" IS DISTINCT FROM NEW."leaveType" THEN
            changedColumns := array_append(changedColumns, 'leaveType');
            oldValues := jsonb_set(oldValues, '{leaveType}', to_jsonb(OLD."leaveType"));
            newValues := jsonb_set(newValues, '{leaveType}', to_jsonb(NEW."leaveType"));
        END IF;

        IF OLD."startDate" IS DISTINCT FROM NEW."startDate" THEN
            changedColumns := array_append(changedColumns, 'startDate');
            oldValues := jsonb_set(oldValues, '{startDate}', to_jsonb(OLD."startDate"));
            newValues := jsonb_set(newValues, '{startDate}', to_jsonb(NEW."startDate"));
        END IF;

        IF OLD."endDate" IS DISTINCT FROM NEW."endDate" THEN
            changedColumns := array_append(changedColumns, 'endDate');
            oldValues := jsonb_set(oldValues, '{endDate}', to_jsonb(OLD."endDate"));
            newValues := jsonb_set(newValues, '{endDate}', to_jsonb(NEW."endDate"));
        END IF;

        IF OLD.duration IS DISTINCT FROM NEW.duration THEN
            changedColumns := array_append(changedColumns, 'duration');
            oldValues := jsonb_set(oldValues, '{duration}', to_jsonb(OLD.duration));
            newValues := jsonb_set(newValues, '{duration}', to_jsonb(NEW.duration));
        END IF;

        IF OLD.shift IS DISTINCT FROM NEW.shift THEN
            changedColumns := array_append(changedColumns, 'shift');
            oldValues := jsonb_set(oldValues, '{shift}', to_jsonb(OLD.shift));
            newValues := jsonb_set(newValues, '{shift}', to_jsonb(NEW.shift));
        END IF;

        IF OLD."userId" IS DISTINCT FROM NEW."userId" THEN
            changedColumns := array_append(changedColumns, 'userId');
            oldValues := jsonb_set(oldValues, '{userId}', to_jsonb(OLD."userId"));
            newValues := jsonb_set(newValues, '{userId}', to_jsonb(NEW."userId"));
        END IF;

        IF OLD."teamId" IS DISTINCT FROM NEW."teamId" THEN
            changedColumns := array_append(changedColumns, 'teamId');
            oldValues := jsonb_set(oldValues, '{teamId}', to_jsonb(OLD."teamId"));
            newValues := jsonb_set(newValues, '{teamId}', to_jsonb(NEW."teamId"));
        END IF;

        IF OLD.reason IS DISTINCT FROM NEW.reason THEN
            changedColumns := array_append(changedColumns, 'reason');
            oldValues := jsonb_set(oldValues, '{reason}', to_jsonb(OLD.reason));
            newValues := jsonb_set(newValues, '{reason}', to_jsonb(NEW.reason));
        END IF;

        -- Insert the log entry only if there are changes
        IF array_length(changedColumns, 1) > 0 THEN
            INSERT INTO public."OrgActivityLog" ("tableName", "userId", "teamId", "changedColumns", "oldValues", "newValues", "changedBy",keyword)
            VALUES (tableName, NEW."userId", NEW."teamId", changedColumns, oldValues, newValues, NEW."updatedBy",'change');
        END IF;
    END IF;

    RETURN NEW;
END;

$$;


ALTER FUNCTION "public"."leave_log_fun"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_policy_log_fun"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

DECLARE
    changedColumns TEXT[] := '{}';
    oldValues JSONB := '{}'::jsonb;
    newValues JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns, oldValues, and newValues if different

        IF OLD."leaveTypeId" IS DISTINCT FROM NEW."leaveTypeId" THEN
            changedColumns := array_append(changedColumns, 'leaveTypeId');
            oldValues := jsonb_set(oldValues, '{leaveTypeId}', to_jsonb(OLD."leaveTypeId"));
            newValues := jsonb_set(newValues, '{leaveTypeId}', to_jsonb(NEW."leaveTypeId"));
        END IF;

        IF OLD."unlimited" IS DISTINCT FROM NEW."unlimited" THEN
            changedColumns := array_append(changedColumns, 'unlimited');
            oldValues := jsonb_set(oldValues, '{unlimited}', to_jsonb(OLD."unlimited"));
            newValues := jsonb_set(newValues, '{unlimited}', to_jsonb(NEW."unlimited"));
        END IF;

        IF OLD."maxLeaves" IS DISTINCT FROM NEW."maxLeaves" THEN
            changedColumns := array_append(changedColumns, 'maxLeaves');
            oldValues := jsonb_set(oldValues, '{maxLeaves}', to_jsonb(OLD."maxLeaves"));
            newValues := jsonb_set(newValues, '{maxLeaves}', to_jsonb(NEW."maxLeaves"));
        END IF;

        IF OLD."accruals" IS DISTINCT FROM NEW."accruals" THEN
            changedColumns := array_append(changedColumns, 'accruals');
            oldValues := jsonb_set(oldValues, '{accruals}', to_jsonb(OLD."accruals"));
            newValues := jsonb_set(newValues, '{accruals}', to_jsonb(NEW."accruals"));
        END IF;

        IF OLD."accrualFrequency" IS DISTINCT FROM NEW."accrualFrequency" THEN
            changedColumns := array_append(changedColumns, 'accrualFrequency');
            oldValues := jsonb_set(oldValues, '{accrualFrequency}', to_jsonb(OLD."accrualFrequency"));
            newValues := jsonb_set(newValues, '{accrualFrequency}', to_jsonb(NEW."accrualFrequency"));
        END IF;

        IF OLD."accrueOn" IS DISTINCT FROM NEW."accrueOn" THEN
            changedColumns := array_append(changedColumns, 'accrueOn');
            oldValues := jsonb_set(oldValues, '{accrueOn}', to_jsonb(OLD."accrueOn"));
            newValues := jsonb_set(newValues, '{accrueOn}', to_jsonb(NEW."accrueOn"));
        END IF;

        IF OLD."rollOver" IS DISTINCT FROM NEW."rollOver" THEN
            changedColumns := array_append(changedColumns, 'rollOver');
            oldValues := jsonb_set(oldValues, '{rollOver}', to_jsonb(OLD."rollOver"));
            newValues := jsonb_set(newValues, '{rollOver}', to_jsonb(NEW."rollOver"));
        END IF;

        IF OLD."rollOverLimit" IS DISTINCT FROM NEW."rollOverLimit" THEN
            changedColumns := array_append(changedColumns, 'rollOverLimit');
            oldValues := jsonb_set(oldValues, '{rollOverLimit}', to_jsonb(OLD."rollOverLimit"));
            newValues := jsonb_set(newValues, '{rollOverLimit}', to_jsonb(NEW."rollOverLimit"));
        END IF;

        IF OLD."orgId" IS DISTINCT FROM NEW."orgId" THEN
            changedColumns := array_append(changedColumns, 'orgId');
            oldValues := jsonb_set(oldValues, '{orgId}', to_jsonb(OLD."orgId"));
            newValues := jsonb_set(newValues, '{orgId}', to_jsonb(NEW."orgId"));
        END IF;

        IF OLD."rollOverExpiry" IS DISTINCT FROM NEW."rollOverExpiry" THEN
            changedColumns := array_append(changedColumns, 'rollOverExpiry');
            oldValues := jsonb_set(oldValues, '{rollOverExpiry}', to_jsonb(OLD."rollOverExpiry"));
            newValues := jsonb_set(newValues, '{rollOverExpiry}', to_jsonb(NEW."rollOverExpiry"));
        END IF;

        IF OLD."autoApprove" IS DISTINCT FROM NEW."autoApprove" THEN
            changedColumns := array_append(changedColumns, 'autoApprove');
            oldValues := jsonb_set(oldValues, '{autoApprove}', to_jsonb(OLD."autoApprove"));
            newValues := jsonb_set(newValues, '{autoApprove}', to_jsonb(NEW."autoApprove"));
        END IF;

        IF OLD."isActive" IS DISTINCT FROM NEW."isActive" THEN
            changedColumns := array_append(changedColumns, 'isActive');
            oldValues := jsonb_set(oldValues, '{isActive}', to_jsonb(OLD."isActive"));
            newValues := jsonb_set(newValues, '{isActive}', to_jsonb(NEW."isActive"));
        END IF;

        -- Insert the log entry only if there are changes
        IF array_length(changedColumns, 1) > 0 THEN
            INSERT INTO public."OrgActivityLog" ("tableName", "orgId", "changedColumns", "oldValues", "newValues", "changedBy","keyword")
            VALUES (tableName, NEW."orgId", changedColumns, oldValues, newValues, NEW."updatedBy",'change');
        END IF;
    END IF;

    RETURN NEW;
END;

$$;


ALTER FUNCTION "public"."leave_policy_log_fun"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_request_log_fun"() RETURNS "trigger"
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
            'leaveType', jsonb_build_object('new', NEW."leaveType"),
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
        VALUES (tableName, NEW."userId", NEW."teamId", changedColumns, NEW."updatedBy", 'leave request');
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."leave_request_log_fun"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_type_log_fun"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

DECLARE
    changedColumns TEXT[] := '{}';
    oldValues JSONB := '{}'::jsonb;
    newValues JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns, oldValues, and newValues if different
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            changedColumns := array_append(changedColumns, 'name');
            oldValues := jsonb_set(oldValues, '{name}', to_jsonb(OLD.name));
            newValues := jsonb_set(newValues, '{name}', to_jsonb(NEW.name));
        END IF;

        IF OLD.color IS DISTINCT FROM NEW.color THEN
            changedColumns := array_append(changedColumns, 'color');
            oldValues := jsonb_set(oldValues, '{color}', to_jsonb(OLD.color));
            newValues := jsonb_set(newValues, '{color}', to_jsonb(NEW.color));
        END IF;

        IF OLD."isActive" IS DISTINCT FROM NEW."isActive" THEN
            changedColumns := array_append(changedColumns, 'isActive');
            oldValues := jsonb_set(oldValues, '{isActive}', to_jsonb(OLD."isActive"));
            newValues := jsonb_set(newValues, '{isActive}', to_jsonb(NEW."isActive"));
        END IF;

        IF OLD."orgId" IS DISTINCT FROM NEW."orgId" THEN
            changedColumns := array_append(changedColumns, 'orgId');
            oldValues := jsonb_set(oldValues, '{orgId}', to_jsonb(OLD."orgId"));
            newValues := jsonb_set(newValues, '{orgId}', to_jsonb(NEW."orgId"));
        END IF;

        IF OLD."setSlackStatus" IS DISTINCT FROM NEW."setSlackStatus" THEN
            changedColumns := array_append(changedColumns, 'setSlackStatus');
            oldValues := jsonb_set(oldValues, '{setSlackStatus}', to_jsonb(OLD."setSlackStatus"));
            newValues := jsonb_set(newValues, '{setSlackStatus}', to_jsonb(NEW."setSlackStatus"));
        END IF;

        IF OLD.emoji IS DISTINCT FROM NEW.emoji THEN
            changedColumns := array_append(changedColumns, 'emoji');
            oldValues := jsonb_set(oldValues, '{emoji}', to_jsonb(OLD.emoji));
            newValues := jsonb_set(newValues, '{emoji}', to_jsonb(NEW.emoji));
        END IF;

        IF OLD."statusMsg" IS DISTINCT FROM NEW."statusMsg" THEN
            changedColumns := array_append(changedColumns, 'statusMsg');
            oldValues := jsonb_set(oldValues, '{statusMsg}', to_jsonb(OLD."statusMsg"));
            newValues := jsonb_set(newValues, '{statusMsg}', to_jsonb(NEW."statusMsg"));
        END IF;

        -- Insert the log entry only if there are changes
        IF array_length(changedColumns, 1) > 0 THEN
            INSERT INTO public."OrgActivityLog" ("tableName", "orgId", "changedColumns", "oldValues", "newValues", "changedBy",keyword)
            VALUES (tableName, NEW."orgId", changedColumns, oldValues, newValues, NEW."updatedBy",'change');
        END IF;
    END IF;

    RETURN NEW;
END;

$$;


ALTER FUNCTION "public"."leave_type_log_fun"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_leave_activity_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns if different
        IF OLD."leaveType" IS DISTINCT FROM NEW."leaveType" THEN
            changedColumns := jsonb_set(changedColumns, '{leaveType}', jsonb_build_object('old', OLD."leaveType", 'new', NEW."leaveType"));
        END IF;
        IF OLD."startDate" IS DISTINCT FROM NEW."startDate" THEN
            changedColumns := jsonb_set(changedColumns, '{startDate}', jsonb_build_object('old', OLD."startDate", 'new', NEW."startDate"));
        END IF;
        IF OLD."endDate" IS DISTINCT FROM NEW."endDate" THEN
            changedColumns := jsonb_set(changedColumns, '{endDate}', jsonb_build_object('old', OLD."endDate", 'new', NEW."endDate"));
        END IF;
        IF OLD."duration" IS DISTINCT FROM NEW."duration" THEN
            changedColumns := jsonb_set(changedColumns, '{duration}', jsonb_build_object('old', OLD."duration", 'new', NEW."duration"));
        END IF;
        IF OLD."shift" IS DISTINCT FROM NEW."shift" THEN
            changedColumns := jsonb_set(changedColumns, '{shift}', jsonb_build_object('old', OLD."shift", 'new', NEW."shift"));
        END IF;
        -- IF OLD."isApproved" IS DISTINCT FROM NEW."isApproved" THEN
        --     changedColumns := jsonb_set(changedColumns, '{isApproved}', jsonb_build_object('old', OLD."isApproved", 'new', NEW."isApproved"));
        -- END IF;
        IF OLD."userId" IS DISTINCT FROM NEW."userId" THEN
            changedColumns := jsonb_set(changedColumns, '{userId}', jsonb_build_object('old', OLD."userId", 'new', NEW."userId"));
        END IF;
        IF OLD."teamId" IS DISTINCT FROM NEW."teamId" THEN
            changedColumns := jsonb_set(changedColumns, '{teamId}', jsonb_build_object('old', OLD."teamId", 'new', NEW."teamId"));
        END IF;
        IF OLD."reason" IS DISTINCT FROM NEW."reason" THEN
            changedColumns := jsonb_set(changedColumns, '{reason}', jsonb_build_object('old', OLD."reason", 'new', NEW."reason"));
        END IF;
        IF OLD."managerComment" IS DISTINCT FROM NEW."managerComment" THEN
            changedColumns := jsonb_set(changedColumns, '{managerComment}', jsonb_build_object('old', OLD."managerComment", 'new', NEW."managerComment"));
        END IF;
        IF OLD."orgId" IS DISTINCT FROM NEW."orgId" THEN
            changedColumns := jsonb_set(changedColumns, '{orgId}', jsonb_build_object('old', OLD."orgId", 'new', NEW."orgId"));
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


ALTER FUNCTION "public"."log_leave_activity_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_leavepolicy_activity_changes"() RETURNS "trigger"
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
        IF OLD."orgId" IS DISTINCT FROM NEW."orgId" THEN
            changedColumns := jsonb_set(changedColumns, '{orgId}', jsonb_build_object('old', OLD."orgId", 'new', NEW."orgId"));
        END IF;
        IF OLD."updatedBy" IS DISTINCT FROM NEW."updatedBy" THEN
            changedColumns := jsonb_set(changedColumns, '{updatedBy}', jsonb_build_object('old', OLD."updatedBy", 'new', NEW."updatedBy"));
        END IF;
        IF OLD."updatedOn" IS DISTINCT FROM NEW."updatedOn" THEN
            changedColumns := jsonb_set(changedColumns, '{updatedOn}', jsonb_build_object('old', OLD."updatedOn", 'new', NEW."updatedOn"));
        END IF;

        -- Insert the log entry only if there are changes
        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "orgId", "changedColumns", "changedBy", keyword)
            VALUES (tableName, NEW."orgId", changedColumns, NEW."updatedBy", 'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_leavepolicy_activity_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_leavetype_activity_changes"() RETURNS "trigger"
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


ALTER FUNCTION "public"."log_leavetype_activity_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_org_activity_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns if different
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            changedColumns := jsonb_set(changedColumns, '{name}', jsonb_build_object('old', OLD.name, 'new', NEW.name));
        END IF;

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

        IF OLD."startOfWorkWeek" IS DISTINCT FROM NEW."startOfWorkWeek" THEN
            changedColumns := jsonb_set(changedColumns, '{startOfWorkWeek}', jsonb_build_object('old', OLD."startOfWorkWeek", 'new', NEW."startOfWorkWeek"));
        END IF;

        IF OLD.workweek IS DISTINCT FROM NEW.workweek THEN
            changedColumns := jsonb_set(changedColumns, '{workweek}', jsonb_build_object('old', OLD.workweek, 'new', NEW.workweek));
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

        IF OLD."notificationWeeklySummary" IS DISTINCT FROM NEW."notificationWeeklySummary" THEN
            changedColumns := jsonb_set(changedColumns, '{notificationWeeklySummary}', jsonb_build_object('old', OLD."notificationWeeklySummary", 'new', NEW."notificationWeeklySummary"));
        END IF;

        IF OLD."notificationToWhom" IS DISTINCT FROM NEW."notificationToWhom" THEN
            changedColumns := jsonb_set(changedColumns, '{notificationToWhom}', jsonb_build_object('old', OLD."notificationToWhom", 'new', NEW."notificationToWhom"));
        END IF;

        -- IF OLD."ownerId" IS DISTINCT FROM NEW."ownerId" THEN
        --     changedColumns := jsonb_set(changedColumns, '{ownerId}', jsonb_build_object('old', OLD."ownerId", 'new', NEW."ownerId"));
        -- END IF;

        -- Insert the log entry only if there are changes
        -- IF jsonb_array_length(changedColumns) > 0 THEN
        --     INSERT INTO public."ActivityLog" ("tableName", "orgId", "changedColumns", "changedBy", keyword)
        --     VALUES (tableName, NEW."orgId", changedColumns, NEW."updatedBy", 'change');
        -- END IF;
        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "orgId", "changedColumns", "changedBy", keyword)
            VALUES (tableName, NEW."orgId", changedColumns, NEW."updatedBy", 'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_org_activity_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_team_activity_changes"() RETURNS "trigger"
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
        IF OLD."manager" IS DISTINCT FROM NEW."manager" THEN
            changedColumns := jsonb_set(changedColumns, '{manager}', jsonb_build_object('old', OLD."manager", 'new', NEW."manager"));
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


ALTER FUNCTION "public"."log_team_activity_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_user_activity_changes"() RETURNS "trigger"
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
        IF OLD."teamId" IS DISTINCT FROM NEW."teamId" THEN
            changedColumns := jsonb_set(changedColumns, '{"teamId"}', jsonb_build_object('old', OLD."teamId", 'new', NEW."teamId"));
        END IF;
        IF OLD."role" IS DISTINCT FROM NEW."role" THEN
            changedColumns := jsonb_set(changedColumns, '{"role"}', jsonb_build_object('old', OLD."role", 'new', NEW."role"));
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


ALTER FUNCTION "public"."log_user_activity_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."team_log_fun"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$

DECLARE
    changedColumns TEXT[] := '{}';
    oldValues JSONB := '{}'::jsonb;
    newValues JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;  

BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns, oldValues, and newValues if different
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            changedColumns := array_append(changedColumns, 'name');
            oldValues := jsonb_set(oldValues, '{name}', to_jsonb(OLD.name));
            newValues := jsonb_set(newValues, '{name}', to_jsonb(NEW.name));
        END IF;

        IF OLD."isActive" IS DISTINCT FROM NEW."isActive" THEN
            changedColumns := array_append(changedColumns, 'isActive');
            oldValues := jsonb_set(oldValues, '{isActive}', to_jsonb(OLD."isActive"));
            newValues := jsonb_set(newValues, '{isActive}', to_jsonb(NEW."isActive"));
        END IF;

        IF OLD."orgId" IS DISTINCT FROM NEW."orgId" THEN
            changedColumns := array_append(changedColumns, 'orgId');
            oldValues := jsonb_set(oldValues, '{orgId}', to_jsonb(OLD."orgId"));
            newValues := jsonb_set(newValues, '{orgId}', to_jsonb(NEW."orgId"));
        END IF;

        IF OLD.manager IS DISTINCT FROM NEW.manager THEN
            changedColumns := array_append(changedColumns, 'manager');
            oldValues := jsonb_set(oldValues, '{manager}', to_jsonb(OLD.manager));
            newValues := jsonb_set(newValues, '{manager}', to_jsonb(NEW.manager));
        END IF;

        -- Insert the log entry only if there are changes
        IF array_length(changedColumns, 1) > 0 THEN
            INSERT INTO public."OrgActivityLog" ("tableName", "teamId", "changedColumns", "oldValues", "newValues", "changedBy",keyword)
            VALUES (tableName, NEW."teamId", changedColumns, oldValues, newValues, NEW."updatedBy",'change');
        END IF;
    END IF;

    RETURN NEW;
END;

$$;


ALTER FUNCTION "public"."team_log_fun"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."user_log_fun"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    changedColumns TEXT[] := '{}';
    oldValues JSONB := '{}'::jsonb;
    newValues JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;

BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns, oldValues, and newValues if different
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            changedColumns := array_append(changedColumns, 'name');
            oldValues := jsonb_set(oldValues, '{name}', to_jsonb(OLD.name));
            newValues := jsonb_set(newValues, '{name}', to_jsonb(NEW.name));
        END IF;

        IF OLD.email IS DISTINCT FROM NEW.email THEN
            changedColumns := array_append(changedColumns, 'email');
            oldValues := jsonb_set(oldValues, '{email}', to_jsonb(OLD.email));
            newValues := jsonb_set(newValues, '{email}', to_jsonb(NEW.email));
        END IF;



        IF OLD."role" IS DISTINCT FROM NEW."role" THEN
            changedColumns := array_append(changedColumns, 'role');
            oldValues := jsonb_set(oldValues, '{role}', to_jsonb(OLD."role"));
            newValues := jsonb_set(newValues, '{role}', to_jsonb(NEW."role"));
        END IF;

        -- Insert the log entry only if there are changes
        IF array_length(changedColumns, 1) > 0 THEN
            INSERT INTO public."OrgActivityLog" ("tableName", "userId", "changedColumns", "oldValues", "newValues", "changedBy",keyword)
            VALUES (tableName, NEW."userId", changedColumns, oldValues, newValues, NEW."updatedBy",'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."user_log_fun"() OWNER TO "postgres";

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
    "keyword" character varying
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
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "createdBy" character varying(255),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"()
);


ALTER TABLE "public"."Holiday" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Leave" (
    "leaveId" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "leaveType" character varying NOT NULL,
    "startDate" "date" NOT NULL,
    "endDate" "date" NOT NULL,
    "duration" "public"."LeaveDuration" NOT NULL,
    "shift" "public"."Shift" NOT NULL,
    "isApproved" "public"."LeaveStatus" DEFAULT 'PENDING'::"public"."LeaveStatus" NOT NULL,
    "userId" "uuid" NOT NULL,
    "teamId" "uuid" NOT NULL,
    "reason" character varying(255),
    "managerComment" character varying(255),
    "orgId" "uuid" NOT NULL,
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "createdBy" character varying(255),
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
    "orgId" "uuid" NOT NULL,
    "rollOverExpiry" character varying(5),
    "autoApprove" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "createdBy" character varying(255),
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
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "createdBy" character varying(255),
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
    "ownerSlackId" "text"
);


ALTER TABLE "public"."OrgAccessData" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Organisation" (
    "orgId" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscriptionId" character varying(255),
    "name" character varying(255) NOT NULL,
    "dateformat" character varying(255) DEFAULT 'DD-MM-YYYY'::character varying NOT NULL,
    "timeformat" character varying(255) DEFAULT 'HH:MM'::character varying NOT NULL,
    "location" character varying(255),
    "visibility" "public"."Visibility" DEFAULT 'SELF'::"public"."Visibility" NOT NULL,
    "startOfWorkWeek" "public"."DaysOfWeek" DEFAULT 'MONDAY'::"public"."DaysOfWeek" NOT NULL,
    "workweek" "public"."DaysOfWeek"[] DEFAULT ARRAY['MONDAY'::"public"."DaysOfWeek", 'TUESDAY'::"public"."DaysOfWeek", 'WEDNESDAY'::"public"."DaysOfWeek", 'THURSDAY'::"public"."DaysOfWeek", 'FRIDAY'::"public"."DaysOfWeek", 'SATURDAY'::"public"."DaysOfWeek", 'SUNDAY'::"public"."DaysOfWeek"] NOT NULL,
    "timeZone" character varying(255),
    "notificationLeaveChanged" boolean DEFAULT false NOT NULL,
    "notificationDailySummary" boolean DEFAULT false NOT NULL,
    "notificationDailySummarySendOnTime" "text",
    "notificationWeeklySummary" boolean DEFAULT false NOT NULL,
    "notificationWeeklySummaryTime" "text",
    "notificationWeeklySummarySendOnDay" "public"."DaysOfWeek",
    "notificationToWhom" "public"."Role" DEFAULT 'MANAGER'::"public"."Role" NOT NULL,
    "ownerId" "uuid",
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "createdBy" character varying(255),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"(),
    "halfDayLeave" boolean DEFAULT false NOT NULL,
    "initialSetup" boolean DEFAULT false
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
    "manager" "uuid",
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
    "notificationToWhom" "public"."Role" DEFAULT 'MANAGER'::"public"."Role" NOT NULL,
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "createdBy" character varying(255),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"()
);


ALTER TABLE "public"."Team" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."User" (
    "userId" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "teamId" "uuid",
    "role" "public"."Role" DEFAULT 'USER'::"public"."Role" NOT NULL,
    "createdOn" timestamp(6) without time zone DEFAULT "now"(),
    "createdBy" character varying(255),
    "updatedBy" character varying(255),
    "updatedOn" timestamp(6) without time zone DEFAULT "now"(),
    "accruedLeave" "jsonb" DEFAULT '{}'::"jsonb",
    "usedLeave" "jsonb" DEFAULT '{}'::"jsonb",
    "keyword" character varying,
    "slackId" "text",
    "googleId" "text",
    "orgId" "uuid"
);


ALTER TABLE "public"."User" OWNER TO "postgres";


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



CREATE OR REPLACE TRIGGER "leave_approved_log_trigger" AFTER UPDATE ON "public"."Leave" FOR EACH ROW EXECUTE FUNCTION "public"."leave_approved_log_fun"();



CREATE OR REPLACE TRIGGER "leave_request_log_trigger" AFTER INSERT ON "public"."Leave" FOR EACH ROW EXECUTE FUNCTION "public"."leave_request_log_fun"();



CREATE OR REPLACE TRIGGER "log_leave_activity_changes_trigger" AFTER UPDATE ON "public"."Leave" FOR EACH ROW EXECUTE FUNCTION "public"."log_leave_activity_changes"();



CREATE OR REPLACE TRIGGER "log_leavepolicy_activity_changes_trigger" AFTER UPDATE ON "public"."LeavePolicy" FOR EACH ROW EXECUTE FUNCTION "public"."log_leavepolicy_activity_changes"();



CREATE OR REPLACE TRIGGER "log_leavetype_activity_changes_trigger" AFTER UPDATE ON "public"."LeaveType" FOR EACH ROW EXECUTE FUNCTION "public"."log_leavetype_activity_changes"();



CREATE OR REPLACE TRIGGER "log_org_activity_changes_trigger" AFTER UPDATE ON "public"."Organisation" FOR EACH ROW EXECUTE FUNCTION "public"."log_org_activity_changes"();



CREATE OR REPLACE TRIGGER "log_team_activity_changes_trigger" AFTER UPDATE ON "public"."Team" FOR EACH ROW EXECUTE FUNCTION "public"."log_team_activity_changes"();



CREATE OR REPLACE TRIGGER "log_user_activity_changes_trigger" AFTER UPDATE ON "public"."User" FOR EACH ROW EXECUTE FUNCTION "public"."log_user_activity_changes"();



CREATE OR REPLACE TRIGGER "user_invite_log_trigger" AFTER INSERT OR UPDATE ON "public"."User" FOR EACH ROW EXECUTE FUNCTION "public"."user_invite_log_function"();



CREATE OR REPLACE TRIGGER "user_leave_addon_log_trigger" AFTER UPDATE ON "public"."User" FOR EACH ROW EXECUTE FUNCTION "public"."user_leave_addon_log_fun"();



ALTER TABLE ONLY "public"."Holiday"
    ADD CONSTRAINT "fk_holiday_org" FOREIGN KEY ("orgId") REFERENCES "public"."Organisation"("orgId");



ALTER TABLE ONLY "public"."Leave"
    ADD CONSTRAINT "fk_leave_org" FOREIGN KEY ("orgId") REFERENCES "public"."Organisation"("orgId");



ALTER TABLE ONLY "public"."Leave"
    ADD CONSTRAINT "fk_leave_team" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("teamId");



ALTER TABLE ONLY "public"."Leave"
    ADD CONSTRAINT "fk_leave_user" FOREIGN KEY ("userId") REFERENCES "public"."User"("userId");



ALTER TABLE ONLY "public"."LeavePolicy"
    ADD CONSTRAINT "fk_leavepolicy_leavetype" FOREIGN KEY ("leaveTypeId") REFERENCES "public"."LeaveType"("leaveTypeId");



ALTER TABLE ONLY "public"."LeavePolicy"
    ADD CONSTRAINT "fk_leavepolicy_org" FOREIGN KEY ("orgId") REFERENCES "public"."Organisation"("orgId");



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



CREATE POLICY "holiday_insert" ON "public"."Holiday" FOR INSERT WITH CHECK (true);



CREATE POLICY "holiday_select" ON "public"."Holiday" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = ANY (ARRAY[('MANAGER'::character varying)::"text", ('USER'::character varying)::"text", ('OWNER'::character varying)::"text"])) AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "holiday_update" ON "public"."Holiday" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text") AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "leave_insert" ON "public"."Leave" FOR INSERT WITH CHECK (((("auth"."role"() = 'authenticated'::"text") AND ((("teamId" = "public"."fetch_user_teamid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'MANAGER'::"text")) OR (("orgId" = "public"."fetch_user_orgid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text")))) OR ("auth"."uid"() = "userId")));



CREATE POLICY "leave_select" ON "public"."Leave" FOR SELECT USING (((("auth"."role"() = 'authenticated'::"text") AND ((("teamId" = "public"."fetch_user_teamid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'MANAGER'::"text")) OR (("orgId" = "public"."fetch_user_orgid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text")))) OR ("auth"."uid"() = "userId")));



CREATE POLICY "leave_update" ON "public"."Leave" FOR UPDATE USING (((("auth"."role"() = 'authenticated'::"text") AND ((("teamId" = "public"."fetch_user_teamid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'MANAGER'::"text")) OR (("orgId" = "public"."fetch_user_orgid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text")))) OR ("auth"."uid"() = "userId")));



CREATE POLICY "leavepolicy_insert" ON "public"."LeavePolicy" FOR INSERT WITH CHECK (true);



CREATE POLICY "leavepolicy_select" ON "public"."LeavePolicy" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = ANY (ARRAY[('MANAGER'::character varying)::"text", ('USER'::character varying)::"text", ('OWNER'::character varying)::"text"])) AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "leavepolicy_update" ON "public"."LeavePolicy" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text") AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "leavetype_insert" ON "public"."LeaveType" FOR INSERT WITH CHECK (true);



CREATE POLICY "leavetype_select" ON "public"."LeaveType" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = ANY (ARRAY[('MANAGER'::character varying)::"text", ('USER'::character varying)::"text", ('OWNER'::character varying)::"text"])) AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "leavetype_update" ON "public"."LeaveType" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text") AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "org_insert" ON "public"."Organisation" FOR INSERT WITH CHECK (true);



CREATE POLICY "org_select" ON "public"."Organisation" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = ANY (ARRAY[('MANAGER'::character varying)::"text", ('USER'::character varying)::"text", ('OWNER'::character varying)::"text"])) AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "org_update" ON "public"."Organisation" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ((("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text") AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"())))));



CREATE POLICY "team_insert" ON "public"."Team" FOR INSERT WITH CHECK (true);



CREATE POLICY "team_select" ON "public"."Team" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (((("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text") AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"()))) OR ((("public"."fetch_user_role"("auth"."uid"()))::"text" = ANY (ARRAY[('MANAGER'::character varying)::"text", ('USER'::character varying)::"text"])) AND ("teamId" = "public"."fetch_user_teamid"("auth"."uid"()))))));



CREATE POLICY "team_update" ON "public"."Team" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND (((("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text") AND ("orgId" = "public"."fetch_user_orgid"("auth"."uid"()))) OR ((("public"."fetch_user_role"("auth"."uid"()))::"text" = ANY (ARRAY[('MANAGER'::character varying)::"text", ('USER'::character varying)::"text"])) AND ("teamId" = "public"."fetch_user_teamid"("auth"."uid"()))))));



CREATE POLICY "user_insert" ON "public"."User" FOR INSERT WITH CHECK (true);



CREATE POLICY "user_select" ON "public"."User" FOR SELECT USING (((("auth"."role"() = 'authenticated'::"text") AND ((("teamId" = "public"."fetch_user_teamid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'MANAGER'::"text")) OR (("orgId" = "public"."fetch_user_orgid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text")))) OR ("auth"."uid"() = "userId")));



CREATE POLICY "user_update" ON "public"."User" FOR UPDATE USING (((("auth"."role"() = 'authenticated'::"text") AND ((("teamId" = "public"."fetch_user_teamid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'MANAGER'::"text")) OR (("orgId" = "public"."fetch_user_orgid"("auth"."uid"())) AND (("public"."fetch_user_role"("auth"."uid"()))::"text" = 'OWNER'::"text")))) OR ("auth"."uid"() = "userId")));



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_to_user_uuid_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_to_user_uuid_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_to_user_uuid_update"() TO "service_role";
GRANT ALL ON FUNCTION "public"."auth_to_user_uuid_update"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."calculate_accruals"("frequency" "text") TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."calculate_accruals"("frequency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_accruals"("frequency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_accruals"("frequency" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_org_team_user"("org_name" "text", "team_name" "text", "user_name" "text", "user_email" "text", OUT "org_id" "uuid", OUT "team_id" "uuid", OUT "user_id" "uuid") TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."create_org_team_user"("org_name" "text", "team_name" "text", "user_name" "text", "user_email" "text", OUT "org_id" "uuid", OUT "team_id" "uuid", OUT "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_org_team_user"("org_name" "text", "team_name" "text", "user_name" "text", "user_email" "text", OUT "org_id" "uuid", OUT "team_id" "uuid", OUT "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_org_team_user"("org_name" "text", "team_name" "text", "user_name" "text", "user_email" "text", OUT "org_id" "uuid", OUT "team_id" "uuid", OUT "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fetch_user_orgid"("id" "uuid") TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."fetch_user_orgid"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fetch_user_orgid"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_user_orgid"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fetch_user_role"("id" "uuid") TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."fetch_user_role"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fetch_user_role"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_user_role"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fetch_user_teamid"("id" "uuid") TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."fetch_user_teamid"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fetch_user_teamid"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_user_teamid"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_leave_types_by_user_id"("id" "uuid") TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."get_leave_types_by_user_id"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_leave_types_by_user_id"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leave_types_by_user_id"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_leaves_by_team"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_leaves_by_team"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leaves_by_team"("id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_leaves_by_team"("id" "uuid") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."get_leaves_by_user_id"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_leaves_by_user_id"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leaves_by_user_id"("id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_leaves_by_user_id"("id" "uuid") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."get_leaves_by_user_org"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_leaves_by_user_org"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leaves_by_user_org"("id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_leaves_by_user_org"("id" "uuid") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."get_team_by_id"("id" "uuid") TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."get_team_by_id"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_by_id"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_by_id"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_teams_by_org"("id" "uuid") TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."get_teams_by_org"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_teams_by_org"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_teams_by_org"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_data_by_id"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_data_by_id"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_data_by_id"("id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_user_data_by_id"("id" "uuid") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."get_user_org_visibility"("id" "uuid") TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."get_user_org_visibility"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_org_visibility"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_org_visibility"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_teams"("id" "uuid") TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."get_user_teams"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_teams"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_teams"("id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_by_organization"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_by_organization"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_by_organization"("id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_users_by_organization"("id" "uuid") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."get_users_by_team_id"("id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_by_team_id"("id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_by_team_id"("id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_users_by_team_id"("id" "uuid") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."get_users_with_teams"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_with_teams"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_with_teams"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_users_with_teams"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."holiday_log_fun"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."holiday_log_fun"() TO "anon";
GRANT ALL ON FUNCTION "public"."holiday_log_fun"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."holiday_log_fun"() TO "service_role";



GRANT ALL ON FUNCTION "public"."leave_approved_log_fun"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."leave_approved_log_fun"() TO "anon";
GRANT ALL ON FUNCTION "public"."leave_approved_log_fun"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_approved_log_fun"() TO "service_role";



GRANT ALL ON FUNCTION "public"."leave_log_fun"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."leave_log_fun"() TO "anon";
GRANT ALL ON FUNCTION "public"."leave_log_fun"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_log_fun"() TO "service_role";



GRANT ALL ON FUNCTION "public"."leave_policy_log_fun"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."leave_policy_log_fun"() TO "anon";
GRANT ALL ON FUNCTION "public"."leave_policy_log_fun"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_policy_log_fun"() TO "service_role";



GRANT ALL ON FUNCTION "public"."leave_request_log_fun"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."leave_request_log_fun"() TO "anon";
GRANT ALL ON FUNCTION "public"."leave_request_log_fun"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_request_log_fun"() TO "service_role";



GRANT ALL ON FUNCTION "public"."leave_type_log_fun"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."leave_type_log_fun"() TO "anon";
GRANT ALL ON FUNCTION "public"."leave_type_log_fun"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_type_log_fun"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_leave_activity_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_leave_activity_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_leave_activity_changes"() TO "service_role";
GRANT ALL ON FUNCTION "public"."log_leave_activity_changes"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."log_leavepolicy_activity_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_leavepolicy_activity_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_leavepolicy_activity_changes"() TO "service_role";
GRANT ALL ON FUNCTION "public"."log_leavepolicy_activity_changes"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."log_leavetype_activity_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_leavetype_activity_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_leavetype_activity_changes"() TO "service_role";
GRANT ALL ON FUNCTION "public"."log_leavetype_activity_changes"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."log_org_activity_changes"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."log_org_activity_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_org_activity_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_org_activity_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_team_activity_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_team_activity_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_team_activity_changes"() TO "service_role";
GRANT ALL ON FUNCTION "public"."log_team_activity_changes"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."log_user_activity_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_activity_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_activity_changes"() TO "service_role";
GRANT ALL ON FUNCTION "public"."log_user_activity_changes"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."team_log_fun"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."team_log_fun"() TO "anon";
GRANT ALL ON FUNCTION "public"."team_log_fun"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."team_log_fun"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_invite_log_function"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."user_invite_log_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_invite_log_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_invite_log_function"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_leave_addon_log_fun"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."user_leave_addon_log_fun"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_leave_addon_log_fun"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_leave_addon_log_fun"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_log_fun"() TO "supabase_auth_admin";
GRANT ALL ON FUNCTION "public"."user_log_fun"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_log_fun"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_log_fun"() TO "service_role";



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

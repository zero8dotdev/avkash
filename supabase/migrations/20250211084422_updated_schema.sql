drop trigger if exists "leave_approved_log_trigger" on "public"."Leave";

drop trigger if exists "leave_request_log_trigger" on "public"."Leave";

drop trigger if exists "log_leave_activity_changes_trigger" on "public"."Leave";

drop trigger if exists "log_leavepolicy_activity_changes_trigger" on "public"."LeavePolicy";

drop trigger if exists "log_leavetype_activity_changes_trigger" on "public"."LeaveType";

drop trigger if exists "log_org_activity_changes_trigger" on "public"."Organisation";

drop trigger if exists "log_team_activity_changes_trigger" on "public"."Team";

drop trigger if exists "log_user_activity_changes_trigger" on "public"."User";

drop policy "holiday_select" on "public"."Holiday";

drop policy "leavepolicy_select" on "public"."LeavePolicy";

drop policy "leavepolicy_update" on "public"."LeavePolicy";

drop policy "leavetype_select" on "public"."LeaveType";

drop policy "org_select" on "public"."Organisation";

drop policy "team_select" on "public"."Team";

drop policy "team_update" on "public"."Team";

alter table "public"."LeavePolicy" drop constraint "fk_leavepolicy_org";

drop function if exists "public"."create_org_team_user"(org_name text, team_name text, user_name text, user_email text, OUT org_id uuid, OUT team_id uuid, OUT user_id uuid);

drop function if exists "public"."get_leave_types_by_user_id"(id uuid);

drop function if exists "public"."get_leaves_by_team"(id uuid);

drop function if exists "public"."get_leaves_by_user_id"(id uuid);

drop function if exists "public"."get_leaves_by_user_org"(id uuid);

drop function if exists "public"."get_team_by_id"(id uuid);

drop function if exists "public"."get_teams_by_org"(id uuid);

drop function if exists "public"."get_user_data_by_id"(id uuid);

drop function if exists "public"."get_user_org_visibility"(id uuid);

drop function if exists "public"."get_user_teams"(id uuid);

drop function if exists "public"."get_users_by_organization"(id uuid);

drop function if exists "public"."get_users_by_team_id"(id uuid);

drop function if exists "public"."get_users_with_teams"();

drop function if exists "public"."holiday_log_fun"();

drop function if exists "public"."leave_approved_log_fun"();

drop function if exists "public"."leave_log_fun"();

drop function if exists "public"."leave_policy_log_fun"();

drop function if exists "public"."leave_request_log_fun"();

drop function if exists "public"."leave_type_log_fun"();

drop function if exists "public"."log_leave_activity_changes"();

drop function if exists "public"."log_leavepolicy_activity_changes"();

drop function if exists "public"."log_leavetype_activity_changes"();

drop function if exists "public"."log_org_activity_changes"();

drop function if exists "public"."log_team_activity_changes"();

drop function if exists "public"."log_user_activity_changes"();

drop function if exists "public"."team_log_fun"();

drop function if exists "public"."user_log_fun"();

alter table "public"."User" alter column "role" drop default;

alter type "public"."AccuralFrequencyOptions" rename to "AccuralFrequencyOptions__old_version_to_be_dropped";

create type "public"."AccuralFrequencyOptions" as enum ('MONTHLY', 'QUARTERLY');

alter type "public"."Role" rename to "Role__old_version_to_be_dropped";

create type "public"."Role" as enum ('OWNER', 'MANAGER', 'USER', 'ANON', 'ADMIN');

alter table "public"."LeavePolicy" alter column accrualFrequency type "public"."AccuralFrequencyOptions" using accrualFrequency::text::"public"."AccuralFrequencyOptions";

alter table "public"."User" alter column role type "public"."Role" using role::text::"public"."Role";

alter table "public"."User" alter column "role" set default 'USER'::"Role";

drop type "public"."AccuralFrequencyOptions__old_version_to_be_dropped";

drop type "public"."Role__old_version_to_be_dropped";

alter table "public"."ActivityLog" add column "createdBy" character varying(255);

alter table "public"."ActivityLog" add column "createdOn" timestamp(6) without time zone default now();

alter table "public"."ActivityLog" add column "updatedBy" character varying(255);

alter table "public"."ActivityLog" add column "updatedOn" timestamp(6) without time zone default now();

alter table "public"."Leave" drop column "leaveType";

alter table "public"."Leave" add column "leaveTypeId" uuid not null;

alter table "public"."Leave" alter column "duration" set default 'FULL_DAY'::"LeaveDuration";

alter table "public"."Leave" alter column "shift" set default 'NONE'::"Shift";

alter table "public"."LeavePolicy" drop column "orgId";

alter table "public"."LeavePolicy" add column "teamId" uuid not null;

alter table "public"."OrgAccessData" add column "createdBy" character varying(255);

alter table "public"."OrgAccessData" add column "createdOn" timestamp(6) without time zone default now();

alter table "public"."OrgAccessData" add column "updatedBy" character varying(255);

alter table "public"."OrgAccessData" add column "updatedOn" timestamp(6) without time zone default now();

alter table "public"."Organisation" drop column "name";

alter table "public"."Organisation" drop column "notificationDailySummary";

alter table "public"."Organisation" drop column "notificationDailySummarySendOnTime";

alter table "public"."Organisation" drop column "notificationLeaveChanged";

alter table "public"."Organisation" drop column "notificationToWhom";

alter table "public"."Organisation" drop column "notificationWeeklySummary";

alter table "public"."Organisation" drop column "notificationWeeklySummarySendOnDay";

alter table "public"."Organisation" drop column "notificationWeeklySummaryTime";

alter table "public"."Organisation" drop column "startOfWorkWeek";

alter table "public"."Organisation" drop column "timeZone";

alter table "public"."Organisation" drop column "workweek";

alter table "public"."Organisation" add column "isSetupCompleted" boolean default false;

alter table "public"."Organisation" alter column "dateformat" set default 'dd/mm/yyyy'::character varying;

alter table "public"."Organisation" alter column "initialSetup" set default 0;

alter table "public"."Organisation" alter column "initialSetup" set data type character varying(1) using "initialSetup"::character varying(1);

alter table "public"."Organisation" alter column "location" set data type character varying(255)[] using "location"::character varying(255)[];

alter table "public"."Organisation" alter column "timeformat" set default '12-hour'::character varying;

alter table "public"."Team" drop column "manager";

alter table "public"."Team" add column "managers" uuid[];

alter table "public"."Team" alter column "notificationToWhom" set default ARRAY['MANAGER'::"Role"];

alter table "public"."Team" alter column "notificationToWhom" set data type "Role"[] using "notificationToWhom"::"Role"[];

alter table "public"."User" add column "overrides" jsonb default '{}'::jsonb;

alter table "public"."User" add column "picture" text;

CREATE INDEX idx_holiday_date ON public."Holiday" USING btree (date);

CREATE INDEX idx_holiday_org_id ON public."Holiday" USING btree ("orgId");

CREATE INDEX idx_holiday_recurring ON public."Holiday" USING btree ("isRecurring");

CREATE INDEX idx_leave_end_date ON public."Leave" USING btree ("endDate");

CREATE INDEX idx_leave_org_id ON public."Leave" USING btree ("orgId");

CREATE INDEX idx_leave_start_date ON public."Leave" USING btree ("startDate");

CREATE INDEX idx_leave_status ON public."Leave" USING btree ("isApproved");

CREATE INDEX idx_leave_team_id ON public."Leave" USING btree ("teamId");

CREATE INDEX idx_leave_user_id ON public."Leave" USING btree ("userId");

CREATE INDEX idx_leave_user_start_date ON public."Leave" USING btree ("userId", "startDate");

CREATE INDEX idx_leavepolicy_active ON public."LeavePolicy" USING btree ("isActive");

CREATE INDEX idx_leavepolicy_type_team ON public."LeavePolicy" USING btree ("leaveTypeId", "teamId");

CREATE INDEX idx_leavetype_active ON public."LeaveType" USING btree ("isActive");

CREATE INDEX idx_leavetype_org_id ON public."LeaveType" USING btree ("orgId");

CREATE INDEX idx_orgaccessdata_org_id ON public."OrgAccessData" USING btree ("orgId");

CREATE INDEX idx_organisation_owner_id ON public."Organisation" USING btree ("ownerId");

CREATE INDEX idx_organisation_subscription_id ON public."Organisation" USING btree ("subscriptionId");

CREATE INDEX idx_team_manager ON public."Team" USING btree (managers);

CREATE INDEX idx_team_org_id ON public."Team" USING btree ("orgId");

CREATE INDEX idx_user_email ON public."User" USING btree (email);

CREATE INDEX idx_user_org_id ON public."User" USING btree ("orgId");

CREATE INDEX idx_user_team_id ON public."User" USING btree ("teamId");

alter table "public"."ActivityLog" add constraint "fk_activity_org" FOREIGN KEY ("orgId") REFERENCES "Organisation"("orgId") not valid;

alter table "public"."ActivityLog" validate constraint "fk_activity_org";

alter table "public"."ActivityLog" add constraint "fk_activity_team" FOREIGN KEY ("teamId") REFERENCES "Team"("teamId") not valid;

alter table "public"."ActivityLog" validate constraint "fk_activity_team";

alter table "public"."ActivityLog" add constraint "fk_activity_user" FOREIGN KEY ("userId") REFERENCES "User"("userId") not valid;

alter table "public"."ActivityLog" validate constraint "fk_activity_user";

alter table "public"."Leave" add constraint "fk_leave_leavetype" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("leaveTypeId") ON DELETE CASCADE not valid;

alter table "public"."Leave" validate constraint "fk_leave_leavetype";

alter table "public"."LeavePolicy" add constraint "fk_leavepolicy_team" FOREIGN KEY ("teamId") REFERENCES "Team"("teamId") not valid;

alter table "public"."LeavePolicy" validate constraint "fk_leavepolicy_team";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.leave_approved_activity_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.leave_request_activity_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

create or replace view "public"."leave_summary" as  SELECT "Leave"."userId",
    "Leave"."leaveTypeId",
    "Leave"."isApproved",
    count(*) AS count
   FROM "Leave"
  GROUP BY "Leave"."userId", "Leave"."leaveTypeId", "Leave"."isApproved";


CREATE OR REPLACE FUNCTION public.leavepolicy_activity_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

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
$function$
;

CREATE OR REPLACE FUNCTION public.leavetype_activity_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

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
$function$
;

CREATE OR REPLACE FUNCTION public.org_activity_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

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
$function$
;

CREATE OR REPLACE FUNCTION public.team_activity_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

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
$function$
;

CREATE OR REPLACE FUNCTION public.user_activity_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

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
$function$
;

CREATE OR REPLACE FUNCTION public.fetch_user_role(id uuid)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

create policy "holiday_delete"
on "public"."Holiday"
as permissive
for delete
to public
using (true);


create policy "holiday_select"
on "public"."Holiday"
as permissive
for select
to public
using (((auth.role() = 'authenticated'::text) AND (((fetch_user_role(auth.uid()))::text = ANY ((ARRAY['MANAGER'::character varying, 'USER'::character varying, 'OWNER'::character varying])::text[])) AND ("orgId" = fetch_user_orgid(auth.uid())))));


create policy "leavepolicy_select"
on "public"."LeavePolicy"
as permissive
for select
to public
using (((auth.role() = 'authenticated'::text) AND (((fetch_user_role(auth.uid()))::text = ANY ((ARRAY['MANAGER'::character varying, 'USER'::character varying, 'OWNER'::character varying])::text[])) AND ("teamId" = fetch_user_teamid(auth.uid())))));


create policy "leavepolicy_update"
on "public"."LeavePolicy"
as permissive
for update
to public
using (((auth.role() = 'authenticated'::text) AND (((fetch_user_role(auth.uid()))::text = 'OWNER'::text) AND ("teamId" = fetch_user_teamid(auth.uid())))));


create policy "leavetype_select"
on "public"."LeaveType"
as permissive
for select
to public
using (((auth.role() = 'authenticated'::text) AND (((fetch_user_role(auth.uid()))::text = ANY ((ARRAY['MANAGER'::character varying, 'USER'::character varying, 'OWNER'::character varying])::text[])) AND ("orgId" = fetch_user_orgid(auth.uid())))));


create policy "org_select"
on "public"."Organisation"
as permissive
for select
to public
using (((auth.role() = 'authenticated'::text) AND (((fetch_user_role(auth.uid()))::text = ANY ((ARRAY['MANAGER'::character varying, 'USER'::character varying, 'OWNER'::character varying])::text[])) AND ("orgId" = fetch_user_orgid(auth.uid())))));


create policy "team_select"
on "public"."Team"
as permissive
for select
to public
using (((auth.role() = 'authenticated'::text) AND ((((fetch_user_role(auth.uid()))::text = 'OWNER'::text) AND ("orgId" = fetch_user_orgid(auth.uid()))) OR (((fetch_user_role(auth.uid()))::text = ANY ((ARRAY['MANAGER'::character varying, 'USER'::character varying])::text[])) AND ("teamId" = fetch_user_teamid(auth.uid()))))));


create policy "team_update"
on "public"."Team"
as permissive
for update
to public
using (((auth.role() = 'authenticated'::text) AND ((((fetch_user_role(auth.uid()))::text = 'OWNER'::text) AND ("orgId" = fetch_user_orgid(auth.uid()))) OR (((fetch_user_role(auth.uid()))::text = ANY ((ARRAY['MANAGER'::character varying, 'USER'::character varying])::text[])) AND ("teamId" = fetch_user_teamid(auth.uid()))))));


CREATE TRIGGER leave_approved_activity_audit_trigger AFTER UPDATE ON public."Leave" FOR EACH ROW EXECUTE FUNCTION leave_approved_activity_audit();

CREATE TRIGGER leave_request_activity_audit_trigger AFTER INSERT ON public."Leave" FOR EACH ROW EXECUTE FUNCTION leave_request_activity_audit();

CREATE TRIGGER leavepolicy_activity_audit_trigger AFTER UPDATE ON public."LeavePolicy" FOR EACH ROW EXECUTE FUNCTION leavepolicy_activity_audit();

CREATE TRIGGER leavetype_activity_audit_trigger AFTER UPDATE ON public."LeaveType" FOR EACH ROW EXECUTE FUNCTION leavetype_activity_audit();

CREATE TRIGGER org_activity_audit_trigger AFTER UPDATE ON public."Organisation" FOR EACH ROW EXECUTE FUNCTION org_activity_audit();

CREATE TRIGGER team_activity_audit_trigger AFTER UPDATE ON public."Team" FOR EACH ROW EXECUTE FUNCTION team_activity_audit();

CREATE TRIGGER user_activity_audit_trigger AFTER UPDATE ON public."User" FOR EACH ROW EXECUTE FUNCTION user_activity_audit();



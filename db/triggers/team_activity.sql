-- Function to log changes to the Team table
CREATE OR REPLACE FUNCTION log_team_activity_changes() RETURNS TRIGGER AS
$$

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
$$
LANGUAGE plpgsql;

-- Trigger to call the function after an update on the Team table
CREATE OR REPLACE TRIGGER log_team_activity_changes_trigger
AFTER UPDATE ON "Team"
FOR EACH ROW
EXECUTE FUNCTION log_team_activity_changes();

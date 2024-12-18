-- Function to log changes to the Organisation table
CREATE OR REPLACE FUNCTION log_org_activity_changes() RETURNS TRIGGER AS
$$

DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns if different
        -- IF OLD.name IS DISTINCT FROM NEW.name THEN
        --     changedColumns := jsonb_set(changedColumns, '{name}', jsonb_build_object('old', OLD.name, 'new', NEW.name));
        -- END IF;

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

        -- IF OLD."startOfWorkWeek" IS DISTINCT FROM NEW."startOfWorkWeek" THEN
        --     changedColumns := jsonb_set(changedColumns, '{startOfWorkWeek}', jsonb_build_object('old', OLD."startOfWorkWeek", 'new', NEW."startOfWorkWeek"));
        -- END IF;

        -- IF OLD.workweek IS DISTINCT FROM NEW.workweek THEN
        --     changedColumns := jsonb_set(changedColumns, '{workweek}', jsonb_build_object('old', OLD.workweek, 'new', NEW.workweek));
        -- END IF;

        -- IF OLD."timeZone" IS DISTINCT FROM NEW."timeZone" THEN
        --     changedColumns := jsonb_set(changedColumns, '{timeZone}', jsonb_build_object('old', OLD."timeZone", 'new', NEW."timeZone"));
        -- END IF;

        -- IF OLD."notificationLeaveChanged" IS DISTINCT FROM NEW."notificationLeaveChanged" THEN
        --     changedColumns := jsonb_set(changedColumns, '{notificationLeaveChanged}', jsonb_build_object('old', OLD."notificationLeaveChanged", 'new', NEW."notificationLeaveChanged"));
        -- END IF;

        -- IF OLD."notificationDailySummary" IS DISTINCT FROM NEW."notificationDailySummary" THEN
        --     changedColumns := jsonb_set(changedColumns, '{notificationDailySummary}', jsonb_build_object('old', OLD."notificationDailySummary", 'new', NEW."notificationDailySummary"));
        -- END IF;

        -- IF OLD."notificationWeeklySummary" IS DISTINCT FROM NEW."notificationWeeklySummary" THEN
        --     changedColumns := jsonb_set(changedColumns, '{notificationWeeklySummary}', jsonb_build_object('old', OLD."notificationWeeklySummary", 'new', NEW."notificationWeeklySummary"));
        -- END IF;

        -- IF OLD."notificationToWhom" IS DISTINCT FROM NEW."notificationToWhom" THEN
        --     changedColumns := jsonb_set(changedColumns, '{notificationToWhom}', jsonb_build_object('old', OLD."notificationToWhom", 'new', NEW."notificationToWhom"));
        -- END IF;

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
$$
LANGUAGE plpgsql;

-- Trigger to call the function after an update on the Organisation table
CREATE OR REPLACE TRIGGER log_org_activity_changes_trigger
AFTER UPDATE ON "Organisation"
FOR EACH ROW
EXECUTE FUNCTION log_org_activity_changes();

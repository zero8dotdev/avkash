-- Function to log changes to the Organisation table
CREATE OR REPLACE FUNCTION log_org_activity_changes() RETURNS TRIGGER AS
$$

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

        IF OLD.dateformat IS DISTINCT FROM NEW.dateformat THEN
            changedColumns := array_append(changedColumns, 'dateformat');
            oldValues := jsonb_set(oldValues, '{dateformat}', to_jsonb(OLD.dateformat));
            newValues := jsonb_set(newValues, '{dateformat}', to_jsonb(NEW.dateformat));
        END IF;

        IF OLD.timeformat IS DISTINCT FROM NEW.timeformat THEN
            changedColumns := array_append(changedColumns, 'timeformat');
            oldValues := jsonb_set(oldValues, '{timeformat}', to_jsonb(OLD.timeformat));
            newValues := jsonb_set(newValues, '{timeformat}', to_jsonb(NEW.timeformat));
        END IF;

        IF OLD.location IS DISTINCT FROM NEW.location THEN
            changedColumns := array_append(changedColumns, 'location');
            oldValues := jsonb_set(oldValues, '{location}', to_jsonb(OLD.location));
            newValues := jsonb_set(newValues, '{location}', to_jsonb(NEW.location));
        END IF;

        IF OLD.visibility IS DISTINCT FROM NEW.visibility THEN
            changedColumns := array_append(changedColumns, 'visibility');
            oldValues := jsonb_set(oldValues, '{visibility}', to_jsonb(OLD.visibility));
            newValues := jsonb_set(newValues, '{visibility}', to_jsonb(NEW.visibility));
        END IF;

        IF OLD."startOfWorkWeek" IS DISTINCT FROM NEW."startOfWorkWeek" THEN
            changedColumns := array_append(changedColumns, "startOfWorkWeek");
            oldValues := jsonb_set(oldValues, '{startOfWorkWeek}', to_jsonb(OLD."startOfWorkWeek"));
            newValues := jsonb_set(newValues, '{startOfWorkWeek}', to_jsonb(NEW."startOfWorkWeek"));
        END IF;

        IF OLD.workweek IS DISTINCT FROM NEW.workweek THEN
            changedColumns := array_append(changedColumns, 'workweek');
            oldValues := jsonb_set(oldValues, '{workweek}', to_jsonb(OLD.workweek));
            newValues := jsonb_set(newValues, '{workweek}', to_jsonb(NEW.workweek));
        END IF;

        IF OLD."timeZone" IS DISTINCT FROM NEW."timeZone" THEN
            changedColumns := array_append(changedColumns, "timeZone");
            oldValues := jsonb_set(oldValues, '{timeZone}', to_jsonb(OLD."timeZone"));
            newValues := jsonb_set(newValues, '{timeZone}', to_jsonb(NEW."timeZone"));
        END IF;

        IF OLD."notificationLeaveChanged" IS DISTINCT FROM NEW."notificationLeaveChanged" THEN
            changedColumns := array_append(changedColumns, "notificationLeaveChanged");
            oldValues := jsonb_set(oldValues, '{notificationLeaveChanged}', to_jsonb(OLD."notificationLeaveChanged"));
            newValues := jsonb_set(newValues, '{notificationLeaveChanged}', to_jsonb(NEW."notificationLeaveChanged"));
        END IF;

        IF OLD."notificationDailySummary" IS DISTINCT FROM NEW."notificationDailySummary" THEN
            changedColumns := array_append(changedColumns, "notificationDailySummary");
            oldValues := jsonb_set(oldValues, '{notificationDailySummary}', to_jsonb(OLD."notificationDailySummary"));
            newValues := jsonb_set(newValues, '{notificationDailySummary}', to_jsonb(NEW."notificationDailySummary"));
        END IF;

        IF OLD."notificationWeeklySummary" IS DISTINCT FROM NEW."notificationWeeklySummary" THEN
            changedColumns := array_append(changedColumns, "notificationWeeklySummary");
            oldValues := jsonb_set(oldValues, '{notificationWeeklySummary}', to_jsonb(OLD."notificationWeeklySummary"));
            newValues := jsonb_set(newValues, '{notificationWeeklySummary}', to_jsonb(NEW."notificationWeeklySummary"));
        END IF;

        IF OLD."notificationToWhom" IS DISTINCT FROM NEW."notificationToWhom" THEN
            changedColumns := array_append(changedColumns, "notificationToWhom");
            oldValues := jsonb_set(oldValues, '{notificationToWhom}', to_jsonb(OLD."notificationToWhom"));
            newValues := jsonb_set(newValues, '{notificationToWhom}', to_jsonb(NEW."notificationToWhom"));
        END IF;

        IF OLD."ownerId" IS DISTINCT FROM NEW."ownerId" THEN
            changedColumns := array_append(changedColumns, "ownerId");
            oldValues := jsonb_set(oldValues, '{ownerId}', to_jsonb(OLD."ownerId"));
            newValues := jsonb_set(newValues, '{ownerId}', to_jsonb(NEW."ownerId"));
        END IF;

        -- Insert the log entry only if there are changes
        IF array_length(changedColumns, 1) > 0 THEN
            INSERT INTO public."OrgActivityLog" ("tableName", "orgId", "changedColumns", "oldValues", "newValues", "changedBy",keyword)
            VALUES (tableName, NEW."orgId", changedColumns, oldValues, newValues, NEW."updatedBy",'change');
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

CREATE OR REPLACE FUNCTION holiday_log_fun() RETURNS TRIGGER AS
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
            INSERT INTO "OrgActivityLog" ("tableName", "orgId", "changedColumns", "oldValues", "newValues", "changedBy",keyword)
            VALUES (tableName, NEW."orgId", changedColumns, oldValues, newValues, NEW."updatedBy",'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER holiday_log_trigger
AFTER UPDATE ON "Holiday"
FOR EACH ROW
EXECUTE FUNCTION holiday_log_fun();

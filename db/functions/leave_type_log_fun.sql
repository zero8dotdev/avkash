CREATE OR REPLACE FUNCTION leave_type_log_fun() RETURNS TRIGGER AS
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
            INSERT INTO "OrgActivityLog" ("tableName", "orgId", "changedColumns", "oldValues", "newValues", "changedBy",keyword)
            VALUES (tableName, NEW."orgId", changedColumns, oldValues, newValues, NEW."updatedBy",'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER leave_type_log_trigger
AFTER UPDATE ON "LeaveType"
FOR EACH ROW
EXECUTE FUNCTION leave_type_log_fun();

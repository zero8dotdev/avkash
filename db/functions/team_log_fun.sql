CREATE OR REPLACE FUNCTION team_log_fun() RETURNS TRIGGER AS
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
            INSERT INTO "OrgActivityLog" ("tableName", "teamId", "changedColumns", "oldValues", "newValues", "changedBy",keyword)
            VALUES (tableName, NEW."teamId", changedColumns, oldValues, newValues, NEW."updatedBy",'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER team_log_trigger
AFTER UPDATE ON "Team"
FOR EACH ROW
EXECUTE FUNCTION team_log_fun();

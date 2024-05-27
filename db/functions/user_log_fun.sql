CREATE OR REPLACE FUNCTION user_log_fun() RETURNS TRIGGER AS
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

        IF OLD.email IS DISTINCT FROM NEW.email THEN
            changedColumns := array_append(changedColumns, 'email');
            oldValues := jsonb_set(oldValues, '{email}', to_jsonb(OLD.email));
            newValues := jsonb_set(newValues, '{email}', to_jsonb(NEW.email));
        END IF;

        IF OLD."teamId" IS DISTINCT FROM NEW."team_id" THEN
            changedColumns := array_append(changedColumns, 'team_id');
            oldValues := jsonb_set(oldValues, '{team_id}', to_jsonb(OLD."team_id"));
            newValues := jsonb_set(newValues, '{team_id}', to_jsonb(NEW."team_id"));
        END IF;

        IF OLD."isManager" IS DISTINCT FROM NEW."is_manager" THEN
            changedColumns := array_append(changedColumns, 'is_manager');
            oldValues := jsonb_set(oldValues, '{is_manager}', to_jsonb(OLD."is_manager"));
            newValues := jsonb_set(newValues, '{is_manager}', to_jsonb(NEW."is_manager"));
        END IF;

        -- Insert the log entry only if there are changes
        IF array_length(changedColumns, 1) > 0 THEN
            INSERT INTO "OrgActivityLog" ("tableName", "userId", "changedColumns", "oldValues", "newValues", "changedBy",keyword)
            VALUES (tableName, NEW."userId", changedColumns, oldValues, newValues, NEW."updated_by",'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_log_trigger
AFTER UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION user_log_fun();

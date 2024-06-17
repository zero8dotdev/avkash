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
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_log_trigger
AFTER UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION user_log_fun();

-- Function to log changes to the Organisation table
CREATE OR REPLACE FUNCTION org_activity_audit() RETURNS TRIGGER AS
$$

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
$$
LANGUAGE plpgsql;

-- Trigger to call the function after an update on the Organisation table
CREATE OR REPLACE TRIGGER org_activity_audit_trigger
AFTER UPDATE ON "Organisation"
FOR EACH ROW
EXECUTE FUNCTION org_activity_audit();

-- Function to log changes to the LeaveType table
CREATE OR REPLACE FUNCTION leavetype_activity_audit() RETURNS TRIGGER AS
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
$$
LANGUAGE plpgsql;

-- Trigger to call the function after an update on the LeaveType table
CREATE OR REPLACE TRIGGER leavetype_activity_audit_trigger
AFTER UPDATE ON "LeaveType"
FOR EACH ROW
EXECUTE FUNCTION leavetype_activity_audit();

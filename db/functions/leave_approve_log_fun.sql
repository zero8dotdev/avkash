CREATE OR REPLACE FUNCTION leave_approved_log_fun()
RETURNS TRIGGER AS $$
DECLARE
    changedColumns TEXT[] := '{}';
    oldValues JSONB := '{}'::jsonb;
    newValues JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare the isApproved column and add to changedColumns, oldValues, and newValues if different
        IF OLD."isApproved" IS DISTINCT FROM NEW."isApproved" THEN
            changedColumns := array_append(changedColumns, 'isApproved');
            oldValues := jsonb_set(oldValues, '{"isApproved"}', to_jsonb(OLD."isApproved"));
            newValues := jsonb_set(newValues, '{"isApproved"}', to_jsonb(NEW."isApproved"));

            -- Insert the log entry
            INSERT INTO public."OrgActivityLog" ("tableName", "userId", "teamId", "changedColumns", "oldValues", "newValues", "changedBy", keyword)
            VALUES (tableName, NEW."userId", NEW."teamId", changedColumns, oldValues, newValues, NEW."updatedBy", 'leave approve');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER leave_approved_log_trigger
AFTER UPDATE ON "Leave"
FOR EACH ROW
EXECUTE FUNCTION leave_approved_log_fun();

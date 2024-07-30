-- Function to log changes to the Leave table for leave approval
CREATE OR REPLACE FUNCTION leave_approved_log_fun() RETURNS TRIGGER AS
$$
DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare the isApproved column and add to changedColumns if different
        IF OLD."isApproved" IS DISTINCT FROM NEW."isApproved" THEN
            changedColumns := jsonb_set(changedColumns, '{isApproved}', jsonb_build_object('old', OLD."isApproved", 'new', NEW."isApproved"));
        END IF;

        -- Insert the log entry only if there are changes
        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "userId", "teamId", "changedColumns", "changedBy", keyword)
            VALUES (tableName, NEW."userId", NEW."teamId", changedColumns, NEW."updatedBy", 'leave approve');
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Trigger to call the function after an update on the Leave table
CREATE OR REPLACE TRIGGER leave_approved_log_trigger
AFTER UPDATE ON "Leave"
FOR EACH ROW
EXECUTE FUNCTION leave_approved_log_fun();

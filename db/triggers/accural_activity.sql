-- Function to log changes to the User table for leave add-on
CREATE OR REPLACE FUNCTION user_leave_addon_log_fun() RETURNS TRIGGER AS
$$
DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare accruedLeave column and add to changedColumns if different
        IF OLD."accruedLeave" IS DISTINCT FROM NEW."accruedLeave" THEN
            changedColumns := jsonb_set(changedColumns, '{accruedLeave}', jsonb_build_object('old', OLD."accruedLeave", 'new', NEW."accruedLeave"));
        END IF;

        -- Insert the log entry only if there are changes
        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "userId", "changedColumns", "changedBy", keyword)
            VALUES (tableName, NEW."userId", changedColumns, NEW."updatedBy", 'accrual');
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Trigger to call the function after an update on the User table
CREATE OR REPLACE TRIGGER user_leave_addon_log_trigger
AFTER UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION user_leave_addon_log_fun();
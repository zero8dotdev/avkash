CREATE OR REPLACE FUNCTION user_leave_addon_log_fun() RETURNS TRIGGER AS
$$
DECLARE
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Check if accruedLeave has changed
        IF OLD."accruedLeave" IS DISTINCT FROM NEW."accruedLeave" THEN
            -- Insert log entry with complete old and new row
            INSERT INTO public."OrgActivityLog" (
                "tableName", "userId", "changedColumns", "oldValues", "newValues", "changedBy", keyword
            ) VALUES (
                tableName, 
                NEW."userId", 
                '{"accruedLeave"}',  -- Specify the changed column
                row_to_json(OLD)::jsonb, 
                row_to_json(NEW)::jsonb, 
                NEW."updatedBy", 
                'accrual'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_leave_addon_log_trigger
AFTER UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION user_leave_addon_log_fun();

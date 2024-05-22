DECLARE
    table_name TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
        -- Check if accrued_leave has changed
        IF OLD.accrued_leave IS DISTINCT FROM NEW.accrued_leave THEN
            -- Insert log entry with complete old and new row
            INSERT INTO org_activity_log (
                table_name, user_id, changed_columns, old_values, new_values, changed_by, keyword
            ) VALUES (
                table_name, 
                NEW.user_id, 
                NULL, 
                row_to_json(OLD)::jsonb, 
                row_to_json(NEW)::jsonb, 
                NEW.updated_by, 
                'accrual'
            );
        END IF;

    RETURN NEW;
END;
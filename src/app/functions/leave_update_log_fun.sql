DECLARE
    table_name TEXT := TG_TABLE_NAME;
    changed_columns TEXT[] := '{"is_approved"}';
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare is_approved and log if different
        IF OLD.is_approved IS DISTINCT FROM NEW.is_approved THEN
            -- Insert log entry with complete old and new row
            INSERT INTO org_activity_log (
                table_name, user_id, team_id, changed_columns, old_values, new_values, changed_by, keyword
            ) VALUES (
                table_name, 
                NEW.user_id, 
                NEW.team_id, 
                changed_columns, 
                row_to_json(OLD)::jsonb, 
                row_to_json(NEW)::jsonb, 
                NEW.updated_by, 
                'leave update'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
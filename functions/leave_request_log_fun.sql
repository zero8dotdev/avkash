DECLARE
    table_name TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an insert
    IF TG_OP = 'INSERT' THEN
        -- Log the entire new row
        INSERT INTO org_activity_log (
            table_name, user_id, team_id, changed_columns, old_values, new_values, changed_by, keyword
        ) VALUES (
            table_name, 
            NEW.user_id, 
            NEW.team_id, 
            NULL, 
            NULL::jsonb, 
            row_to_json(NEW)::jsonb, 
            NEW.updated_by, 
            'leave request'
        );
    END IF;

    RETURN NEW;
END;
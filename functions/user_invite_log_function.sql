DECLARE
    table_name TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an INSERT
    IF TG_OP = 'INSERT' THEN
        -- Since it's an insert, old values do not exist (will be null)
        INSERT INTO org_activity_log (table_name, user_id, changed_columns, old_values, new_values, changed_by, keyword)
        VALUES (table_name, NEW.user_id, NULL, Null, row_to_json(NEW), NEW.updated_by, 'invitation');
    END IF;

    RETURN NEW;
END;
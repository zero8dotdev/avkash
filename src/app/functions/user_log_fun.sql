DECLARE
    changed_columns TEXT[] := '{}';
    old_values JSONB := '{}'::jsonb;
    new_values JSONB := '{}'::jsonb;
        table_name TEXT := TG_TABLE_NAME;  

BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changed_columns, old_values, and new_values if different
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            changed_columns := array_append(changed_columns, 'name');
            old_values := jsonb_set(old_values, '{name}', to_jsonb(OLD.name));
            new_values := jsonb_set(new_values, '{name}', to_jsonb(NEW.name));
        END IF;

        IF OLD.email IS DISTINCT FROM NEW.email THEN
            changed_columns := array_append(changed_columns, 'email');
            old_values := jsonb_set(old_values, '{email}', to_jsonb(OLD.email));
            new_values := jsonb_set(new_values, '{email}', to_jsonb(NEW.email));
        END IF;

        IF OLD.team_id IS DISTINCT FROM NEW.team_id THEN
            changed_columns := array_append(changed_columns, 'team_id');
            old_values := jsonb_set(old_values, '{team_id}', to_jsonb(OLD.team_id));
            new_values := jsonb_set(new_values, '{team_id}', to_jsonb(NEW.team_id));
        END IF;

        IF OLD.is_manager IS DISTINCT FROM NEW.is_manager THEN
            changed_columns := array_append(changed_columns, 'is_manager');
            old_values := jsonb_set(old_values, '{is_manager}', to_jsonb(OLD.is_manager));
            new_values := jsonb_set(new_values, '{is_manager}', to_jsonb(NEW.is_manager));
        END IF;






      
        -- Insert the log entry only if there are changes
        IF array_length(changed_columns, 1) > 0 THEN
            INSERT INTO org_activity_log (table_name,user_id, changed_columns, old_values, new_values, changed_by)
            VALUES (table_name,NEW.user_id, changed_columns, old_values, new_values, NEW.updated_by);
        END IF;
    END IF;

    RETURN NEW;
END;
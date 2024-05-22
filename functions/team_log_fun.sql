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

        IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
            changed_columns := array_append(changed_columns, 'is_active');
            old_values := jsonb_set(old_values, '{is_active}', to_jsonb(OLD.is_active));
            new_values := jsonb_set(new_values, '{is_active}', to_jsonb(NEW.is_active));
        END IF;

        IF OLD.org_id IS DISTINCT FROM NEW.org_id THEN
            changed_columns := array_append(changed_columns, 'org_id');
            old_values := jsonb_set(old_values, '{org_id}', to_jsonb(OLD.org_id));
            new_values := jsonb_set(new_values, '{org_id}', to_jsonb(NEW.org_id));
        END IF;


        IF OLD.manager IS DISTINCT FROM NEW.manager THEN
            changed_columns := array_append(changed_columns, 'manager');
            old_values := jsonb_set(old_values, '{manager}', to_jsonb(OLD.manager));
            new_values := jsonb_set(new_values, '{manager}', to_jsonb(NEW.manager));
        END IF;


        -- Insert the log entry only if there are changes
        IF array_length(changed_columns, 1) > 0 THEN
            INSERT INTO org_activity_log (table_name,team_id, changed_columns, old_values, new_values, changed_by)
            VALUES (table_name,NEW.team_id, changed_columns, old_values, new_values, NEW.updated_by);
        END IF;
    END IF;

    RETURN NEW;
END;
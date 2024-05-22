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

        IF OLD.date IS DISTINCT FROM NEW.date THEN
            changed_columns := array_append(changed_columns, 'date');
            old_values := jsonb_set(old_values, '{date}', to_jsonb(OLD.date));
            new_values := jsonb_set(new_values, '{date}', to_jsonb(NEW.date));
        END IF;

        IF OLD.is_recurring IS DISTINCT FROM NEW.is_recurring THEN
            changed_columns := array_append(changed_columns, 'is_recurring');
            old_values := jsonb_set(old_values, '{is_recurring}', to_jsonb(OLD.is_recurring));
            new_values := jsonb_set(new_values, '{is_recurring}', to_jsonb(NEW.is_recurring));
        END IF;

        IF OLD.is_custom IS DISTINCT FROM NEW.is_custom THEN
            changed_columns := array_append(changed_columns, 'is_custom');
            old_values := jsonb_set(old_values, '{is_custom}', to_jsonb(OLD.is_custom));
            new_values := jsonb_set(new_values, '{is_custom}', to_jsonb(NEW.is_custom));
        END IF;

        IF OLD.org_id IS DISTINCT FROM NEW.org_id THEN
            changed_columns := array_append(changed_columns, 'org_id');
            old_values := jsonb_set(old_values, '{org_id}', to_jsonb(OLD.org_id));
            new_values := jsonb_set(new_values, '{org_id}', to_jsonb(NEW.org_id));
        END IF;

        -- Insert the log entry only if there are changes
 IF array_length(changed_columns, 1) > 0 THEN
            INSERT INTO org_activity_log (table_name,org_id, changed_columns, old_values, new_values, changed_by)
            VALUES (table_name,NEW.org_id, changed_columns, old_values, new_values, NEW.updated_by);
        END IF;
    END IF;

    RETURN NEW;
END;
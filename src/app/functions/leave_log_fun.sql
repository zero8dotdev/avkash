DECLARE
    changed_columns TEXT[] := '{}';
    old_values JSONB := '{}'::jsonb;
    new_values JSONB := '{}'::jsonb;
    table_name TEXT := TG_TABLE_NAME;  

BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changed_columns, old_values, and new_values if different
        IF OLD.leave_type IS DISTINCT FROM NEW.leave_type THEN
            changed_columns := array_append(changed_columns, 'leave_type');
            old_values := jsonb_set(old_values, '{leave_type}', to_jsonb(OLD.leave_type));
            new_values := jsonb_set(new_values, '{leave_type}', to_jsonb(NEW.leave_type));
        END IF;

        IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
            changed_columns := array_append(changed_columns, 'start_date');
            old_values := jsonb_set(old_values, '{start_date}', to_jsonb(OLD.start_date));
            new_values := jsonb_set(new_values, '{start_date}', to_jsonb(NEW.start_date));
        END IF;

        IF OLD.end_date IS DISTINCT FROM NEW.end_date THEN
            changed_columns := array_append(changed_columns, 'end_date');
            old_values := jsonb_set(old_values, '{end_date}', to_jsonb(OLD.end_date));
            new_values := jsonb_set(new_values, '{end_date}', to_jsonb(NEW.end_date));
        END IF;

        IF OLD.duration IS DISTINCT FROM NEW.duration THEN
            changed_columns := array_append(changed_columns, 'duration');
            old_values := jsonb_set(old_values, '{duration}', to_jsonb(OLD.duration));
            new_values := jsonb_set(new_values, '{duration}', to_jsonb(NEW.duration));
        END IF;



        IF OLD.shift IS DISTINCT FROM NEW.shift THEN
            changed_columns := array_append(changed_columns, 'shift');
            old_values := jsonb_set(old_values, '{shift}', to_jsonb(OLD.shift));
            new_values := jsonb_set(new_values, '{shift}', to_jsonb(NEW.shift));
        END IF;



        IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
            changed_columns := array_append(changed_columns, 'user_id');
            old_values := jsonb_set(old_values, '{user_id}', to_jsonb(OLD.user_id));
            new_values := jsonb_set(new_values, '{user_id}', to_jsonb(NEW.user_id));
        END IF;

        IF OLD.team_id IS DISTINCT FROM NEW.team_id THEN
            changed_columns := array_append(changed_columns, 'team_id');
            old_values := jsonb_set(old_values, '{team_id}', to_jsonb(OLD.team_id));
            new_values := jsonb_set(new_values, '{team_id}', to_jsonb(NEW.team_id));
        END IF;

        IF OLD.reason IS DISTINCT FROM NEW.reason THEN
            changed_columns := array_append(changed_columns, 'reason');
            old_values := jsonb_set(old_values, '{reason}', to_jsonb(OLD.reason));
            new_values := jsonb_set(new_values, '{reason}', to_jsonb(NEW.reason));
        END IF;
        -- Insert the log entry only if there are changes
        IF array_length(changed_columns, 1) > 0 THEN
            INSERT INTO org_activity_log (table_name,user_id,team_id, changed_columns, old_values, new_values, changed_by)
            VALUES (table_name,NEW.user_id,NEW.team_id, changed_columns, old_values, new_values, NEW.updated_by);
        END IF;
    END IF;

    RETURN NEW;
END;
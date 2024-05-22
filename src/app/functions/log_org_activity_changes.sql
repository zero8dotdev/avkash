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

        IF OLD.date_format IS DISTINCT FROM NEW.date_format THEN
            changed_columns := array_append(changed_columns, 'date_format');
            old_values := jsonb_set(old_values, '{date_format}', to_jsonb(OLD.date_format));
            new_values := jsonb_set(new_values, '{date_format}', to_jsonb(NEW.date_format));
        END IF;

        IF OLD.time_format IS DISTINCT FROM NEW.time_format THEN
            changed_columns := array_append(changed_columns, 'time_format');
            old_values := jsonb_set(old_values, '{time_format}', to_jsonb(OLD.time_format));
            new_values := jsonb_set(new_values, '{time_format}', to_jsonb(NEW.time_format));
        END IF;

        IF OLD.location IS DISTINCT FROM NEW.location THEN
            changed_columns := array_append(changed_columns, 'location');
            old_values := jsonb_set(old_values, '{location}', to_jsonb(OLD.location));
            new_values := jsonb_set(new_values, '{location}', to_jsonb(NEW.location));
        END IF;

        IF OLD.visibility IS DISTINCT FROM NEW.visibility THEN
            changed_columns := array_append(changed_columns, 'visibility');
            old_values := jsonb_set(old_values, '{visibility}', to_jsonb(OLD.visibility));
            new_values := jsonb_set(new_values, '{visibility}', to_jsonb(NEW.visibility));
        END IF;

        IF OLD.start_of_work_week IS DISTINCT FROM NEW.start_of_work_week THEN
            changed_columns := array_append(changed_columns, 'start_of_work_week');
            old_values := jsonb_set(old_values, '{start_of_work_week}', to_jsonb(OLD.start_of_work_week));
            new_values := jsonb_set(new_values, '{start_of_work_week}', to_jsonb(NEW.start_of_work_week));
        END IF;

        IF OLD.work_week IS DISTINCT FROM NEW.work_week THEN
            changed_columns := array_append(changed_columns, 'work_week');
            old_values := jsonb_set(old_values, '{work_week}', to_jsonb(OLD.work_week));
            new_values := jsonb_set(new_values, '{work_week}', to_jsonb(NEW.work_week));
        END IF;

        IF OLD.time_zone IS DISTINCT FROM NEW.time_zone THEN
            changed_columns := array_append(changed_columns, 'time_zone');
            old_values := jsonb_set(old_values, '{time_zone}', to_jsonb(OLD.time_zone));
            new_values := jsonb_set(new_values, '{time_zone}', to_jsonb(NEW.time_zone));
        END IF;

        IF OLD.notification_leave_changed IS DISTINCT FROM NEW.notification_leave_changed THEN
            changed_columns := array_append(changed_columns, 'notification_leave_changed');
            old_values := jsonb_set(old_values, '{notification_leave_changed}', to_jsonb(OLD.notification_leave_changed));
            new_values := jsonb_set(new_values, '{notification_leave_changed}', to_jsonb(NEW.notification_leave_changed));
        END IF;

        IF OLD.notification_daily_summary IS DISTINCT FROM NEW.notification_daily_summary THEN
            changed_columns := array_append(changed_columns, 'notification_daily_summary');
            old_values := jsonb_set(old_values, '{notification_daily_summary}', to_jsonb(OLD.notification_daily_summary));
            new_values := jsonb_set(new_values, '{notification_daily_summary}', to_jsonb(NEW.notification_daily_summary));
        END IF;

        IF OLD.notification_weekly_summary IS DISTINCT FROM NEW.notification_weekly_summary THEN
            changed_columns := array_append(changed_columns, 'notification_weekly_summary');
            old_values := jsonb_set(old_values, '{notification_weekly_summary}', to_jsonb(OLD.notification_weekly_summary));
            new_values := jsonb_set(new_values, '{notification_weekly_summary}', to_jsonb(NEW.notification_weekly_summary));
        END IF;

        IF OLD.notification_to_whom IS DISTINCT FROM NEW.notification_to_whom THEN
            changed_columns := array_append(changed_columns, 'notification_to_whom');
            old_values := jsonb_set(old_values, '{notification_to_whom}', to_jsonb(OLD.notification_to_whom));
            new_values := jsonb_set(new_values, '{notification_to_whom}', to_jsonb(NEW.notification_to_whom));
        END IF;

        IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
            changed_columns := array_append(changed_columns, 'owner_id');
            old_values := jsonb_set(old_values, '{owner_id}', to_jsonb(OLD.owner_id));
            new_values := jsonb_set(new_values, '{owner_id}', to_jsonb(NEW.owner_id));
        END IF;

        -- Insert the log entry only if there are changes
        IF array_length(changed_columns, 1) > 0 THEN
            INSERT INTO org_activity_log (table_name,org_id, changed_columns, old_values, new_values, changed_by)
            VALUES (table_name,NEW.org_id, changed_columns, old_values, new_values, NEW.updated_by);
        END IF;
    END IF;

    RETURN NEW;
END;
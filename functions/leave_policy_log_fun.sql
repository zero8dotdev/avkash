DECLARE
    changed_columns TEXT[] := '{}';
    old_values JSONB := '{}'::jsonb;
    new_values JSONB := '{}'::jsonb;
        table_name TEXT := TG_TABLE_NAME;  
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changed_columns, old_values, and new_values if different
    
        IF OLD.leave_type_id IS DISTINCT FROM NEW.leave_type_id THEN
            changed_columns := array_append(changed_columns, 'leave_type_id');
            old_values := jsonb_set(old_values, '{leave_type_id}', to_jsonb(OLD.leave_type_id));
            new_values := jsonb_set(new_values, '{leave_type_id}', to_jsonb(NEW.leave_type_id));
        END IF;

        IF OLD.unlimited IS DISTINCT FROM NEW.unlimited THEN
            changed_columns := array_append(changed_columns, 'unlimited');
            old_values := jsonb_set(old_values, '{unlimited}', to_jsonb(OLD.unlimited));
            new_values := jsonb_set(new_values, '{unlimited}', to_jsonb(NEW.unlimited));
        END IF;

        IF OLD.max_leaves IS DISTINCT FROM NEW.max_leaves THEN
            changed_columns := array_append(changed_columns, 'max_leaves');
            old_values := jsonb_set(old_values, '{max_leaves}', to_jsonb(OLD.max_leaves));
            new_values := jsonb_set(new_values, '{max_leaves}', to_jsonb(NEW.max_leaves));
        END IF;

        IF OLD.accurals IS DISTINCT FROM NEW.accurals THEN
            changed_columns := array_append(changed_columns, 'accurals');
            old_values := jsonb_set(old_values, '{accurals}', to_jsonb(OLD.accurals));
            new_values := jsonb_set(new_values, '{accurals}', to_jsonb(NEW.accurals));
        END IF;

        IF OLD.accural_frequency IS DISTINCT FROM NEW.accural_frequency THEN
            changed_columns := array_append(changed_columns, 'accural_frequency');
            old_values := jsonb_set(old_values, '{accural_frequency}', to_jsonb(OLD.accural_frequency));
            new_values := jsonb_set(new_values, '{accural_frequency}', to_jsonb(NEW.accural_frequency));
        END IF;

        IF OLD.accrue_on IS DISTINCT FROM NEW.accrue_on THEN
            changed_columns := array_append(changed_columns, 'accrue_on');
            old_values := jsonb_set(old_values, '{accrue_on}', to_jsonb(OLD.accrue_on));
            new_values := jsonb_set(new_values, '{accrue_on}', to_jsonb(NEW.accrue_on));
        END IF;

        IF OLD.roll_over IS DISTINCT FROM NEW.roll_over THEN
            changed_columns := array_append(changed_columns, 'roll_over');
            old_values := jsonb_set(old_values, '{roll_over}', to_jsonb(OLD.roll_over));
            new_values := jsonb_set(new_values, '{roll_over}', to_jsonb(NEW.roll_over));
        END IF;

        IF OLD.roll_over_limit IS DISTINCT FROM NEW.roll_over_limit THEN
            changed_columns := array_append(changed_columns, 'roll_over_limit');
            old_values := jsonb_set(old_values, '{roll_over_limit}', to_jsonb(OLD.roll_over_limit));
            new_values := jsonb_set(new_values, '{roll_over_limit}', to_jsonb(NEW.roll_over_limit));
        END IF;

        IF OLD.org_id IS DISTINCT FROM NEW.org_id THEN
            changed_columns := array_append(changed_columns, 'org_id');
            old_values := jsonb_set(old_values, '{org_id}', to_jsonb(OLD.org_id));
            new_values := jsonb_set(new_values, '{org_id}', to_jsonb(NEW.org_id));
        END IF;


        IF OLD.roll_over_expiry IS DISTINCT FROM NEW.roll_over_expiry THEN
            changed_columns := array_append(changed_columns, 'roll_over_expiry');
            old_values := jsonb_set(old_values, '{roll_over_expiry}', to_jsonb(OLD.roll_over_expiry));
            new_values := jsonb_set(new_values, '{roll_over_expiry}', to_jsonb(NEW.roll_over_expiry));
        END IF;

        IF OLD.auto_approve IS DISTINCT FROM NEW.auto_approve THEN
            changed_columns := array_append(changed_columns, 'auto_approve');
            old_values := jsonb_set(old_values, '{auto_approve}', to_jsonb(OLD.auto_approve));
            new_values := jsonb_set(new_values, '{auto_approve}', to_jsonb(NEW.auto_approve));
        END IF;

        IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
            changed_columns := array_append(changed_columns, 'is_active');
            old_values := jsonb_set(old_values, '{is_active}', to_jsonb(OLD.is_active));
            new_values := jsonb_set(new_values, '{is_active}', to_jsonb(NEW.is_active));
        END IF;

        

        -- Insert the log entry only if there are changes
        IF array_length(changed_columns, 1) > 0 THEN
            INSERT INTO org_activity_log (table_name,org_id, changed_columns, old_values, new_values, changed_by)
            VALUES (table_name,NEW.org_id, changed_columns, old_values, new_values, NEW.updated_by);
        END IF;
    END IF;

    RETURN NEW;
END;
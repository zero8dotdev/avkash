-- Function to log changes to the LeavePolicy table
CREATE OR REPLACE FUNCTION log_leavepolicy_activity_changes() RETURNS TRIGGER AS
$$

DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns if different
        IF OLD.leaveTypeId IS DISTINCT FROM NEW.leaveTypeId THEN
            changedColumns := jsonb_set(changedColumns, '{leaveTypeId}', jsonb_build_object('old', OLD.leaveTypeId, 'new', NEW.leaveTypeId));
        END IF;
        IF OLD.unlimited IS DISTINCT FROM NEW.unlimited THEN
            changedColumns := jsonb_set(changedColumns, '{unlimited}', jsonb_build_object('old', OLD.unlimited, 'new', NEW.unlimited));
        END IF;
        IF OLD.maxLeaves IS DISTINCT FROM NEW.maxLeaves THEN
            changedColumns := jsonb_set(changedColumns, '{maxLeaves}', jsonb_build_object('old', OLD.maxLeaves, 'new', NEW.maxLeaves));
        END IF;
        IF OLD.accruals IS DISTINCT FROM NEW.accruals THEN
            changedColumns := jsonb_set(changedColumns, '{accruals}', jsonb_build_object('old', OLD.accruals, 'new', NEW.accruals));
        END IF;
        IF OLD.accrualFrequency IS DISTINCT FROM NEW.accrualFrequency THEN
            changedColumns := jsonb_set(changedColumns, '{accrualFrequency}', jsonb_build_object('old', OLD.accrualFrequency, 'new', NEW.accrualFrequency));
        END IF;
        IF OLD.accrueOn IS DISTINCT FROM NEW.accrueOn THEN
            changedColumns := jsonb_set(changedColumns, '{accrueOn}', jsonb_build_object('old', OLD.accrueOn, 'new', NEW.accrueOn));
        END IF;
        IF OLD.rollOver IS DISTINCT FROM NEW.rollOver THEN
            changedColumns := jsonb_set(changedColumns, '{rollOver}', jsonb_build_object('old', OLD.rollOver, 'new', NEW.rollOver));
        END IF;
        IF OLD.rollOverLimit IS DISTINCT FROM NEW.rollOverLimit THEN
            changedColumns := jsonb_set(changedColumns, '{rollOverLimit}', jsonb_build_object('old', OLD.rollOverLimit, 'new', NEW.rollOverLimit));
        END IF;
        IF OLD.orgId IS DISTINCT FROM NEW.orgId THEN
            changedColumns := jsonb_set(changedColumns, '{orgId}', jsonb_build_object('old', OLD.orgId, 'new', NEW.orgId));
        END IF;
        IF OLD.updatedBy IS DISTINCT FROM NEW.updatedBy THEN
            changedColumns := jsonb_set(changedColumns, '{updatedBy}', jsonb_build_object('old', OLD.updatedBy, 'new', NEW.updatedBy));
        END IF;
        IF OLD.updatedOn IS DISTINCT FROM NEW.updatedOn THEN
            changedColumns := jsonb_set(changedColumns, '{updatedOn}', jsonb_build_object('old', OLD.updatedOn, 'new', NEW.updatedOn));
        END IF;

        -- Insert the log entry only if there are changes
        IF jsonb_array_length(changedColumns) > 0 THEN
            INSERT INTO public."ActivityLog" ("tableName", "orgId", "changedColumns", "changedBy", keyword)
            VALUES (tableName, NEW."orgId", changedColumns, NEW."updatedBy", 'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Trigger to call the function after an update on the LeavePolicy table
CREATE OR REPLACE TRIGGER log_leavepolicy_activity_changes_trigger
AFTER UPDATE ON "LeavePolicy"
FOR EACH ROW
EXECUTE FUNCTION log_leavepolicy_activity_changes();

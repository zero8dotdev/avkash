CREATE OR REPLACE FUNCTION leave_policy_log_fun() RETURNS TRIGGER AS
$$

DECLARE
    changedColumns TEXT[] := '{}';
    oldValues JSONB := '{}'::jsonb;
    newValues JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns, oldValues, and newValues if different

        IF OLD."leaveTypeId" IS DISTINCT FROM NEW."leaveTypeId" THEN
            changedColumns := array_append(changedColumns, 'leaveTypeId');
            oldValues := jsonb_set(oldValues, '{leaveTypeId}', to_jsonb(OLD."leaveTypeId"));
            newValues := jsonb_set(newValues, '{leaveTypeId}', to_jsonb(NEW."leaveTypeId"));
        END IF;

        IF OLD."unlimited" IS DISTINCT FROM NEW."unlimited" THEN
            changedColumns := array_append(changedColumns, 'unlimited');
            oldValues := jsonb_set(oldValues, '{unlimited}', to_jsonb(OLD."unlimited"));
            newValues := jsonb_set(newValues, '{unlimited}', to_jsonb(NEW."unlimited"));
        END IF;

        IF OLD."maxLeaves" IS DISTINCT FROM NEW."maxLeaves" THEN
            changedColumns := array_append(changedColumns, 'maxLeaves');
            oldValues := jsonb_set(oldValues, '{maxLeaves}', to_jsonb(OLD."maxLeaves"));
            newValues := jsonb_set(newValues, '{maxLeaves}', to_jsonb(NEW."maxLeaves"));
        END IF;

        IF OLD."accruals" IS DISTINCT FROM NEW."accruals" THEN
            changedColumns := array_append(changedColumns, 'accruals');
            oldValues := jsonb_set(oldValues, '{accruals}', to_jsonb(OLD."accruals"));
            newValues := jsonb_set(newValues, '{accruals}', to_jsonb(NEW."accruals"));
        END IF;

        IF OLD."accrualFrequency" IS DISTINCT FROM NEW."accrualFrequency" THEN
            changedColumns := array_append(changedColumns, 'accrualFrequency');
            oldValues := jsonb_set(oldValues, '{accrualFrequency}', to_jsonb(OLD."accrualFrequency"));
            newValues := jsonb_set(newValues, '{accrualFrequency}', to_jsonb(NEW."accrualFrequency"));
        END IF;

        IF OLD."accrueOn" IS DISTINCT FROM NEW."accrueOn" THEN
            changedColumns := array_append(changedColumns, 'accrueOn');
            oldValues := jsonb_set(oldValues, '{accrueOn}', to_jsonb(OLD."accrueOn"));
            newValues := jsonb_set(newValues, '{accrueOn}', to_jsonb(NEW."accrueOn"));
        END IF;

        IF OLD."rollOver" IS DISTINCT FROM NEW."rollOver" THEN
            changedColumns := array_append(changedColumns, 'rollOver');
            oldValues := jsonb_set(oldValues, '{rollOver}', to_jsonb(OLD."rollOver"));
            newValues := jsonb_set(newValues, '{rollOver}', to_jsonb(NEW."rollOver"));
        END IF;

        IF OLD."rollOverLimit" IS DISTINCT FROM NEW."rollOverLimit" THEN
            changedColumns := array_append(changedColumns, 'rollOverLimit');
            oldValues := jsonb_set(oldValues, '{rollOverLimit}', to_jsonb(OLD."rollOverLimit"));
            newValues := jsonb_set(newValues, '{rollOverLimit}', to_jsonb(NEW."rollOverLimit"));
        END IF;

        IF OLD."orgId" IS DISTINCT FROM NEW."orgId" THEN
            changedColumns := array_append(changedColumns, 'orgId');
            oldValues := jsonb_set(oldValues, '{orgId}', to_jsonb(OLD."orgId"));
            newValues := jsonb_set(newValues, '{orgId}', to_jsonb(NEW."orgId"));
        END IF;

        IF OLD."rollOverExpiry" IS DISTINCT FROM NEW."rollOverExpiry" THEN
            changedColumns := array_append(changedColumns, 'rollOverExpiry');
            oldValues := jsonb_set(oldValues, '{rollOverExpiry}', to_jsonb(OLD."rollOverExpiry"));
            newValues := jsonb_set(newValues, '{rollOverExpiry}', to_jsonb(NEW."rollOverExpiry"));
        END IF;

        IF OLD."autoApprove" IS DISTINCT FROM NEW."autoApprove" THEN
            changedColumns := array_append(changedColumns, 'autoApprove');
            oldValues := jsonb_set(oldValues, '{autoApprove}', to_jsonb(OLD."autoApprove"));
            newValues := jsonb_set(newValues, '{autoApprove}', to_jsonb(NEW."autoApprove"));
        END IF;

        IF OLD."isActive" IS DISTINCT FROM NEW."isActive" THEN
            changedColumns := array_append(changedColumns, 'isActive');
            oldValues := jsonb_set(oldValues, '{isActive}', to_jsonb(OLD."isActive"));
            newValues := jsonb_set(newValues, '{isActive}', to_jsonb(NEW."isActive"));
        END IF;

        -- Insert the log entry only if there are changes
        IF array_length(changedColumns, 1) > 0 THEN
            INSERT INTO public."OrgActivityLog" ("tableName", "orgId", "changedColumns", "oldValues", "newValues", "changedBy","keyword")
            VALUES (tableName, NEW."orgId", changedColumns, oldValues, newValues, NEW."updatedBy",'change');
        END IF;
    END IF;

    RETURN NEW;
END;

$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER leave_policy_log_trigger
AFTER UPDATE ON "LeavePolicy"
FOR EACH ROW
EXECUTE FUNCTION leave_policy_log_fun();

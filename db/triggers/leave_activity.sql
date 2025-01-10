-- Function to log changes to the Leave table
CREATE OR REPLACE FUNCTION log_leave_activity_changes() RETURNS TRIGGER AS
$$

DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns if different
        IF OLD."leaveTypeId" IS DISTINCT FROM NEW."leaveTypeId" THEN
            changedColumns := jsonb_set(changedColumns, '{leaveTypeId}', jsonb_build_object('old', OLD."leaveTypeId", 'new', NEW."leaveTypeId"));
        END IF;
        IF OLD."startDate" IS DISTINCT FROM NEW."startDate" THEN
            changedColumns := jsonb_set(changedColumns, '{startDate}', jsonb_build_object('old', OLD."startDate", 'new', NEW."startDate"));
        END IF;
        IF OLD."endDate" IS DISTINCT FROM NEW."endDate" THEN
            changedColumns := jsonb_set(changedColumns, '{endDate}', jsonb_build_object('old', OLD."endDate", 'new', NEW."endDate"));
        END IF;
        IF OLD."duration" IS DISTINCT FROM NEW."duration" THEN
            changedColumns := jsonb_set(changedColumns, '{duration}', jsonb_build_object('old', OLD."duration", 'new', NEW."duration"));
        END IF;
        IF OLD."shift" IS DISTINCT FROM NEW."shift" THEN
            changedColumns := jsonb_set(changedColumns, '{shift}', jsonb_build_object('old', OLD."shift", 'new', NEW."shift"));
        END IF;
        -- IF OLD."isApproved" IS DISTINCT FROM NEW."isApproved" THEN
        --     changedColumns := jsonb_set(changedColumns, '{isApproved}', jsonb_build_object('old', OLD."isApproved", 'new', NEW."isApproved"));
        -- END IF;
        IF OLD."userId" IS DISTINCT FROM NEW."userId" THEN
            changedColumns := jsonb_set(changedColumns, '{userId}', jsonb_build_object('old', OLD."userId", 'new', NEW."userId"));
        END IF;
        IF OLD."teamId" IS DISTINCT FROM NEW."teamId" THEN
            changedColumns := jsonb_set(changedColumns, '{teamId}', jsonb_build_object('old', OLD."teamId", 'new', NEW."teamId"));
        END IF;
        IF OLD."reason" IS DISTINCT FROM NEW."reason" THEN
            changedColumns := jsonb_set(changedColumns, '{reason}', jsonb_build_object('old', OLD."reason", 'new', NEW."reason"));
        END IF;
        IF OLD."managerComment" IS DISTINCT FROM NEW."managerComment" THEN
            changedColumns := jsonb_set(changedColumns, '{managerComment}', jsonb_build_object('old', OLD."managerComment", 'new', NEW."managerComment"));
        END IF;
        IF OLD."orgId" IS DISTINCT FROM NEW."orgId" THEN
            changedColumns := jsonb_set(changedColumns, '{orgId}', jsonb_build_object('old', OLD."orgId", 'new', NEW."orgId"));
        END IF;
        IF OLD."updatedBy" IS DISTINCT FROM NEW."updatedBy" THEN
            changedColumns := jsonb_set(changedColumns, '{updatedBy}', jsonb_build_object('old', OLD."updatedBy", 'new', NEW."updatedBy"));
        END IF;
        IF OLD."updatedOn" IS DISTINCT FROM NEW."updatedOn" THEN
            changedColumns := jsonb_set(changedColumns, '{updatedOn}', jsonb_build_object('old', OLD."updatedOn", 'new', NEW."updatedOn"));
        END IF;

        -- Insert the log entry only if there are changes
        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "orgId", "changedColumns", "changedBy", "keyword")
            VALUES (tableName, NEW."orgId", changedColumns, NEW."updatedBy", 'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Trigger to call the function after an update on the Leave table
CREATE OR REPLACE TRIGGER log_leave_activity_changes_trigger
AFTER UPDATE ON "Leave"
FOR EACH ROW
EXECUTE FUNCTION log_leave_activity_changes();

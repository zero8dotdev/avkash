-- Function to log changes to the Leave table for leave requests
CREATE OR REPLACE FUNCTION leave_request_activity_audit() RETURNS TRIGGER AS
$$
DECLARE
    tableName TEXT := TG_TABLE_NAME;
    changedColumns JSONB := '{}'::jsonb;
BEGIN
    -- Check if the operation is an INSERT
    IF TG_OP = 'INSERT' THEN
        -- Log all new columns and their values as changed columns
        changedColumns := jsonb_build_object(
            'leaveTypeId', jsonb_build_object('new', NEW."leaveTypeId"),
            'startDate', jsonb_build_object('new', NEW."startDate"),
            'endDate', jsonb_build_object('new', NEW."endDate"),
            'duration', jsonb_build_object('new', NEW."duration"),
            'shift', jsonb_build_object('new', NEW."shift"),
            'isApproved', jsonb_build_object('new', NEW."isApproved"),
            'userId', jsonb_build_object('new', NEW."userId"),
            'teamId', jsonb_build_object('new', NEW."teamId"),
            'reason', jsonb_build_object('new', NEW."reason"),
            'managerComment', jsonb_build_object('new', NEW."managerComment"),
            'orgId', jsonb_build_object('new', NEW."orgId"),
            'createdOn', jsonb_build_object('new', NEW."createdOn"),
            'createdBy', jsonb_build_object('new', NEW."createdBy"),
            'updatedBy', jsonb_build_object('new', NEW."updatedBy"),
            'updatedOn', jsonb_build_object('new', NEW."updatedOn")
        );

        -- Log the entire new row
        INSERT INTO public."ActivityLog" ("tableName", "userId", "teamId", "changedColumns", "changedBy", "keyword")
        VALUES (tableName, NEW."userId", NEW."teamId", changedColumns, NEW."updatedBy", 'leave_request');
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Trigger to call the function after an insert on the Leave table
CREATE OR REPLACE TRIGGER leave_request_activity_audit_trigger
AFTER INSERT ON "Leave"
FOR EACH ROW
EXECUTE FUNCTION leave_request_activity_audit();

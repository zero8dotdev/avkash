CREATE OR REPLACE FUNCTION leave_request_log_fun() RETURNS TRIGGER AS
$$

DECLARE
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an insert
    IF TG_OP = 'INSERT' THEN
        -- Log the entire new row
        INSERT INTO public."OrgActivityLog" (
            "tableName", "userId", "teamId", "changedColumns", "oldValues", "newValues", "changedBy", "keyword"
        ) VALUES (
            tableName,
            NEW."userId",
            NEW."teamId",
            NULL,
            NULL::jsonb,
            row_to_json(NEW)::jsonb,
            NEW."updatedBy",
            'leave request'
        );
    END IF;

    RETURN NEW;
END;

$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER leave_request_log_trigger
AFTER INSERT ON "Leave"
FOR EACH ROW
EXECUTE FUNCTION leave_request_log_fun();

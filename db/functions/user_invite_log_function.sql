CREATE OR REPLACE FUNCTION user_invite_log_function() RETURNS TRIGGER AS
$$
DECLARE
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an INSERT
    IF TG_OP = 'INSERT' THEN
        -- Since it's an insert, old values do not exist (will be null)
        INSERT INTO "OrgActivityLog" (
            "tableName", "userId", "changedColumns", "oldValues", "newValues", "changedBy", keyword
        ) VALUES (
            tableName,
            NEW."userId",
            NULL,
            NULL::jsonb,
            row_to_json(NEW)::jsonb,
            NEW."updatedBy",
            'invitation'
        );
    END IF;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER user_invite_log_trigger
AFTER INSERT ON "User"
FOR EACH ROW
EXECUTE FUNCTION user_invite_log_function();
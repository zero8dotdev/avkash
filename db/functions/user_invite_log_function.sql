CREATE OR REPLACE FUNCTION user_invite_log_function() RETURNS TRIGGER AS
$$
DECLARE
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an INSERT
    IF TG_OP = 'INSERT' THEN
        -- Determine the keyword and insert accordingly
        IF NEW.keyword = 'joined' THEN
            INSERT INTO public."OrgActivityLog" (
                "tableName", "userId", "changedColumns", "oldValues", "newValues", "changedBy", keyword
            ) VALUES (
                tableName,
                NEW."userId",
                NULL,
                NULL::jsonb,
                row_to_json(NEW)::jsonb,
                NEW."updatedBy",
                'joined'
            );
        ELSE
            INSERT INTO public."OrgActivityLog" (
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
    END IF;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER user_invite_log_trigger
AFTER INSERT ON "User"
FOR EACH ROW
EXECUTE FUNCTION user_invite_log_function();
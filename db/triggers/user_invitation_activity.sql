-- Function to log changes to the User table for invitations
CREATE OR REPLACE FUNCTION user_invite_log_function() RETURNS TRIGGER AS
$$
DECLARE
    tableName TEXT := TG_TABLE_NAME;
    changedColumns JSONB := '{}'::jsonb;
BEGIN
    -- Check if the operation is an INSERT
    IF TG_OP = 'INSERT' THEN
        -- Determine the keyword and insert accordingly
        IF NEW.keyword = 'joined' THEN
            INSERT INTO public."ActivityLog" ("tableName", "userId", "changedColumns", "changedBy", "keyword")
            VALUES (tableName, NEW."userId", NULL, NEW."updatedBy", 'joined');
        ELSE
            INSERT INTO public."ActivityLog" ("tableName", "userId", "changedColumns", "changedBy", "keyword")
            VALUES (tableName, NEW."userId", NULL, NEW."updatedBy", 'invitation');
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Trigger to call the function after an insert or update on the User table
CREATE OR REPLACE TRIGGER user_invite_log_trigger
AFTER INSERT OR UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION user_invite_log_function();

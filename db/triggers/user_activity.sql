-- Function to log changes to the User table
CREATE OR REPLACE FUNCTION user_activity_audit() RETURNS TRIGGER AS
$$

DECLARE
    changedColumns JSONB := '{}'::jsonb;
    tableName TEXT := TG_TABLE_NAME;
BEGIN
    -- Check if the operation is an update
    IF TG_OP = 'UPDATE' THEN
        -- Compare each column and add to changedColumns if different
        IF OLD."name" IS DISTINCT FROM NEW."name" THEN
            changedColumns := jsonb_set(changedColumns, '{name}', jsonb_build_object('old', OLD."name", 'new', NEW."name"));
        END IF;
        IF OLD."email" IS DISTINCT FROM NEW."email" THEN
            changedColumns := jsonb_set(changedColumns, '{"email"}', jsonb_build_object('old', OLD."email", 'new', NEW."email"));
        END IF;
        IF OLD."picture" IS DISTINCT FROM NEW."picture" THEN
            changedColumns := jsonb_set(changedColumns, '{"picture"}', jsonb_build_object('old', OLD."picture", 'new', NEW."picture"));
        END IF;
        IF OLD."teamId" IS DISTINCT FROM NEW."teamId" THEN
            changedColumns := jsonb_set(changedColumns, '{"teamId"}', jsonb_build_object('old', OLD."teamId", 'new', NEW."teamId"));
        END IF;
        IF OLD."updatedBy" IS DISTINCT FROM NEW."updatedBy" THEN
            changedColumns := jsonb_set(changedColumns, '{"updatedBy"}', jsonb_build_object('old', OLD."updatedBy", 'new', NEW."updatedBy"));
        END IF;
        IF OLD."updatedOn" IS DISTINCT FROM NEW."updatedOn" THEN
            changedColumns := jsonb_set(changedColumns, '{"updatedOn"}', jsonb_build_object('old', OLD."updatedOn", 'new', NEW."updatedOn"));
        END IF;
        IF OLD."accruedLeave" IS DISTINCT FROM NEW."accruedLeave" THEN
            changedColumns := jsonb_set(changedColumns, '{accruedLeave}', jsonb_build_object('old', OLD."accruedLeave", 'new', NEW."accruedLeave"));
        END IF;
        IF OLD."usedLeave" IS DISTINCT FROM NEW."usedLeave" THEN
            changedColumns := jsonb_set(changedColumns, '{usedLeave}', jsonb_build_object('old', OLD."usedLeave", 'new', NEW."usedLeave"));
        END IF;
        IF OLD."keyword" IS DISTINCT FROM NEW."keyword" THEN
            changedColumns := jsonb_set(changedColumns, '{"keyword"}', jsonb_build_object('old', OLD."keyword", 'new', NEW."keyword"));
        END IF;
        IF OLD."slackId" IS DISTINCT FROM NEW."slackId" THEN
            changedColumns := jsonb_set(changedColumns, '{"slackId"}', jsonb_build_object('old', OLD."slackId", 'new', NEW."slackId"));
        END IF;
        IF OLD."googleId" IS DISTINCT FROM NEW."googleId" THEN
            changedColumns := jsonb_set(changedColumns, '{"googleId"}', jsonb_build_object('old', OLD."googleId", 'new', NEW."googleId"));
        END IF;
        IF OLD."orgId" IS DISTINCT FROM NEW."orgId" THEN
            changedColumns := jsonb_set(changedColumns, '{"orgId"}', jsonb_build_object('old', OLD."orgId", 'new', NEW."orgId"));
        END IF;

        -- Insert the log entry only if there are changes
        IF changedColumns <> '{}'::jsonb THEN
            INSERT INTO public."ActivityLog" ("tableName", "userId", "changedColumns", "changedBy", "keyword")
            VALUES (tableName, NEW."userId", changedColumns, NEW."updatedBy", 'change');
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Trigger to call the function after an update on the User table
CREATE OR REPLACE TRIGGER user_activity_audit_trigger
AFTER UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION user_activity_audit();

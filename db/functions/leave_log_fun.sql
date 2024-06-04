CREATE OR REPLACE FUNCTION leave_log_fun() RETURNS TRIGGER AS
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
        IF OLD."leaveType" IS DISTINCT FROM NEW."leaveType" THEN
            changedColumns := array_append(changedColumns, 'leaveType');
            oldValues := jsonb_set(oldValues, '{leaveType}', to_jsonb(OLD."leaveType"));
            newValues := jsonb_set(newValues, '{leaveType}', to_jsonb(NEW."leaveType"));
        END IF;

        IF OLD."startDate" IS DISTINCT FROM NEW."startDate" THEN
            changedColumns := array_append(changedColumns, 'startDate');
            oldValues := jsonb_set(oldValues, '{startDate}', to_jsonb(OLD."startDate"));
            newValues := jsonb_set(newValues, '{startDate}', to_jsonb(NEW."startDate"));
        END IF;

        IF OLD."endDate" IS DISTINCT FROM NEW."endDate" THEN
            changedColumns := array_append(changedColumns, 'endDate');
            oldValues := jsonb_set(oldValues, '{endDate}', to_jsonb(OLD."endDate"));
            newValues := jsonb_set(newValues, '{endDate}', to_jsonb(NEW."endDate"));
        END IF;

        IF OLD.duration IS DISTINCT FROM NEW.duration THEN
            changedColumns := array_append(changedColumns, 'duration');
            oldValues := jsonb_set(oldValues, '{duration}', to_jsonb(OLD.duration));
            newValues := jsonb_set(newValues, '{duration}', to_jsonb(NEW.duration));
        END IF;

        IF OLD.shift IS DISTINCT FROM NEW.shift THEN
            changedColumns := array_append(changedColumns, 'shift');
            oldValues := jsonb_set(oldValues, '{shift}', to_jsonb(OLD.shift));
            newValues := jsonb_set(newValues, '{shift}', to_jsonb(NEW.shift));
        END IF;

        IF OLD."userId" IS DISTINCT FROM NEW."userId" THEN
            changedColumns := array_append(changedColumns, 'userId');
            oldValues := jsonb_set(oldValues, '{userId}', to_jsonb(OLD."userId"));
            newValues := jsonb_set(newValues, '{userId}', to_jsonb(NEW."userId"));
        END IF;

        IF OLD."teamId" IS DISTINCT FROM NEW."teamId" THEN
            changedColumns := array_append(changedColumns, 'teamId');
            oldValues := jsonb_set(oldValues, '{teamId}', to_jsonb(OLD."teamId"));
            newValues := jsonb_set(newValues, '{teamId}', to_jsonb(NEW."teamId"));
        END IF;

        IF OLD.reason IS DISTINCT FROM NEW.reason THEN
            changedColumns := array_append(changedColumns, 'reason');
            oldValues := jsonb_set(oldValues, '{reason}', to_jsonb(OLD.reason));
            newValues := jsonb_set(newValues, '{reason}', to_jsonb(NEW.reason));
        END IF;

        -- Insert the log entry only if there are changes
        IF array_length(changedColumns, 1) > 0 THEN
            INSERT INTO public."OrgActivityLog" ("tableName", "userId", "teamId", "changedColumns", "oldValues", "newValues", "changedBy",keyword)
            VALUES (tableName, NEW."userId", NEW."teamId", changedColumns, oldValues, newValues, NEW."updatedBy",'change');
        END IF;
    END IF;

    RETURN NEW;
END;

$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER leave_log_trigger
AFTER UPDATE ON "Leave"
FOR EACH ROW
EXECUTE FUNCTION leave_log_fun();

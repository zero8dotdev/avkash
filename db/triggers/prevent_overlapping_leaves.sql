CREATE OR REPLACE FUNCTION check_overlapping_leaves()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Leave"
    WHERE "userId" = NEW."userId"
    AND "isApproved" != 'REJECTED'
    AND (
      (NEW."startDate" BETWEEN "startDate" AND "endDate")
      OR (NEW."endDate" BETWEEN "startDate" AND "endDate")
      OR ("startDate" BETWEEN NEW."startDate" AND NEW."endDate")
      OR ("endDate" BETWEEN NEW."startDate" AND NEW."endDate")
    )
    AND (
      NEW."duration" = 'FULL_DAY'
      OR "duration" = 'FULL_DAY'
      OR (NEW."duration" = 'HALF_DAY' AND "duration" = 'HALF_DAY' AND NEW."shift" = "shift")
    )
    AND "leaveId" != COALESCE(NEW."leaveId", '00000000-0000-0000-0000-000000000000')
  ) THEN
    RAISE EXCEPTION 'Leave request overlaps with existing leave period';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_overlapping_leaves ON "Leave";
CREATE TRIGGER prevent_overlapping_leaves
  BEFORE INSERT OR UPDATE ON "Leave"
  FOR EACH ROW
  EXECUTE FUNCTION check_overlapping_leaves();
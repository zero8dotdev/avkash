set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_overlapping_leaves()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE TRIGGER prevent_overlapping_leaves BEFORE INSERT OR UPDATE ON public."Leave" FOR EACH ROW EXECUTE FUNCTION check_overlapping_leaves();



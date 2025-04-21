ALTER TABLE "public"."Leave"
ADD COLUMN "workingDays" NUMERIC(5,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN "public"."Leave"."workingDays" IS 'Number of working days in the leave period, accounting for workweek and holidays. Half days are represented as 0.5.';
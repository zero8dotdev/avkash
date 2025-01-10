DROP POLICY IF EXISTS "holiday_delete" ON "public"."Holiday";

-- Create a policy for deleting rows in the Holiday table
CREATE POLICY "holiday_delete" ON "public"."Holiday"
FOR DELETE
TO public
USING (true);

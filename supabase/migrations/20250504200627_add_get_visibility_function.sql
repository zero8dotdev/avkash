drop policy "leave_select" on "public"."Leave";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_visibility()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    org_id UUID;
    result TEXT;
BEGIN
    -- Get the user's organisation ID
    SELECT "orgId" INTO org_id
    FROM "User"
    WHERE "userId" = auth.uid()
    LIMIT 1;

    IF org_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Fetch the visibility using "orgId" from Organisation
    SELECT o.visibility INTO result
    FROM "Organisation" o
    WHERE o."orgId" = org_id
    LIMIT 1;

    RETURN result;
END;
$function$
;

create policy "leave_select"
on "public"."Leave"
as permissive
for select
to public
using ((((auth.role() = 'authenticated'::text) AND ((("teamId" = fetch_user_teamid(auth.uid())) AND ((fetch_user_role(auth.uid()))::text = 'MANAGER'::text)) OR (("orgId" = fetch_user_orgid(auth.uid())) AND ((fetch_user_role(auth.uid()))::text = 'OWNER'::text)))) OR ((get_visibility() = 'TEAM'::text) AND ("teamId" = fetch_user_teamid(auth.uid()))) OR (auth.uid() = "userId")));




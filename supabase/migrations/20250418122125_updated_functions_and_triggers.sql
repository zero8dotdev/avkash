alter table "public"."User" alter column "name" drop not null;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auth_to_user_uuid_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  old_user_id UUID;
  temp_user_id UUID;
BEGIN
  -- First, get the old userId if it exists
  SELECT "userId" INTO old_user_id
  FROM public."User"
  WHERE email = new.email;
  -- If the old userId exists and is different from the new one
  IF old_user_id IS NOT NULL AND old_user_id != new.id THEN
    -- Create a temporary record for the transition
    temp_user_id := gen_random_uuid();
    -- Insert the temporary user
    INSERT INTO public."User" (
      "userId", email, "role", keyword, "updatedOn", "createdOn"
    )
    VALUES (
      temp_user_id, new.email || '.temp', 'USER', 'temp', now(), now()
    );
    -- Update all ActivityLog entries to use the temp userId
    UPDATE public."ActivityLog"
    SET "userId" = temp_user_id
    WHERE "userId" = old_user_id;
    -- Now we can update the original user safely
    UPDATE public."User"
    SET "userId" = new.id, "role" = 'USER', keyword = 'joined', "updatedOn" = now()
    WHERE email = new.email;
    -- Update all ActivityLog entries to use the final userId
    UPDATE public."ActivityLog"
    SET "userId" = new.id
    WHERE "userId" = temp_user_id;
    -- Remove the temporary user
    DELETE FROM public."User"
    WHERE "userId" = temp_user_id;
  ELSE
    -- If userId hasn't changed, just update other fields
    UPDATE public."User"
    SET "role" = 'USER', keyword = 'joined', "updatedOn" = now()
    WHERE email = new.email;
  END IF;
  RETURN new;
END;$function$
;

CREATE OR REPLACE TRIGGER auth_to_user_uuid_update_trigger
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auth_to_user_uuid_update();

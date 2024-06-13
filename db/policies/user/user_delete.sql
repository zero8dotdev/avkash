drop policy if exists "admin_delete_users" on "public"."User";

CREATE POLICY "admin_delete_users"
on "public"."User"
for delete
to public
using (
    "userId" = auth.uid()
);
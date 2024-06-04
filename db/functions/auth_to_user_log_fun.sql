CREATE OR REPLACE FUNCTION auth_to_user_log_fun() RETURNS TRIGGER AS
$$
BEGIN
  -- First, try to update the row if it exists
  update public."User"
  set "userId" = new.id, "isManager" = false, keyword = 'joined'
  where email = new.email and name = new.raw_user_meta_data ->> 'name';

  -- Check if the row was updated
  if found then
    return new;
  end if;

  -- If the row was not found, insert a new row
  insert into public."User" ("userId", name, email, "isManager",keyword)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email, true, 'joined');

  return new;
end;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER auth_to_user_log_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auth_to_user_log_fun();

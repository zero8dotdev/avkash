CREATE OR REPLACE FUNCTION auth_to_user_uuid_update() RETURNS TRIGGER AS
$$ BEGIN
  -- First, try to update the row if it exists
  update public."User"
  set "userId" = new.id, "role" = 'USER', keyword = 'joined'
  where email = new.email;

  -- Check if the row was updated
  if found then
    return new;
  end if;

  return new;
end;
$$ SECURITY DEFINER
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER auth_to_user_uuid_update_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auth_to_user_uuid_update();

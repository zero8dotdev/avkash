import { createClient as _createClient } from '@supabase/supabase-js';

/*
 Supabase Admin Client:
  Supabase admin client is a client with super user permissions.
  It is used to bypass RLS policies defined in the supabase tables.
  **IMP** This client should be used very carefully, Very carefully.

  Where should we use this client?
    Any code which is running on the server(SSR) and need RLS skip
*/

export function createClient() {
  return _createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
};

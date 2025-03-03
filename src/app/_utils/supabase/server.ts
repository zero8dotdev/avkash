import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "../../../../database.types";
import { SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export async function createClient() {
  const cookieStore = await cookies();

  if (_supabase) {
    return _supabase;
  }

  _supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );

  _supabase.auth.getUser().then(({ data, error }) => {
    if (!error) {
      (_supabase as any).userId = data.user.id;
    }
  });

  return _supabase;
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/_utils/supabase/client";
import { Session } from "@supabase/supabase-js";

export default function useAuthState() {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("supabase session!", session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, [supabase]);

  return [session];
}

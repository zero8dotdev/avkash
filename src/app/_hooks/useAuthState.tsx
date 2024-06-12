"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/_utils/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function useAuthState() {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(event, session);

      if (event === "INITIAL_SESSION") {
        // handle initial session
      } else if (event === "SIGNED_IN") {
        // handle sign in event
      } else if (event === "SIGNED_OUT") {
        // handle sign out event
      } else if (event === "PASSWORD_RECOVERY") {
        // handle password recovery event
      } else if (event === "TOKEN_REFRESHED") {
        // handle token refreshed event
      } else if (event === "USER_UPDATED") {
        // handle user updated event
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(session);
      // from this session
      // we can extract these values:
      // 1. Name
      // 2. Company Name
      // 3. email ID
      setSession(session);
      // here we need to fetch If his workspace email is asociated with any org,
      // otherwise redirect him to welcome page [old signup page]
      // If yes, fetch that org
      // if Org setup is false, redirect him to setup page, based on the value, redirect him to particular step of the seetup page
      // else redirect him to timeline / dashboard
    });
  }, [supabase]);

  return [session];
}

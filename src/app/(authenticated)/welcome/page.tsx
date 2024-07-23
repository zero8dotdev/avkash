"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../_utils/supabase/client";
import { useApplicationContext } from "../_context/appContext";

export default function Welcome() {
  const supabase = createClient();
  const router = useRouter();
  const { state, dispatch } = useApplicationContext();

  useEffect(() => {
    if (state.userId) {
      (async () => {
        const { userId } = state;
        const { data: _user, error } = await supabase
          .from("User")
          .select("*")
          .eq("userId", userId);
        if (_user && _user.length > 0) {
          const user = _user[0];
          if (user.orgId === null || user.teamId === null) {
            router.replace("/signup");
          } else {
            dispatch({ type: "setOrgId", payload: user.orgId });
            dispatch({ type: "setTeamId", payload: user.teamId });
            router.replace("/dashboard/timeline");
          }
        } else {
          // handle error or case when no user is found
          console.error(error);
          router.replace("/signup");
        }
      })();
    }
  }, [state.userId]); // Add userId to the dependency array
}

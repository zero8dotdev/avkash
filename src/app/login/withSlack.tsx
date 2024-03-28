"use client";

import { createClient } from "@/app/_utils/supabase/client";
import useAuthState from "@/app/_hooks/useAuthState";

export default function WithSlack() {
  const [authState] = useAuthState();

  const supabase = createClient();
  const authWithSlack = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "slack",
      options: {
        redirectTo: "https://flounder-wise-completely.ngrok-free.app/login",
        scopes: "",
      },
    });
  };

  return (
    <a
      href="#"
      onClick={authWithSlack}
      className="w-[296px] block rounded-md p-2 text-white bg-pink-500"
    >
      Sign In with Slack
    </a>
  );
}

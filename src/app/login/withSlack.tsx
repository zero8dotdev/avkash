"use client";

import { createClient } from "@/app/_utils/supabase/client";
import useAuthState from "@/app/_hooks/useAuthState";
import { Button } from "antd";

export default function WithSlack() {
  const [authState] = useAuthState();

  const supabase = createClient();
  const authWithSlack = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "slack",
      options: {
        redirectTo: "https://flounder-wise-completely.ngrok-free.app/welcome",
        scopes: "",
      },
    });

    if (error) {
      console.log(error);
    }
  };

  return (
    <Button type="primary" onClick={authWithSlack} block>
      Sign In with Slack
    </Button>
  );
}

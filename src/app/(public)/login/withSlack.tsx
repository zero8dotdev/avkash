"use client";

import { createClient } from "@/app/_utils/supabase/client";
import SlackButton from "./slackLogo";

export default function WithSlack() {
  const supabase = createClient();

  const authWithSlack = async () => {
    const redirectTo = new URL(
      process.env.NEXT_PUBLIC_REDIRECT_PATH_AFTER_OAUTH!,
      window?.location.origin
    ).toString();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "slack_oidc",
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.log(error);
    }
  };

  return <SlackButton onClick={authWithSlack} />;
}

"use client";

import { Button, Flex } from "antd";

export default function Page() {
  const url = new URL("https://slack.com/oauth/v2/authorize");
  const searchParams = new URLSearchParams();
  searchParams.append("scope", "users.read");
  searchParams.append("redirect_uri", "");

  let slackAuthUrl =
    "https://slack.com/oauth/v2/authorize?scope=users%3Aread&amp;user_scope=&amp;redirect_uri=https%3A%2F%2Fflounder-wise-completely.ngrok-free.app%2Fteam&amp;client_id=6356258938273.7279987270326";

  return (
    <Flex justify="center" align="center" style={{ height: "100vh" }}>
      <Button type="link" href={slackAuthUrl}>
        Add to Slack Workspace
      </Button>
    </Flex>
  );
}

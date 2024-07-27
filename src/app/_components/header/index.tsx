import Link from "next/link";
import { Button, Space } from "antd";

import Title from "antd/es/typography/Title";
import LogoutButton from "./_components/logout";
import { Header } from "antd/es/layout/layout";
import MainMenu from "./_components/main-menu";

export default function AppHeader() {
  return (
    <Header
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <Link href="/">
        <Title level={3} style={{ marginTop: "0px", marginBottom: "0px" }}>
          avkash
        </Title>
      </Link>
      <div style={{ flex: "1" }}>
        <MainMenu />
      </div>
      <Space>
        <Link href="/login">
          <Link href="https://slack.com/oauth/v2/authorize?client_id=6356258938273.7279987270326&scope=app_mentions:read,channels:history,channels:read,chat:write,chat:write.public,commands,groups:read,im:history,im:read,mpim:history,users:read,users:read.email&user_scope=channels:history,channels:read,groups:read,im:history,im:read,mpim:history,mpim:read">
            <img
              alt="Add to Slack"
              height="40"
              width="139"
              src="https://platform.slack-edge.com/img/add_to_slack.png"
              srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
            />
          </Link>
        </Link>
        <LogoutButton />
      </Space>
    </Header>
  );
}

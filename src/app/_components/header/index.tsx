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
      <MainMenu />
      <div style={{ flex: "1" }}></div>
      <Space>
        <Link href="/login">
          <Button type="primary">Sign up</Button>
        </Link>
        <LogoutButton />
      </Space>
    </Header>
  );
}

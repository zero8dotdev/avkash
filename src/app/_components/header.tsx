import Link from "next/link";
import { Layout, Button, Space } from "antd";
import Title from "antd/es/typography/Title";
import LogoutButton from "./logout";
import { Header } from "antd/es/layout/layout";

export default function AppHeader() {
  return (
    <Header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <Link href="/">
        <Title level={3} style={{ marginTop: "0px", marginBottom: "0px" }}>
          avkash
        </Title>
      </Link>
      <Space>
        <Link href="/login">
          <Button type="primary">Sign up</Button>
        </Link>
        <LogoutButton />
      </Space>
    </Header>
  );
}

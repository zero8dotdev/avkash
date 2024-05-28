"use client";

import Link from "next/link";
import { Layout, Button, Space } from "antd";
import { createClient } from "../_utils/supabase/client";
const { Header: AntHeader } = Layout;

const supabase = createClient();

export default function Header() {
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      error && console.log(error);
    } catch (error) {
      console.log("Error while logging out ", error);
    }
  };

  return (
    <AntHeader
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <Link href="/">
        <h1 className="text-red-500 text-lg">Avkash</h1>
      </Link>
      <Link href="/login">
        <Space>
          <Button type="primary">Sign up</Button>
          <Button
            type="primary"
            danger
            onClick={() => {
              logout();
            }}
          >
            Logout
          </Button>
        </Space>
      </Link>
    </AntHeader>
  );
}

"use client";

import Link from "next/link";
import { Layout } from "antd";
const { Header: AntHeader } = Layout;

export default function Header() {
  return (
    <AntHeader
      style={{ display: "flex", alignItems: "center", backgroundColor: "#fff" }}
    >
      <Link href="/">
        <h1 className="text-red-500 text-lg">Avkash</h1>
      </Link>
    </AntHeader>
  );
}

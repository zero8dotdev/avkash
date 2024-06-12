"use client";

import { Layout } from "antd";
const { Content: AntContent } = Layout;

export default function Content({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AntContent style={{ height: "calc(100vh - 64px)" }}>{children}</AntContent>
  );
}

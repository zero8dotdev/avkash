"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";

import Header from "./_components/header";
import { ApplicationProvider } from "./_context/appContext";
import { ConfigProvider, Layout } from "antd";
import Content from "./_components/content";
import useAuthState from "./_hooks/useAuthState";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "Avkash | Make leave management easy for your teams",
//   description: "Avkash allows team to manage holidays and leaves smooth.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session] = useAuthState();
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <ConfigProvider>
            <ApplicationProvider>
              <Layout>
                <Header />
                <Content>{children}</Content>
              </Layout>
            </ApplicationProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

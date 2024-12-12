import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, Layout } from "antd";
import AppHeader from "./_components/header";
import Content from "./_components/content";
import { ApplicationProvider } from "./_context/appContext";
import "./input.css";

export const metadata: Metadata = {
  title: "Avkash | Streamlines Leave Management for Modern Remote Teams",
  description:
    "Avkash is a leave management HR automation tool crafted for founders of new-age remote teams, promoting a seamless work-life balance. With effortless integration into Slack and Google Workspace, Avkash simplifies your leave management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          async
        ></script>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
        }}
      >
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorBgBase: "#F7FFF7",
                colorPrimary: "#15616D",
                colorText: "#000000",
                fontFamily: "General Sans, sans-serif",
              },
              components: {
                Card: { colorBgContainer: "#F7FFF7" },
              },
            }}
          >
            <ApplicationProvider>
              <Layout>
                <AppHeader />
                <Content>{children}</Content>
              </Layout>
            </ApplicationProvider>
          </ConfigProvider>
        </AntdRegistry>
        <Analytics />
      </body>
    </html>
  );
}

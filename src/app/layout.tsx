import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Roboto_Flex } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, Layout } from "antd";
import AppHeader from "./_components/header";
import Content from "./_components/content";
import { ApplicationProvider } from "./_context/appContext";
import "./input.css";

const roboto = Roboto_Flex({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Specify | Automate | Elevate",
  description: "Avkash allows team to manage holidays and leaves smooth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      <meta name="description" content="benchoooood its production day" />
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
          <ConfigProvider>
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

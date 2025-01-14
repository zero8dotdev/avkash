import { Col, ConfigProvider, Flex, Row } from "antd";

export default async function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ConfigProvider
      theme={{
        components: {
          Tabs: {
            colorBorder: "transparent",
            inkBarColor: "transparent",
            cardBg: "transparent",
            fontSize: 15,
          },
        },
      }}
    >
      <Row style={{ paddingLeft:"100px" }}>
        <Col span={24} style={{ justifyContent: "center" }}>
          {children}
        </Col>
      </Row>
    </ConfigProvider>
  );
}

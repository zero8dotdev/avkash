import { Col, ConfigProvider, Row } from "antd";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConfigProvider
      theme={{
        components: {
          Tabs: {
            colorBorder: "transparent",
            inkBarColor: "transparent",
            cardBg: "transparent",
            fontSize: 15,
            colorPrimaryBorder:'transparent',
            colorBorderBg:'transparent',
          },
        },
      }}
    >
      <Row>
        <Col span={24} style={{ justifyContent: "center", padding: "80px"}}>
          {children}
        </Col>
      </Row>
    </ConfigProvider>
  );
};

export default layout;

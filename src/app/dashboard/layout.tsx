import { Row, Col } from "antd";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Row gutter={8} style={{ height: "calc(100vh - 64px)" }}>
      <Col span={24}>{children}</Col>
    </Row>
  );
}

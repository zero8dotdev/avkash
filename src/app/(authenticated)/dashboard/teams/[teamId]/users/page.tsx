import { Card, Col, Row } from "antd";
import React from "react";
import TeamSettingsTabs from "../_components/team-settings-tabs";

const Page = () => {
  return (
    <Row>
      <Col span={3}>
        <TeamSettingsTabs position="users" />
      </Col>
      <Col span={16}>
        <Card title="Team Users"></Card>
      </Col>
    </Row>
  );
};

export default Page;

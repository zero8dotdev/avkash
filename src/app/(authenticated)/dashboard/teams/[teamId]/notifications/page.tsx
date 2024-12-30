"use client";
import { Card, Col, Form, Row } from "antd";
import React from "react";
import TeamSettingsTabs from "../_components/team-settings-tabs";
import Notification from "@/app/_components/notification";

const Page = () => {
  return (
    <Row>
      <Col span={3}>
        <TeamSettingsTabs position="notifications" />
      </Col>
      <Col span={16}>
        <Card title="Team Notifications">
          <Form onFinish={(values) => console.log(values)}>
            <Notification />
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Page;

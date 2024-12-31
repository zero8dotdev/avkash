"use client";
import TeamSettings from "@/app/_components/team-settings";
import { Button, Card, Col, Flex, Form, Input, Row, Select } from "antd";
import React from "react";
import TeamSettingsTabs from "../_components/team-settings-tabs";

const locations = [
  {
    countryCode: "IN",
    countryName: "India",
  },
  {
    countryCode: "DE",
    countryName: "Germany",
  },
  {
    countryCode: "GB",
    countryName: "United Kingdom",
  },
  {
    countryCode: "US",
    countryName: "United States",
  },
  {
    countryCode: "NL",
    countryName: "Netherlands",
  },
];
const Page = () => {
  const [form] = Form.useForm();
  return (
    <Row>
      <Col span={3}>
        <TeamSettingsTabs position="settings" />
      </Col>
      <Col span={16}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => console.log(values)}
        >
          <Card title="Team Settings">
            <Form.Item label="Team Name" name="teamName">
              <Input placeholder="Team name" />
            </Form.Item>
            <TeamSettings form={form} />
            <Form.Item name="locations" label="Locations">
              <Select
                defaultValue={["IN"]}
                showSearch
                options={locations.map((each: any) => ({
                  label: each.countryName,
                  value: each.countryCode,
                }))}
              />
            </Form.Item>
            <Flex justify="end">
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              </Form.Item>
            </Flex>
          </Card>
        </Form>
      </Col>
    </Row>
  );
};

export default Page;

"use client";
import { Card, Form, Select, Switch, Button } from "antd";

import "react-datepicker/dist/react-datepicker.css";
const GeneralSettings = () => {
  const onFinish = (values: any) => {
    console.log(values);
  };
  return (
    <Card title="General" className="w-5/12">
      <Form
        initialValues={{
          whoCanSee: "users can only see their own leave",
          dateFormat: "MM/DD/YYYY",
          timeFormat: "hh:mm:ss A",
          halfDay: false,
        }}
        onFinish={onFinish}
      >
        <Form.Item name="dateFormat" label="Date Format">
          <Select placeholder="Select a date format">
            <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
            <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
            <Select.Option value="YYYY-MM-DD">YYYY-MM-DD</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="timeFormat" label="Time Format">
          <Select placeholder="Select a time format">
            <Select.Option value="hh:mm:ss A">12-hour (hh:mm:ss)</Select.Option>
            <Select.Option value="HH:mm:ss">24-hour (HH:mm:ss)</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="whoCanSee" label="Who can see other's leave?">
          <Select>
            <Select.Option value="users can see the organization's leave">
              Users can see the organization`s leave
            </Select.Option>
            <Select.Option value="users can see their team's leave">
              Users can see their team`s` leave
            </Select.Option>
            <Select.Option value="users can only see their own leave">
              Users can can only see their own leave
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="halfDay" label="Half days">
          <Switch />
        </Form.Item>
        <Form.Item style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button htmlType="submit" type="primary" danger>
            Save
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default GeneralSettings;

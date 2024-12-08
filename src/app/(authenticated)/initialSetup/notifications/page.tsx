"use client";
import { Card, Checkbox, Flex, Form, Switch, Typography } from "antd";
import { useEffect } from "react";

const { Item } = Form;
const { Group } = Checkbox;

const Notifications = () => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout="vertical"
      size="small"
      style={{ marginTop: "25px", width: "70%" }}
    >
      <Flex justify="space-between">
        <Typography.Text>Leave Changed</Typography.Text>
        <Flex gap={15}>
          <Item
            name="leaveChanged"

            // help="Send a notification
            //   whenever leave is approved or deleted."
          >
            <Switch />
          </Item>
          <Typography.Text>
            Send a notification whenever leave is approved or deleted.
          </Typography.Text>
        </Flex>
      </Flex>
      <Flex justify="space-between">
        <Typography.Text>Daily Summary</Typography.Text>
        <Flex gap={15}>
          <Item
            name="dailySummary"
            // help="Send a report of upcoming work days leave"
          >
            <Switch />
          </Item>
          <Typography.Text style={{ marginRight: "95px" }}>
            Send a report of upcoming work days leave
          </Typography.Text>
        </Flex>
      </Flex>
      <Flex justify="space-between">
        <Typography.Text>Weekly Summary</Typography.Text>
        <Flex gap={15}>
          <Item name="weeklySummary">
            <Switch />
          </Item>
          <Typography.Text style={{ marginRight: "118px" }}>
            Send a report of upcoming weeks leave
          </Typography.Text>
        </Flex>
      </Flex>

      <Item label="Send notications to" name="sendNtf">
        <Group>
          <Checkbox value="OWNER" defaultChecked>
            Owner
          </Checkbox>
          <Checkbox value="MANAGER">Managers</Checkbox>
        </Group>
      </Item>
    </Form>
  );
};
export default Notifications;

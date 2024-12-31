import { Flex, Typography, Form, Switch, Checkbox } from "antd";
import React from "react";

const { Item } = Form;
const { Group } = Checkbox;
const Notification = () => {
  return (
    <>
      <Flex justify="space-between">
        <Typography.Text>Leave Changed</Typography.Text>
        <Flex gap={15}>
          <Item name="leaveChanged" valuePropName="checked">
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
          <Item name="dailySummary" valuePropName="checked">
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
          <Item name="weeklySummary" valuePropName="checked">
            <Switch />
          </Item>
          <Typography.Text style={{ marginRight: "118px" }}>
            Send a report of upcoming weeks leave
          </Typography.Text>
        </Flex>
      </Flex>

      <Item label="Send notifications to" name="sendntw">
        <Group>
          <Checkbox value="OWNER">Owner</Checkbox>
          <Checkbox value="MANAGER">Managers</Checkbox>
        </Group>
      </Item>
    </>
  );
};

export default Notification;

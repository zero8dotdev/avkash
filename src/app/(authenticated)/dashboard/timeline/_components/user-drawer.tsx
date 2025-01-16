"use client";
import React, { useState } from "react";
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Drawer,
  Flex,
  Form,
  List,
  Radio,
  Space,
  Typography,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import { CalendarOutlined, CloseOutlined } from "@ant-design/icons";
import UserModal from "../../users/_components/user-modal";

const UserDrawer = ({
  selectedUser,
  onSelectUserChange,
  leaveTypes,
}: {
  selectedUser: any;
  onSelectUserChange: any;
  leaveTypes: any;
}) => {
  const [type, setType] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  return (
    <>
      <Drawer
        open={selectedUser !== null}
        title={
          <Flex gap={12}>
            <Avatar size={34} src={selectedUser?.picture} />

            <Flex vertical>
              <Typography.Text strong style={{ margin: "0px", padding: "0px" }}>
                {" "}
                {selectedUser?.name}
              </Typography.Text>
              <a
                style={{
                  fontSize: "12px",
                  textDecoration: "underline",
                  color: "#E85A4F",
                }}
                onClick={() => setUserProfile(selectedUser)}
              >
                user profile
              </a>
            </Flex>
          </Flex>
        }
        closable={false}
        autoFocus={false}
        extra={<CloseOutlined onClick={() => onSelectUserChange()} />}
      >
        <Card
          title="   "
          styles={{
            header: {
              backgroundColor: "#E85A4F",
            },
          }}
        >
          <Space size={10}>
            <CalendarOutlined />
            <Typography.Text strong>Create new {type} Leave</Typography.Text>
          </Space>
          <Flex vertical style={{ marginTop: "10px" }} gap={5}>
            <Typography.Text type="secondary">on behalf of:</Typography.Text>
            <Typography.Text strong>{selectedUser?.name}</Typography.Text>
            <Typography.Text type="secondary">
              {selectedUser?.email}
            </Typography.Text>
          </Flex>
          <Form layout="vertical" onFinish={(e) => console.log(e)}>
            <Form.Item name="leavetype" label="Leave Type">
              <Radio.Group
                onChange={(event) => setType(event.target.value)}
                style={{ width: "100%" }}
              >
                <List
                  bordered
                  dataSource={leaveTypes}
                  renderItem={(item: any) => (
                    <List.Item>
                      <Radio value={item.name}>{item.name}</Radio>
                    </List.Item>
                  )}
                />
              </Radio.Group>
            </Form.Item>
            <Form.Item label="Requested dates" name="dates">
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                format="DD MMM YYYY"
              />
            </Form.Item>
            <Form.Item name="reason" label="Leave request notes">
              <TextArea placeholder="Leave request notes adn description..." />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Drawer>
      <UserModal
        selectedUser={userProfile}
        update={() => setUserProfile(null)}
      />
    </>
  );
};

export default UserDrawer;

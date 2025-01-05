"use client";
import {
  Avatar,
  Button,
  Card,
  Col,
  Flex,
  Input,
  List,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import React, { useState } from "react";
import { CaretRightOutlined } from "@ant-design/icons";
import UserModal from "./_components/user-modal";
const capitalize = require("capitalize");

const teams = [
  {
    teamId: 1,
    name: "Team 1",
  },
  {
    teamId: 2,
    name: "Team 2",
  },
];

const members = [
  {
    id: "1",
    name: "keshav",
    role: "admin",
    teamName: "team1",
  },
  {
    id: "2",
    name: "yashwanth",
    role: "manager",
    teamName: "team2",
  },
  {
    id: "3",
    name: "ashu",
    role: "user",
    teamName: "team3",
  },
];
const Page = () => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  return (
    <Row>
      <Col span={16} push={3} style={{ marginTop: "80px" }}>
        <Card title="Users">
          <Flex gap={15} justify="space-between" style={{ width: "100%" }}>
            <Space size={15}>
              <Select placeholder="Select team" style={{ width: "100%" }}>
                <Select.Option key="0" value="0">
                  All Teams
                </Select.Option>
                {teams.map(({ teamId, name }) => (
                  <Select.Option key={teamId} value={teamId}>
                    {name}
                  </Select.Option>
                ))}
              </Select>
              <Input.Search
                placeholder="Search users"
                style={{ width: "100%" }}
              />
            </Space>
            <Space size={15}>
              <Button>Download Report</Button>
              <Button type="primary">Invite Users</Button>
            </Space>
          </Flex>
          <List
            // bordered={false}
            dataSource={members}
            style={{ marginTop: "15px" }}
            renderItem={(user, index) => {
              return (
                <Card
                  styles={{ body: { padding: "0px 15px 0px 15px" } }}
                  style={{ marginBottom: "10px" }}
                >
                  <List.Item
                    actions={[
                      <Button
                        key="list-loadmore-edit"
                        size="small"
                        type="link"
                        icon={<CaretRightOutlined />}
                        onClick={() => setSelectedUser(user)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`}
                        />
                      }
                      title={
                        <p style={{ margin: 0, padding: 0 }}>
                          {user.name}
                          <span
                            style={{
                              paddingLeft: "5px",
                              color: "#ccc",
                              fontWeight: "normal",
                            }}
                          >
                            ({capitalize(user.role)})
                          </span>
                        </p>
                      }
                      description={user.teamName}
                    />
                  </List.Item>
                </Card>
              );
            }}
          />
        </Card>
      </Col>
      <UserModal
        selectedUser={selectedUser}
        update={() => setSelectedUser(null)}
      />
    </Row>
  );
};

export default Page;

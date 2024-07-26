import { fetchAllOrgUsers, fetchTeam } from "@/app/_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import { UserAddOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Flex,
  List,
  Select,
  Space,
  Typography,
} from "antd";

import React, { useEffect, useState } from "react";
interface props {
  selectedUsers: any[];
  setSelectedUsers: (data: any) => void;
}

const Users: React.FC<props> = ({ selectedUsers, setSelectedUsers }) => {
  const [users, setUsers] = useState<any[]>([]);
  console.log(selectedUsers);

  const { state: appState } = useApplicationContext();
  const { orgId } = appState;
  useEffect(() => {
    const fetchUsers = async () => {
      const users = await fetchAllOrgUsers(orgId, true);
      setUsers(users);
    };

    fetchUsers();
  }, [orgId]);

  const handleUserChange = async (userId: any) => {
    setUsers(users.filter((user: any) => user.userId !== userId));

    const selectedUser = users.filter((user: any) => user.userId === userId);

    setSelectedUsers([...selectedUsers, selectedUser[0]]);
  };
  const handleRemoveUser = (item: any) => {
    setUsers([...users, item]);
    setSelectedUsers(
      selectedUsers.filter((each: any) => each.userId !== item.userId)
    );
  };

  console.log(users);
  return (
    <Card style={{ width: "50%" }}>
      <Select
        placeholder="Type user name or email"
        suffixIcon={<UserAddOutlined />}
        style={{ width: "50%" }}
        onChange={handleUserChange}
      >
        {users.map((each: any) => {
          return <Select.Option key={each.userId}>{each.name}</Select.Option>;
        })}
      </Select>
      <List
        dataSource={selectedUsers}
        renderItem={(item, index) => (
          <List.Item
            actions={[
              <Button key={index} onClick={() => handleRemoveUser(item)}>
                remove
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar />}
              title={
                <Space>
                  <Typography.Text>{item.name}</Typography.Text>
                  {item.email}
                </Space>
              }
              description={
                <Space>
                  User will be removed from team{" "}
                  <Typography.Paragraph
                    style={{ margin: "0", fontWeight: "bold" }}
                  >
                    {item.Team.name}
                  </Typography.Paragraph>{" "}
                  and added to this team
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default Users;

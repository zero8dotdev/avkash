"use client";
import React, { useState } from "react";
import { Button, Flex, Modal, Select, Typography, Card } from "antd";
import { useApplicationContext } from "@/app/_context/appContext";
interface Props {
  users: any[];
  onSelectedUser: Function;
}

const AddLeave: React.FC<Props> = ({ users, onSelectedUser }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [userId, setUserId] = useState();
  const { state } = useApplicationContext();
  const onCancel = () => {
    setModalVisible(false);
    setUserId(undefined);
    onSelectedUser(null);
  };

  const getuserDetails = (userId: any, type: string) => {
    const user = users?.find((each) => each.userId === userId);
    if (type === "user") {
      return user?.name;
    } else {
      return user?.Team.name;
    }
  };
  let filteredusers;
  if (state.role === "OWNER" || state.role === "MANAGER") {
    filteredusers = users;
  } else {
    filteredusers = users.filter((user) => user.userId === state.userId);
  }

  return (
    <>
      <Button type="primary" onClick={() => setModalVisible(true)}>
        Add leave
      </Button>
      <Modal
        open={isModalVisible}
        onCancel={onCancel}
        title="Add Leave"
        width={700}
        footer={null}
      >
        <Flex vertical>
          <Typography.Text>Select user</Typography.Text>
          <Select
            style={{ width: "100%" }}
            value={userId}
            onSelect={(v) => setUserId(v)}
          >
            {filteredusers?.map((each, index) => (
              <Select.Option key={index} value={each.userId}>
                {each.name}
              </Select.Option>
            ))}
          </Select>
        </Flex>
        {userId ? (
          <Card style={{ marginTop: "20px" }}>
            <Flex justify="space-between">
              <Typography.Text strong>
                {getuserDetails(userId, "user")}
                <Typography.Text
                  type="secondary"
                  style={{ marginLeft: "10px" }}
                >
                  ({getuserDetails(userId, "team")})
                </Typography.Text>
              </Typography.Text>
              <Button
                type="primary"
                onClick={() => {
                  onSelectedUser(users?.find((each) => each.userId === userId));
                  setModalVisible(false);
                }}
              >
                Add Leave
              </Button>
            </Flex>
          </Card>
        ) : null}
      </Modal>
    </>
  );
};

export default AddLeave;

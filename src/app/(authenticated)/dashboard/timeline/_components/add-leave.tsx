"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Flex,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Typography,
  Calendar,
  Card,
} from "antd";
import { useApplicationContext } from "@/app/_context/appContext";
import {
  fetchAllOrgUsers,
  fetchLeaveTypes,
  fetchTeamId,
  fetchTeamMembers,
  insertLeaves,
} from "@/app/_actions";
import { on } from "events";
interface Props {
  team: string | undefined;
  onSelectedUser: Function;
}

const AddLeave: React.FC<Props> = ({ team, onSelectedUser }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [userId, setUserId] = useState();
  const [loader, setloader] = useState(false);
  const [loginUser, setLoginUser] = useState<any>();
  const {
    state: { orgId, user },
  } = useApplicationContext();
  // const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>();
  useEffect(() => {
    if (!user?.role) return;

    (async () => {
      try {
        // const leaveTypes = await fetchLeaveTypes(orgId);
        // if (leaveTypes) {
        //   setLeaveTypes(leaveTypes);
        // }
        if (team) {
          const user = await fetchTeamMembers(team);
          setUsers(user);
        } else {
          const users = await fetchAllOrgUsers(orgId, true);
          setUsers(users);
        }
      } catch (error) {
        console.error(error);
      }
      if (user?.role === "OWNER" || user?.role === "MANAGER") {
        setLoginUser(user.role);
      }
    })();
  }, [orgId, team, user]);

  const onCancel = () => {
    setModalVisible(false);
    setUserId(undefined);
    onSelectedUser(null);
  };
  // const submitForm = () => {
  //   form.submit();
  //   setloader(true);
  // };
  const getuserDetails = (userId: any, type: string) => {
    const user = users?.find((each) => each.userId === userId);
    if (type === "user") {
      return user?.name;
    } else {
      return user?.Team.name;
    }
  };
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
          <Select style={{ width: "100%" }} onSelect={(v) => setUserId(v)}>
            {users?.map((each, index) => (
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

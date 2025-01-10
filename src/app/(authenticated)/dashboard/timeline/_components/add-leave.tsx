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
} from "antd";
import { useApplicationContext } from "@/app/_context/appContext";
import {
  fetchAllOrgUsers,
  fetchLeaveTypes,
  fetchTeamId,
  fetchTeamMembers,
  insertLeaves,
} from "@/app/_actions";
interface Props {
  team: string | undefined;
}

const AddLeave: React.FC<Props> = ({ team }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [userId, setUserId] = useState();
  const [loader, setloader] = useState(false);
  const [loginUser, setLoginUser] = useState<any>();
  const {
    state: { orgId, user },
  } = useApplicationContext();
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>();
  useEffect(() => {
    if (!user?.role) return;

    (async () => {
      try {
        const leaveTypes = await fetchLeaveTypes(orgId);
        if (leaveTypes) {
          setLeaveTypes(leaveTypes);
        }
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

  const onFinish = async (values: any) => {
    const { dates, approve, leaveType, leaveRequestNote } = values;
    const start = new Date(dates[0]);
    const end = new Date(dates[1]);
    const teamid = await fetchTeamId(userId);
    const data = {
      reason: leaveRequestNote,
      startDate: start,
      endDate: end,
      isApproved: approve === true ? "APPROVED" : "PENDING",
      leaveType: leaveType,
      userId: userId,
      teamId: teamid && teamid[0].teamId,
      orgId: orgId,
      duration: "FULL_DAY",
      shift: "MORNING",
    };
    const insertedLeaves = await insertLeaves(data);
    setloader(false);
    setModalVisible(false);
  };

  const onCancel = () => {
    setModalVisible(false);
    setUserId(undefined);
    form.resetFields();
  };
  const submitForm = () => {
    form.submit();
    setloader(true);
  };
  const [form] = Form.useForm();
  return (
    <>
      <Button type="primary" onClick={() => setModalVisible(true)}>
        Add leave
      </Button>{" "}
      <Modal
        open={isModalVisible}
        closable={false}
        title="Add Leave"
        onCancel={() => onCancel()}
        width={700}
        footer={[
          <>
            <Button type="default" danger onClick={() => onCancel()}>
              Cancel
            </Button>
            {userId !== undefined && (
              <Button
                type="primary"
                loading={loader}
                onClick={() => submitForm()}
              >
                submit
              </Button>
            )}
          </>,
        ]}
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
          <Form
            layout="vertical"
            style={{ width: "100%", marginTop: "20px" }}
            onFinish={onFinish}
            form={form}
          >
            <Form.Item
              label="Leave type:"
              name="leaveType"
              initialValue="paid of leave"
              rules={[{ required: true, message: "Choose your leave type?" }]}
            >
              <Radio.Group>
                <Space direction="vertical">
                  {leaveTypes.length > 0 ? (
                    leaveTypes.map((each) => (
                      <Radio key={each.leavetypeid} value={each.name}>
                        {each.name}
                      </Radio>
                    ))
                  ) : (
                    <Typography.Paragraph>
                      No leave types available for this organization.
                    </Typography.Paragraph>
                  )}
                </Space>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              label="Dates:"
              name="dates"
              rules={[
                {
                  required: true,
                  message: "Please select start and end dates",
                },
              ]}
            >
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                format="DD MMM YYYY"
              />
            </Form.Item>
            <Form.Item
              label="Leave request notes:"
              name="leaveRequestNote"
              initialValue=""
              rules={[
                { required: true, message: "Enter your leave request reason" },
              ]}
            >
              <Input.TextArea rows={2} placeholder="Enter your leave reason" />
            </Form.Item>
            {loginUser === "OWNER" || loginUser === "MANAGER" ? (
              <Form.Item
                label="Approve this leave?"
                name="approve"
                initialValue={false}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            ) : null}
          </Form>
        ) : null}
      </Modal>
    </>
  );
};

export default AddLeave;

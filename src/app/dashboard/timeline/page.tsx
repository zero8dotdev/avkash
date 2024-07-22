"use client";

import { SettingOutlined } from "@ant-design/icons";
import { createClient } from "@supabase/supabase-js";
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Flex,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import Teams from "./_components/teams";
import { Scheduler } from "@aldabil/react-scheduler";
import { getRouteMatcher } from "next/dist/shared/lib/router/utils/route-matcher";
import { useApplicationContext } from "@/app/_context/appContext";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const Timeline = () => {
  const [teamData, setTeamData] = useState<any>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>([]);
  const [modal, setModal] = useState(false);
  const [users, setUsers] = useState<any>([]);
  const [selectedUsers, setSelectedusers] = useState<any>([]);
  const [user, setUser] = useState<any>();
  const [leaveType, setLeaveType] = useState<string>("paid of leave");
  const [openDrawer, setOpenDrawer] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);
  const { state, dispatch } = useApplicationContext();
  const { orgId } = state;

  const fetchTeamsData = async () => {
    try {
      const { data } = await supabase
        .from("Team")
        .select("*")
        .eq("orgId", orgId);
      if (data) {
        setTeamData(data);
      }
    } catch {}
  };
  const fetchUsersData = async () => {
    try {
      // const { data } = await supabase.from("User").select("*");
      // setUsers(data);
      const { data, error } = await supabase.from("User").select(`
      userId,
      name,
      email,
      isManager,
      createdOn,
      createdBy,
      updatedBy,
      updatedOn,
      accruedLeave,
      usedLeave,
      keyword,
      teamId,
      Team (
        name
      )
    `);

      if (error) {
        console.error("Error fetching users with team:", error);
        return;
      }
      setUsers(data);
    } catch {}
  };

  useEffect(() => {
    fetchTeamsData();
    fetchUsersData();
  }, []);

  const handleTeamSelect = async (teamId: string | null) => {
    if (teamId) {
      try {
        const { data: team } = await supabase
          .from("Team")
          .select("*")
          .eq("teamId", teamId);
        if (team) {
          setSelectedTeam(team);
        }
        const { data: user } = await supabase
          .from("User")
          .select("*")
          .eq("teamId", teamId);
        if (user) {
          setSelectedusers(user);
        }
      } catch {}
    } else {
      setSelectedTeam([]);
      setSelectedusers([]);
    }
  };
  const handleSelectUser = (userId: string | null) => {
    setUser(users.find((user: any) => user.userId === userId));
  };

  const onFinish = async (values: any) => {
    try {
      const { data } = await supabase
        .from("Leave")
        .insert({
          leaveType: values.leaveType,
          isApproved: values.approve === true ? "APPROVED" : "PENDING",
          startDate: new Date(values.dates[0].$d),
          endDate: new Date(values.dates[1].$d),
          userId: user.userId,
          teamId: user.teamId,
          reason: values.leaveRequestNote,
          duration: "FULL_DAY",
          shift: "NONE",
        })
        .select();
      if (data) {
        setModal(false);
        setOpenDrawer(false);
      }
    } catch {}
  };

  const fetchLeaves = async (selectedTeam: any) => {
    try {
      if (selectedTeam && selectedTeam.length === 0) {
        const { data, error } = await supabase.from("Leave").select(`
          leaveId,
          leaveType,
          duration,
          shift,
          isApproved,
          userId,
          reason,
          createdOn,
          createdBy,
          updatedBy,
          updatedOn,
          endDate,
          startDate,
          teamId,
          User (
            name
          )
        `);
        if (data) {
          setLeaves(data);
        }
      } else {
        const { data: selectLeaves } = await supabase
          .from("Leave")
          .select("*")
          .eq("teamId", selectedTeam[0].teamId);
        if (selectLeaves) {
          setLeaves(selectLeaves);
        }
      }
    } catch {}
  };

  const formattedLeaves = leaves.map((leave) => ({
    event_id: leave.leaveId,
    title: `${leave.leaveType}-${leave.User?.name}`,
    start: new Date(leave.startDate),
    end: new Date(leave.endDate),
    color: "#FFCCCC",
  }));
  console.log(formattedLeaves);
  useEffect(() => {
    fetchLeaves(selectedTeam);
  }, [selectedTeam]);

  return (
    <Flex vertical style={{ padding: "15px" }}>
      <Row gutter={24}>
        <Col span={12}>
          <Button onClick={() => setModal(true)}>Add Leave</Button>
        </Col>
        <Col span={12}>
          <Avatar icon={<SettingOutlined />} />
          <Select
            style={{ width: "150px" }}
            placeholder="Select your Team"
            onChange={handleTeamSelect}
            defaultValue={null}
          >
            <Select.Option value={null}>All Teams</Select.Option>
            {teamData.map((team: any) => (
              <Select.Option key={team.teamId} value={team.teamId}>
                {team.name}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={3}>
          {selectedTeam && selectedTeam.length > 0
            ? selectedTeam.map((team: any) => (
                <Teams key={team.teamId} team={team} />
              ))
            : teamData.map((team: any) => (
                <Teams key={team.teamId} team={team} />
              ))}
        </Col>
        <Col span={21}>
          <Scheduler
            height={600}
            view="month"
            events={formattedLeaves}
            editable={false}
            deletable={true}
            day={null}
            week={null}
            agenda={false}
            alwaysShowAgendaDays={true}
          />
        </Col>
      </Row>
      <Modal
        title="Select User"
        open={modal}
        onOk={() => setModal(false)}
        onCancel={() => setModal(false)}
      >
        <Select style={{ width: "100%" }} onChange={handleSelectUser}>
          {selectedUsers && selectedUsers.length > 0
            ? selectedUsers.map((user: any) => (
                <Select.Option key={user.userId} value={user.userId}>
                  {user.name}
                </Select.Option>
              ))
            : users.map((user: any) => (
                <Select.Option key={user.userId} value={user.userId}>
                  {user.name}
                  {"  "}({user.Team.name})
                </Select.Option>
              ))}
        </Select>
        <Flex
          style={{ height: "200px", width: "100%", padding: "10px" }}
          vertical
        >
          {user ? (
            <>
              <Typography.Title level={5}>Selected User</Typography.Title>
              <Card style={{ width: "100%" }}>
                <Space
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Space direction="vertical">
                    <Typography.Text>{user.name}</Typography.Text>
                    <Typography.Paragraph>{user.email}</Typography.Paragraph>
                  </Space>
                  <Space>
                    <Button onClick={() => setOpenDrawer(true)}>
                      Add leave
                    </Button>
                    <Button>View all leaves</Button>
                  </Space>
                </Space>
              </Card>
            </>
          ) : (
            <p>You have not selected any users yet. </p>
          )}
        </Flex>
      </Modal>
      <Drawer
        title={user !== undefined ? user.name : null}
        onClose={() => setOpenDrawer(false)}
        open={openDrawer}
      >
        <Card headStyle={{ backgroundColor: "#4A7696" }} title={<div />}>
          <Typography.Title level={4}>Create new {leaveType}</Typography.Title>
          <Typography.Paragraph disabled={true}>
            On behalf of:
          </Typography.Paragraph>
          <Typography.Title level={5} style={{ lineHeight: "0px" }}>
            {user?.name}
          </Typography.Title>
          <Typography.Paragraph disabled={true}>
            {user?.email}
          </Typography.Paragraph>
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Leave type:"
              name="leaveType"
              initialValue={"paid of leave"}
            >
              <Radio.Group
                onChange={(e: any) => setLeaveType(e.target.value)}
                value={leaveType}
              >
                <Space direction="vertical">
                  <Radio value="paid of leave">Paid of leave</Radio>
                  leaveTypeValue
                  <Radio value="sick leave">Sick leave</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              label="Requested dates:"
              name="dates"
              rules={[
                {
                  required: true,
                  message: "Please select start and end dates",
                },
              ]}
            >
              <DatePicker.RangePicker />
            </Form.Item>
            <Form.Item
              label="Leave request notes:"
              name="leaveRequestNote"
              initialValue=""
            >
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item
              label="Approve this leave?"
              name="approve"
              initialValue={false}
            >
              <Switch />
            </Form.Item>
            <Form.Item>
              <Button htmlType="submit">Save</Button>
            </Form.Item>
          </Form>
        </Card>
      </Drawer>
    </Flex>
  );
};

export default Timeline;

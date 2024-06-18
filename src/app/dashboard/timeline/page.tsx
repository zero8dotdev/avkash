"use client";

import { SettingOutlined } from "@ant-design/icons";
import { createClient } from "@/app/_utils/supabase/client";
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
const supabase = createClient();

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
  // const orgId = localStorage.getItem("orgId");
  const orgId = "8e9c6e9d-853b-4820-a220-0dab3c19e735";
  const userId = "b44487bb-824c-4777-a983-eeb88fe16de5";


  const fetchTeamsData = async () => {
    const { data, error } = await supabase.rpc("get_user_teams", {
      id: userId,
    });
    if (error) {
      console.error("Error invoking function:", error);
    } else {
      setTeamData(data);
    }
  };

  const fetchUsersData = async () => {
    const { data, error } = await supabase.rpc("get_users_by_organization", {
      id: userId,
    });
    if (error) {
      console.error("Error invoking function:", error);
    } else {
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchTeamsData();
    fetchUsersData();
  }, []);

  const handleTeamSelect = async (teamId: string | null) => {
    if (teamId) {
      try {
        const { data: team, error: teamerror } = await supabase.rpc(
          "get_team_by_id",
          { id: teamId }
        );
        if (teamerror) {
          console.log(teamerror);
        } else {
          setSelectedTeam(team);
        }
        const { data: user, error: usererror } = await supabase.rpc(
          "get_users_by_team_id",
          { id: teamId }
        );

        if (usererror) {
          console.log(usererror);
        } else {
          setSelectedusers(user);
        }
      } catch {}
    } else {
      setSelectedTeam([]);
      setSelectedusers([]);
    }
  };

  const handleSelectUser = (userId: string | null) => {
    setUser(users.find((user: any) => user.userid === userId));
  };

  const onFinish = async (values: any) => {
    try {
      const { data, error } = await supabase.rpc('insert_new_leave', {
        leavetype: values.leaveType,
        startdate: new Date(values.dates[0].$d),
        enddate: new Date(values.dates[1].$d),
        duration: 'FULL_DAY',
        shift: 'NONE',
        isapproved: values.approve === true ? 'APPROVED' : 'PENDING',
        userid: user.userid,
        teamid: user.teamid,
        reason: values.leaveRequestNote,
        createdby: "",
        updatedby: "",
        orgid: orgId,
      });
      if (error) {
        console.error("Error inserting leave:", error);
      } else {
        setModal(false);
        setOpenDrawer(false);
      }
    } catch {}
  };

  const fetchLeaves = async (selectedTeam: any) => {
    try {
      if (selectedTeam && selectedTeam.length === 0) {

        const { data: allleaves, error: allleaveerror } = await supabase.rpc(
          "get_leaves_by_user_org",
          { id: userId }
        );

        if (allleaves) {
          setLeaves(allleaves);
        }
      } else {
        const { data: selectLeaves, error: teamleaveerror } =
          await supabase.rpc("get_leaves_by_team", {
            id: selectedTeam[0].teamid,
          });

        if (selectLeaves) {
          setLeaves(selectLeaves);
        }
      }
    } catch {}
  };

  const formattedLeaves = leaves.map((leave) => ({
    event_id: leave.leaveid,
    title: `${leave.leavetype}-${leave.username}`,
    start: new Date(leave.startdate),
    end: new Date(leave.enddate),
    color: "#FFCCCC",
  }));
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
              <Select.Option key={team.teamid} value={team.teamid}>
                {team.name}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={3}>
          {selectedTeam && selectedTeam.length > 0
            ? selectedTeam.map((team: any) => (
                <Teams key={team.teamid} team={team} />
              ))
            : teamData.map((team: any) => (
                <Teams key={team.teamid} team={team} />
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
                <Select.Option key={user.userid} value={user.userid}>
                  {user.name}
                </Select.Option>
              ))
            : users.map((user: any) => (
                <Select.Option key={user.userid} value={user.userid}>
                  {user.name}
                  {"  "}({user.teamname})
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

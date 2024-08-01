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
  Tabs,
  Tag,
  Typography,
} from "antd";
import React, { useEffect, useState, useCallback } from "react";
import Teams from "./_components/teams";
import { Scheduler } from "@aldabil/react-scheduler";
import AllLeavesDrawer from "./_components/allLeavesDrawer";
import UserProfileDrawer from "./_components/UserProfileDrawer";
import { useApplicationContext } from "@/app/_context/appContext";
import { fetchAllTeams } from "@/app/_actions";
import { applyLeave, getLeaves, getLeaveTypes, getTeamData, getTeamsList, getUsersList } from "@/app/_components/header/_components/actions";
import ShowCalendarURL from "./_components/calenderfeed";
const supabase = createClient();

interface Team {
  teamId: string;
  name: string;
  orgId: string;
  isactive: boolean;
  manager: string | null;
  createdon: string;
  createdby: string | null;
  updatedby: string | null;
  updatedon: string;
}

const Timeline = () => {
  const [teamData, setTeamData] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [leaveType, setLeaveType] = useState<string>("paid of leave");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leavetypes, setLeavetypes] = useState<any[]>([]);
  const [allLeaveDrawerVisible, setAllLeaveDrawerVisible] = useState(false);
  const [userProfileDrawer, setUserProfileDrawer] = useState(false);

  const { state: appState } = useApplicationContext();
  const visibility = appState.org?.visibility;
  const role = appState.user?.role;
  const { userId, teamId, orgId } = appState;

  // TODO: need to be removed, as app context already has this data
  const fetchUserTeam = useCallback(async () => {
    try {
      const data = await getTeamData(teamId)
      setUserTeam(data);
    } catch (error) {
      console.error("Error fetching user team:", error);
    }
  }, [teamId]);

  const fetchTeamsData = useCallback(async () => {
    try {
      const allTeams = await getTeamsList(orgId);
      setTeamData(allTeams)
    } catch (error) {
      console.error("Error fetching teams data:", error);
    }
  }, [userId]);

  const fetchleavetypes = useCallback(async () => {
    try {
      const data = await getLeaveTypes(orgId);
      setLeavetypes(data);
    } catch (error) {
      console.error("Error fetching teams data:", error);
    }
  }, [userId]);

  const fetchUsersData = useCallback(async () => {
    try {
      if (visibility === "ORG") {
        if (role === "OWNER") {
          const data = await getUsersList("orgId",orgId)
          setUsers(data);
        } else if (role === "MANAGER") {
          const user = await getUsersList("teamId",teamId)
            setUsers(user);
        } else  {
          const user = await getUsersList("teamId",teamId)
            setUsers(user)
        }
      } else if (visibility === "TEAM") {
        if (role === "OWNER") {
          const data = await getUsersList("orgId",orgId)
          setUsers(data);
        } else if (role === "MANAGER") {
          const user = await getUsersList("teamId",teamId)
            setUsers(user);
        } else    {
          const user = await getUsersList("teamId",teamId)
            setUsers(user);
        }
      } else {
        if (role === "OWNER") {
          const data = await getUsersList("orgId",orgId)
          setUsers(data);
        } else if (role === "MANAGER") {
          const user = await getUsersList("teamId",teamId)
            setUsers(user);
        } else  {
          const user = await getUsersList("userId",userId)
            setUsers(user[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching users data:", error);
    }
  }, [userId]);


  const fetchLeaves = useCallback(async () => {
    try {
      if (role === "OWNER") {
        if (
          !selectedTeam ||
          selectedTeam.length === 0 ||
          selectedTeam.length > 1
        ) {
          const data = await getLeaves("orgId",orgId)
          setLeaves(data);
        } else {
          const data = await getLeaves("teamId",teamId)
          setLeaves(data);
        }
      } else if (role === "MANAGER") {
        if (!selectedTeam || selectedTeam.length === 0) {
          const data = await getLeaves("teamId",teamId)
          setLeaves(data);
        } else if (!selectedTeam || selectedTeam.length === 1) {
          const data = await getLeaves("teamId",teamId)
          setLeaves(data);
        } else {
          const data = await getLeaves("orgId",orgId)
          setLeaves(data);
        }
      } else {
        if (visibility === "ORG" || visibility === "TEAM") {
          if (!selectedTeam || selectedTeam.length === 0) {
            const data = await getLeaves("teamId",teamId)
          setLeaves(data);
          } else if (!selectedTeam || selectedTeam.length === 1) {
            const data = await getLeaves("teamId",teamId)
          setLeaves(data);
          } else {
            const data = await getLeaves("orgId",orgId)
            setLeaves(data);
          }
        } else {
          const data = await getLeaves("userId",userId)
          setLeaves(data);
        }
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
    }
  }, [selectedTeam, userId]);

  useEffect(
    () => {
      if (userId) {
        fetchUserTeam();
        fetchTeamsData();
        fetchleavetypes();
        fetchUsersData();
      }
    },
    [
      //fetchUserTeam
      appState
    ]
  );

  useEffect(() => {
    if (userId) {
      fetchLeaves();
    }
  }, [fetchLeaves]);

  const handleTeamSelect = async (teamId: string | null) => {
    if (!teamId) {
      setSelectedTeam([]);
      setUsers([]);
      return;
    }

    if (teamId === "All") {
      try {
        const [
          teamsData,
          userdata,
        ] = await Promise.all([
          getTeamsList(orgId),
          getUsersList("orgId",orgId)

        ]);

        setSelectedTeam(teamsData);
        setUsers(userdata);
      } catch (error) {
        console.error("Error fetching teams and users data:", error);
      }
    } else {
      try {
        const [
          team,
          users,
        ] = await Promise.all([
          getTeamData(teamId),
          getUsersList("teamId",teamId)
        ]);

        setSelectedTeam(team);
        setUsers(users);
      } catch (error) {
        console.error("Error handling team select:", error);
      }
    }
  };

  const handleSelectUser = (userId: string | null) => {
    let selectedUser;
    selectedUser = users.find((user: any) => user.userid === userId);
    setUser(selectedUser);
  };

  const onFinish = async (values: any) => {
    try {
      const data = await applyLeave(
         values.leaveType,
         values.dates[0],
         values.dates[1],
         "FULL_DAY",
         "NONE",
         values.approve === true ? "APPROVED" : "PENDING",
         user.userId,
         user.teamId,
         values.leaveRequestNote,
        user.orgId,
     )

      setModalVisible(false);
      setDrawerVisible(false);
    } catch (error) {
      console.error("Error inserting leave:", error);
    }
  };

  const formattedLeaves = leaves.map((leave) => ({
    event_id: leave.leaveId,
    title: `${leave.leavetype} - ${leave.username}`,
    start: new Date(leave.startdate),
    end: new Date(leave.enddate),
    color: leave.leavetype === "sick leave" ? "blue" : "red",
  }));

  const canAddLeave = (user: any) => {
    if (role === "OWNER") {
      return true; // Owner can always add leaves regardless of visibility
    }
    if (role === "MANAGER") {
      return teamId === user.teamId; // Manager can add leaves only if the user is related to his team
    }
    if (role === "USER") {
      return userId === user.userid; // User can only add leaves for themselves
    }
    return false;
  };

  const canApprove = (user: any) => {
    if (role === "OWNER") {
      return true; // Owner can always add leaves regardless of visibility
    }
    if (role === "MANAGER") {
      return true; // Manager can add leaves only if the user is related to his team
    }
    return false;
  };

  return (
    <Flex vertical style={{ padding: "15px" }}>
      <Row gutter={12}>
        <Col span={12}>
          <Button onClick={() => setModalVisible(true)} type="primary">
            Add Leave
          </Button>
        </Col>

        {/* OLD */}
        <Col span={12}>
          <Avatar
            icon={<SettingOutlined />}
            style={{ background: "none", color: "#000" }}
          />


          <Select
            style={{ width: "150px" }}
            placeholder="Select team"
            onChange={handleTeamSelect}
            disabled={
              (visibility === "TEAM" || visibility === "SELF") &&
              (role === "MANAGER" || role === "USER")
                ? true
                : false
            }
            defaultValue={role === "OWNER" ? "All" : userTeam?.teamId}
          >
            <Select.Option value={"All"}>All Teams</Select.Option>
            {teamData.map((team: any) => (
              <Select.Option key={team.teamId} value={team.teamId}>
                {team.name}
              </Select.Option>
            ))}
          </Select>
        </Col>



        <Col span={4} style={{ marginTop: "15px" }}>
          {visibility === "SELF" ? (
            role === "USER" || role === "MANAGER" ? (
              userTeam ? (
                <Teams
                  key={userTeam.teamId}
                  team={userTeam}
                  visibility={visibility}
                  role={role} // Pass the role of the current user
                  // Add owner-specific functionality here
                />
              ) : (
                teamData.map((team: Team) => (
                  <Teams
                    key={team.teamId}
                    team={team}
                    visibility={visibility}
                    role={role} // Pass the role of the current user
                  />
                ))
              )
            ) : selectedTeam.length > 0 ? (
              selectedTeam.map((team: Team) => (
                <Teams
                  key={team.teamId}
                  team={team}
                  visibility={visibility}
                  role={role} // Pass the role of the current user
                />
              ))
            ) : (
              teamData.map((team: Team) => (
                <Teams
                  key={team.teamId}
                  team={team}
                  visibility={visibility}
                  role={role} // Pass the role of the current user
                />
              ))
            )
          ) : selectedTeam.length > 0 ? (
            selectedTeam.map((team: Team) => (
              <Teams
                key={team.teamId}
                team={team}
                visibility={visibility}
                role={role} // Pass the role of the current user
              />
            ))
          ) : (visibility === "ORG" || visibility === "TEAM") &&
            (role === "MANAGER" || role === "USER") &&
            userTeam ? (
            <Teams
              key={userTeam.teamId}
              team={userTeam}
              visibility={visibility}
              role={role} // Pass the role of the current user
            />
          ) : (
            teamData.map((team: Team) => (
              <Teams
                key={team.teamId}
                team={team}
                visibility={visibility}
                role={role} // Pass the role of the current user
              />
            ))
          )}
        </Col>





        <Col span={20} style={{ marginTop: "15px" }}>
          <Scheduler
            height={350}
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
        open={modalVisible}
        onOk={() => setModalVisible(false)}
        onCancel={() => setModalVisible(false)}
      >
        <Select style={{ width: "100%" }} onChange={handleSelectUser}>
          {users && users.length > 0
            ? users.map((user: any) => (
                <Select.Option key={user.userId} value={user.userId}>
                  {user.name} - ({user.teamname})
                </Select.Option>
              ))
            : null}
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
                    <Button
                      onClick={() => setDrawerVisible(true)}
                      disabled={!canAddLeave(user)}
                    >
                      Add leave
                    </Button>
                    <Button onClick={() => setAllLeaveDrawerVisible(true)}>
                      View all leaves
                    </Button>
                  </Space>
                </Space>
              </Card>
            </>
          ) : (
            <p>You have not selected any users yet. </p>
          )}
        </Flex>
      </Modal>
      {/* <Drawer
        closable={false}
        title={
          <Flex gap={18}>
            <Avatar style={{ backgroundColor: "#f56a00" }}>
              {user ? user.name[0].toUpperCase() : null}
            </Avatar>
            <Space.Compact direction="vertical" block>
              <Typography.Title level={4} style={{ margin: "0px" }}>
                {user ? user.name : null}
              </Typography.Title>

              <Typography.Link
                underline={true}
                color="magenta"
                onClick={() => setUserProfileDrawer(true)}
              >
                user profile
              </Typography.Link>
            </Space.Compact>
          </Flex>
        }
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
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
              initialValue="paid of leave"
            >
              <Radio.Group
                onChange={(e: any) => setLeaveType(e.target.value)}
                value={leaveType}
              >
                <Space direction="vertical">
                  {leavetypes ? (
                    leavetypes.map((each) => (
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
              valuePropName="checked"
            >
              <Switch disabled={!canApprove(user)} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Drawer> */}
      <UserProfileDrawer
        userProfileDrawer={userProfileDrawer}
        setUserProfileDrawer={setUserProfileDrawer}
        user={user}
      />
      <AllLeavesDrawer
        user={user}
        allLeaveDrawerVisible={allLeaveDrawerVisible}
        setAllLeaveDrawerVisible={setAllLeaveDrawerVisible}
      />
      <ShowCalendarURL  userId={userId} teamId={teamId} orgId={orgId}/>
      <Tabs
        items={[
          {
            key: "1",
            label: "Today",
            children: "Today",
          },
          {
            key: "2",
            label: "Planned",
            children: "Planned",
          },
          {
            key: "3",
            label: "Pending approval",
            children: "pending approval",
          },
        ]}
      />
    </Flex>
  );
};

export default Timeline;

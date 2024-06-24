"use client";

import { SettingOutlined } from "@ant-design/icons";
// import { createClient } from "@/app/_utils/supabase/client";
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
import React, { useEffect, useState, useCallback } from "react";
import Teams from "./_components/teams";
import { Scheduler } from "@aldabil/react-scheduler";
import supabaseAdmin from "@/app/_utils/supabase/yash";
// const supabase = createClient();

interface Team {
  teamid: string;
  name: string;
  orgid: string;
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
  const [visibility, setVisibility] = useState("");
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [leaveType, setLeaveType] = useState<string>("paid of leave");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leavetypes, setLeavetypes] = useState<any[]>([]);

  const orgId = "8e9c6e9d-853b-4820-a220-0dab3c19e735";
  const userId = "fea6db2f-7ffe-4c1b-be18-0ee41da20cf1";
  const teamId = "30928054-ef43-48c5-b7b7-57014144eefc";
  const role = "MANAGER";

  const fetchVisibility = useCallback(async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from("User")
        .select(
          `
          Organisation (
            visibility
          )
        `
        )
        .eq("userId", userId);

      if (error) throw error;

      const visibility = data?.[0]?.Organisation?.visibility;
      setVisibility(visibility);
      return visibility;
    } catch (error) {
      console.error("Error fetching visibility:", error);
    }
  }, [userId]);

  const fetchUserTeam = useCallback(async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from("Team")
        .select("*")
        .eq("teamId", teamId)
        .single(); // Fetch a single object since we expect one team

      if (error) throw error;
      setUserTeam(data);
    } catch (error) {
      console.error("Error fetching user team:", error);
    }
  }, [teamId]);

  const fetchTeamsData = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await supabaseAdmin
        .from("User")
        .select("orgId")
        .eq("userId", userId)
        .single(); // Fetch a single user

      if (userError) throw userError;

      const { data, error } = await supabaseAdmin
        .from("Team")
        .select(
          `
          *,
          Organisation(name)
        `
        )
        .eq("orgId", userData.orgId);

      if (error) throw error;

      const teamsData = data.map((team) => ({
        ...team,
        orgName: team.Organisation.name,
      }));

      setTeamData(teamsData);
    } catch (error) {
      console.error("Error fetching teams data:", error);
    }
  }, [userId]);

  const fetchLeavetypes = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await supabaseAdmin
        .from("User")
        .select("orgId")
        .eq("userId", userId)
        .single(); // Fetch a single user

      if (userError) throw userError;

      const { data, error } = await supabaseAdmin
        .from("LeaveType")
        .select("*")
        .eq("orgId", userData.orgId);

      if (error) throw error;

      setLeavetypes(data);
    } catch (error) {
      console.error("Error fetching leave types:", error);
    }
  }, [userId]);

  const fetchUsersByOrganization = async (orgId: any) => {
    const { data, error } = await supabaseAdmin
      .from("User")
      .select(
        `
        userId,
        name,
        email,
        role,
        createdOn,
        createdBy,
        updatedBy,
        updatedOn,
        accruedLeave,
        usedLeave,
        keyword,
        teamId,
        Team(name)
      `
      )
      .eq("orgId", orgId);

    if (error) throw error;

    return data.map((user) => ({
      ...user,
      teamName: user.Team.name,
    }));
  };

  const fetchUsersByTeamId = async (teamId: any) => {
    const { data, error } = await supabaseAdmin
      .from("User")
      .select(
        `
        userId,
        name,
        email,
        teamId,
        Team(name),
        role,
        createdOn,
        createdBy,
        updatedBy,
        updatedOn,
        accruedLeave,
        usedLeave,
        keyword,
        orgId
      `
      )
      .eq("teamId", teamId);

    if (error) throw error;

    return data.map((user) => ({
      ...user,
      teamName: user?.Team?.name,
    }));
  };

  const fetchUserDataById = async (userId: any) => {
    const { data, error } = await supabaseAdmin
      .from("User")
      .select(
        `
        userId,
        name,
        email,
        teamId,
        role,
        createdOn,
        createdBy,
        updatedBy,
        updatedOn,
        accruedLeave,
        usedLeave,
        keyword,
        orgId
      `
      )
      .eq("userId", userId)
      .single();

    if (error) throw error;

    return data;
  };

  const fetchUsersData = useCallback(async () => {
    try {
      const visibility = await fetchVisibility();

      if (visibility === "ORG") {
        if (role === "OWNER") {
          const { data: userData, error: userError } = await supabaseAdmin
            .from("User")
            .select("orgId")
            .eq("userId", userId)
            .single();

          if (userError) throw userError;

          const users = await fetchUsersByOrganization(userData.orgId);
          setUsers(users);
        } else if (role === "MANAGER") {
          const users = await fetchUsersByTeamId(teamId);
          setUsers(users);
        } else {
          const users = await fetchUsersByTeamId(teamId);
          setUsers(users);
        }
      } else if (visibility === "TEAM") {
        if (role === "OWNER") {
          const { data: userData, error: userError } = await supabaseAdmin
            .from("User")
            .select("orgId")
            .eq("userId", userId)
            .single();

          if (userError) throw userError;

          const users = await fetchUsersByOrganization(userData.orgId);
          setUsers(users);
        } else if (role === "MANAGER") {
          const users = await fetchUsersByTeamId(teamId);
          setUsers(users);
        } else {
          const users = await fetchUsersByTeamId(teamId);
          setUsers(users);
        }
      } else {
        if (role === "OWNER") {
          const { data: userData, error: userError } = await supabaseAdmin
            .from("User")
            .select("orgId")
            .eq("userId", userId)
            .single();

          if (userError) throw userError;

          const users = await fetchUsersByOrganization(userData.orgId);
          setUsers(users);
        } else if (role === "MANAGER") {
          const users = await fetchUsersByTeamId(teamId);
          setUsers(users);
        } else {
          const user = await fetchUserDataById(userId);
          setUsers([user]);
        }
      }
    } catch (error) {
      console.error("Error fetching users data:", error);
    }
  }, [userId, teamId, role]);

  const fetchLeavesByOrganization = async (orgId) => {
    const { data, error } = await supabaseAdmin
      .from("Leave")
      .select(
        `
        leaveId,
        leaveType,
        startDate,
        endDate,
        duration,
        shift,
        isApproved,
        userId,
        User(name),
        teamId,
        Team(name),
        reason,
        orgId,
        Organisation(name),
        createdOn,
        createdBy,
        updatedBy,
        updatedOn
      `
      )
      .eq("orgId", orgId);

    if (error) throw error;

    return data.map((leave) => ({
      ...leave,
      userName: leave.User.name,
      teamName: leave.Team.name,
      orgName: leave.Organisation.name,
    }));
  };

  const fetchLeavesByTeamId = async (teamId: any) => {
    const { data, error } = await supabaseAdmin
      .from("Leave")
      .select(
        `
        leaveId,
        leaveType,
        startDate,
        endDate,
        duration,
        shift,
        isApproved,
        userId,
        User(name),
        teamId,
        Team(name),
        reason,
        orgId,
        Organisation(name),
        createdOn,
        createdBy,
        updatedBy,
        updatedOn
      `
      )
      .eq("teamId", teamId);

    if (error) throw error;

    return data.map((leave) => ({
      ...leave,
      userName: leave.User.name,
      teamName: leave.Team.name,
      orgName: leave.Organisation.name,
    }));
  };

  const fetchLeavesByUserId = async (userId: any) => {
    const { data, error } = await supabaseAdmin
      .from("Leave")
      .select(
        `
        leaveId,
        leaveType,
        startDate,
        endDate,
        duration,
        shift,
        isApproved,
        userId,
        teamId,
        reason,
        orgId,
        createdOn,
        createdBy,
        updatedBy,
        updatedOn
      `
      )
      .eq("userId", userId);

    if (error) throw error;

    return data;
  };

  const fetchLeaves = useCallback(async () => {
    try {
      const visibility = await fetchVisibility();

      if (role === "OWNER") {
        if (
          !selectedTeam ||
          selectedTeam.length === 0 ||
          selectedTeam.length > 1
        ) {
          const { data: userData, error: userError } = await supabaseAdmin
            .from("User")
            .select("orgId")
            .eq("userId", userId)
            .single();

          if (userError) throw userError;

          const leaves = await fetchLeavesByOrganization(userData.orgId);
          setLeaves(leaves);
        } else {
          const leaves = await fetchLeavesByTeamId(selectedTeam[0].teamid);
          setLeaves(leaves);
        }
      } else if (role === "MANAGER") {
        if (!selectedTeam || selectedTeam.length === 0) {
          const leaves = await fetchLeavesByTeamId(teamId);
          setLeaves(leaves);
        } else if (selectedTeam.length === 1) {
          const leaves = await fetchLeavesByTeamId(selectedTeam[0].teamId);
          setLeaves(leaves);
        } else {
          const { data: userData, error: userError } = await supabaseAdmin
            .from("User")
            .select("orgId")
            .eq("userId", userId)
            .single();

          if (userError) throw userError;

          const leaves = await fetchLeavesByOrganization(userData.orgId);
          setLeaves(leaves);
        }
      } else {
        if (visibility === "ORG" || visibility === "TEAM") {
          if (!selectedTeam || selectedTeam.length === 0) {
            const leaves = await fetchLeavesByTeamId(teamId);
            setLeaves(leaves);
          } else if (selectedTeam.length === 1) {
            const leaves = await fetchLeavesByTeamId(selectedTeam[0].teamId);
            setLeaves(leaves);
          } else {
            const { data: userData, error: userError } = await supabaseAdmin
              .from("User")
              .select("orgId")
              .eq("userId", userId)
              .single();

            if (userError) throw userError;

            const leaves = await fetchLeavesByOrganization(userData.orgId);
            setLeaves(leaves);
          }
        } else {
          const leaves = await fetchLeavesByUserId(userId);
          setLeaves(leaves);
        }
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
    }
  }, [selectedTeam, userId, role, teamId]);

  useEffect(
    () => {
      fetchVisibility();
      fetchUserTeam();
      fetchTeamsData();
      fetchLeavetypes();
      fetchUsersData();
    },
    [
      // fetchVisibility,
      // fetchUserTeam,
      // fetchTeamsData,
      // fetchUsersData,
      // fetchleavetypes,
    ]
  );

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const fetchUserTeams = async (userId: any) => {
    const { data: userOrgId, error: userError } = await supabaseAdmin
      .from("User")
      .select("orgId")
      .eq("userId", userId)
      .single();

    if (userError) throw userError;

    const { data, error } = await supabaseAdmin
      .from("Team")
      .select(
        `
        teamId,
        name,
        orgId,
        isActive,
        manager,
        createdOn,
        createdBy,
        updatedBy,
        updatedOn,
        Organisation(name)
      `
      )
      .eq("orgId", userOrgId.orgId); // Ensure orgId is accessed correctly

    if (error) throw error;

    return data.map((team) => ({
      ...team,
      orgName: team.Organisation.name,
    }));
  };

  const fetchallUsersByOrganization = async (userId: any) => {
    const { data: userOrgId, error: userError } = await supabaseAdmin
      .from("User")
      .select("orgId")
      .eq("userId", userId)
      .single();

    if (userError) throw userError;

    const { data, error } = await supabaseAdmin
      .from("User")
      .select(
        `
        userId,
        name,
        email,
        role,
        createdOn,
        createdBy,
        updatedBy,
        updatedOn,
        accruedLeave,
        usedLeave,
        keyword,
        teamId,
        Team(name)
      `
      )
      .eq("orgId", userOrgId.orgId); // Ensure orgId is accessed correctly

    if (error) throw error;

    return data.map((user) => ({
      ...user,
      teamName: user.Team?.name || null,
    }));
  };

  const fetchTeamById = async (teamId: any) => {
    const { data, error } = await supabaseAdmin
      .from("Team")
      .select("*")
      .eq("teamId", teamId)
      .single();

    if (error) throw error;

    return data;
  };

  const fetchallUsersByTeamId = async (teamId: any) => {
    const { data, error } = await supabaseAdmin
      .from("User")
      .select("*")
      .eq("teamId", teamId);

    if (error) throw error;

    return data;
  };

  const handleTeamSelect = async (teamId: any) => {
    if (!teamId) {
      setSelectedTeam([]);
      setUsers([]);
      return;
    }

    if (teamId === "All") {
      try {
        const [teamsData, usersData] = await Promise.all([
          fetchUserTeams(userId),
          fetchallUsersByOrganization(userId),
        ]);
        setSelectedTeam(teamsData);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching teams and users data:", error);
      }
    } else {
      try {
        const [team, users] = await Promise.all([
          fetchTeamById(teamId),
          fetchallUsersByTeamId(teamId),
        ]);

        setSelectedTeam([team]);
        setUsers(users);
      } catch (error) {
        console.error("Error handling team select:", error);
      }
    }
  };

  const handleSelectUser = (userId: string | null) => {
    let selectedUser;
    selectedUser = users.find((user: any) => user.userId === userId);
    setUser(selectedUser);
  };

  const onFinish = async (values: any) => {
    try {
      const { data, error } = await supabaseAdmin.from("Leave").insert([
        {
          leaveId: supabaseAdmin.rpc("uuid_generate_v4"), // Generate UUID
          leaveType: values.leaveType,
          startDate: new Date(values.dates[0].$d),
          endDate: new Date(values.dates[1].$d),
          duration: "FULL_DAY",
          shift: "NONE",
          isApproved: values.approve === true ? "APPROVED" : "PENDING",
          userId: user.userid,
          teamId: user.teamid,
          reason: values.leaveRequestNote,
          orgId: user.orgid,
          createdOn: new Date(),
          createdBy: "", // Replace with the actual creator if available
          updatedBy: "", // Replace with the actual updater if available
          updatedOn: new Date(),
        },
      ]);

      if (error) throw error;

      setModalVisible(false);
      setDrawerVisible(false);
    } catch (error) {
      console.error("Error inserting leave:", error);
    }
  };
  console.log("leaves", leaves);
  const formattedLeaves = leaves.map((leave) => ({
    event_id: leave.leaveId,
    title: `${leave.leaveType} - ${leave.userName}`,
    start: new Date(leave.startDate),
    end: new Date(leave.endDate),
    color: "#FFCCCC",
  }));

  const canAddLeave = (user: any) => {
    if (role === "OWNER") {
      return true; // Owner can always add leaves regardless of visibility
    }
    if (role === "MANAGER") {
      return teamId === user.teamId; // Manager can add leaves only if the user is related to his team
    }
    if (role === "USER") {
      return userId === user.userId; // User can only add leaves for themselves
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
      <Row gutter={24}>
        <Col span={12}>
          <Button onClick={() => setModalVisible(true)}>Add Leave</Button>
        </Col>
        <Col span={12}>
          <Avatar icon={<SettingOutlined />} />
          {visibility === "ORG" ? (
            role === "OWNER" ? (
              // Render Select component for organization visibility
              <Select
                style={{ width: "150px" }}
                placeholder="Select your Team"
                onChange={handleTeamSelect}
                defaultValue={"All"}
              >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamId} value={team.teamid}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            ) : role === "MANAGER" ? (
              // Manager sees only his team
              // <div>{userTeam?.name}</div>
              <Select
                style={{ width: "150px" }}
                onChange={handleTeamSelect}
                defaultValue={userTeam?.teamid}
              >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              // User sees his team
              <Select
                style={{ width: "150px" }}
                onChange={handleTeamSelect}
                defaultValue={userTeam?.teamid}
              >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            )
          ) : visibility === "TEAM" ? (
            // Render based on 'TEAM' visibility
            role === "OWNER" ? (
              // Owner sees all teams
              <Select
                style={{ width: "150px" }}
                placeholder="Select your Team"
                onChange={handleTeamSelect}
                defaultValue={"All"}
              >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            ) : role === "MANAGER" ? (
              // Manager sees only his team
              // <div>{userTeam?.name}</div>
              <Select
                style={{ width: "150px" }}
                onChange={handleTeamSelect}
                defaultValue={userTeam?.teamid}
                disabled
              >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <Select
                style={{ width: "150px" }}
                onChange={handleTeamSelect}
                defaultValue={userTeam?.teamid}
                disabled
              >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            )
          ) : visibility === "SELF" ? (
            // Render based on 'SELF' visibility
            role === "OWNER" ? (
              // Owner sees all teams
              <Select
                style={{ width: "150px" }}
                placeholder="Select your Team"
                onChange={handleTeamSelect}
                defaultValue={"All"}
              >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            ) : role === "MANAGER" ? (
              // Manager sees only his team
              <Select
                style={{ width: "150px" }}
                onChange={handleTeamSelect}
                defaultValue={userTeam?.teamid}
                disabled
              >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <Select
                style={{ width: "150px" }}
                onChange={handleTeamSelect}
                defaultValue={userTeam?.teamid}
                disabled
              >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            )
          ) : null}
        </Col>
        <Col span={3}>
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
                    key={team?.teamId}
                    team={team}
                    visibility={visibility}
                    role={role} // Pass the role of the current user
                  />
                ))
              )
            ) : selectedTeam.length > 0 ? (
              selectedTeam.map((team: Team) => (
                <Teams
                  key={team.teamid}
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
        open={modalVisible}
        onOk={() => setModalVisible(false)}
        onCancel={() => setModalVisible(false)}
      >
        <Select
          defaultValue={null}
          style={{ width: "100%" }}
          onChange={handleSelectUser}
        >
          {users && users.length > 0 ? (
            users.map((user: any) => (
              <Select.Option key={user.userId} value={user.userId}>
                {`${user.name} - (${user.teamName})`}
              </Select.Option>
            ))
          ) : (
            <Select.Option disabled value={null}>
              No users available
            </Select.Option>
          )}
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
        title={user ? user.name : null}
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
                      <Radio key={each.leaveTypeId} value={each.name}>
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
      </Drawer>
    </Flex>
  );
};

export default Timeline;

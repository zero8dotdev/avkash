"use client";

import { SettingOutlined } from "@ant-design/icons";
import { createClient } from "@/app/_utils/supabase/client";
import { Avatar,  Button,Card, Col,DatePicker, Drawer, Flex, Form, Input, Modal, Radio, Row, Select, Space, Switch, Typography } from "antd";
import React, { useEffect, useState, useCallback } from "react";
import Teams from "./_components/teams";
import { Scheduler } from "@aldabil/react-scheduler";
const supabase = createClient();

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
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [leaveType, setLeaveType] = useState<string>("paid of leave");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);

  const orgId = "8e9c6e9d-853b-4820-a220-0dab3c19e735";
  const userId = "b44487bb-824c-4777-a983-eeb88fe16de5";
  const teamId = "30928054-ef43-48c5-b7b7-57014144eefc";
  const role = "MANAGER";
  const fetchVisibility = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_user_org_visibility", {
        id: userId,
      });
      if (error) throw error;
      setVisibility(data);
      return data;
    } catch (error) {
      console.error("Error fetching visibility:", error);
    }
  }, [userId]);

  const fetchUserTeam = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_team_by_id", {
        id: teamId,
      });
      if (error) throw error;
      console.log("userTeam", data[0]);
      setUserTeam(data[0]);
    } catch (error) {
      console.error("Error fetching user team:", error);
    }
  }, [teamId]);

  const fetchTeamsData = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_user_teams", {
        id: userId,
      });
      if (error) throw error;
      setTeamData(data);
    } catch (error) {
      console.error("Error fetching teams data:", error);
    }
  }, [userId]);

  const fetchUsersData = useCallback(async () => {
    try {
      const visibility = await fetchVisibility();

      if (visibility === "ORG") {
        if(role === "OWNER"){
          const { data, error } = await supabase.rpc(
            "get_users_by_organization",
            {
              id: userId,
            }
          );
          if (error) throw error;
          setUsers(data);
        }else if(role === "MANAGER"){
          const { data: user, error: usererror } = await supabase.rpc(
            "get_users_by_team_id",
            { id: teamId }
          );
  
          if (usererror) {
            console.log(usererror);
          } else {
            setUsers(user);
          }
        }else{
          const { data: user, error: usererror } = await supabase.rpc(
            "get_users_by_team_id",
            { id: teamId }
          );
  
          if (usererror) {
            console.log(usererror);
          } else {
            setUsers(user);
          }
        }
      } else if (visibility === "TEAM") {

        if(role === "OWNER"){
          const { data, error } = await supabase.rpc(
            "get_users_by_organization",
            {
              id: userId,
            }
          );
          if (error) throw error;
          setUsers(data);
        }else if(role === "MANAGER"){

          const { data: user, error: usererror } = await supabase.rpc(
            "get_users_by_team_id",
            { id: teamId }
          );
  
          if (usererror) {
            console.log(usererror);
          } else {
            setUsers(user);
          }
        }else{

          const { data: user, error: usererror } = await supabase.rpc(
            "get_users_by_team_id",
            { id: teamId }
          );
  
          if (usererror) {
            console.log(usererror);
          } else {
            setUsers(user);
          }
        }
      }else{
        if(role === "OWNER"){

          const { data, error } = await supabase.rpc(
            "get_users_by_organization",
            {
              id: userId,
            }
          );
          if (error) throw error;
          setUsers(data);
        }else if(role === "MANAGER"){

          const { data: user, error: usererror } = await supabase.rpc(
            "get_users_by_team_id",
            { id: teamId }
          );
  
          if (usererror) {
            console.log(usererror);
          } else {
            setUsers(user);
          }
        }else{

          const { data: user, error: usererror } = await supabase.rpc("get_user_data_by_id", {
            id: userId,
          });
          if (usererror) {
            console.log(usererror);
          } else {
            setUsers(user);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching users data:", error);
    }
  }, [userId]);

  useEffect(() => {
    // fetchVisibility();
    fetchUserTeam();
    fetchTeamsData();
    fetchUsersData();
  }, [fetchVisibility, fetchUserTeam, fetchTeamsData, fetchUsersData]);

  const handleTeamSelect = async (teamId: string | null) => {
    console.log("teamId",teamId)
    if (!teamId) {
      setSelectedTeam([]);
      setSelectedUsers([]);
      return;
    }
  
    if (teamId === "All") {
      try {
        const [{ data: teamsData, error: teamsError }, { data: usersData, error: usersError }] = await Promise.all([
          supabase.rpc("get_user_teams", { id: userId }),
          supabase.rpc("get_users_by_organization", { id: userId }),
        ]);
        if (teamsError) throw teamsError;
        if (usersError) throw usersError;
  
        setSelectedTeam(teamsData);
        setSelectedUsers(usersData);
      } catch (error) {
        console.error("Error fetching teams and users data:", error);
      }
      return;
    }
  
    try {
      const [
        { data: team, error: teamError },
        { data: users, error: userError },
      ] = await Promise.all([
        supabase.rpc("get_team_by_id", { id: teamId }),
        supabase.rpc("get_users_by_team_id", { id: teamId }),
      ]);
  
      if (teamError) throw teamError;
      if (userError) throw userError;
  
      setSelectedTeam(team);
      setSelectedUsers(users);
    } catch (error) {
      console.error("Error handling team select:", error);
    }
  };
  

  const handleSelectUser = (userId: string | null) => {
    const selectedUser = users.find((user: any) => user.userid === userId);
    console.log(users)
    console.log('user',selectedUser)
    setUser(selectedUser);
  };

  const onFinish = async (values: any) => {
    try {
      const { data, error } = await supabase.rpc("insert_new_leave", {
        leavetype: values.leaveType,
        startdate: new Date(values.dates[0].$d),
        enddate: new Date(values.dates[1].$d),
        duration: "FULL_DAY",
        shift: "NONE",
        isapproved: values.approve === true ? "APPROVED" : "PENDING",
        userid: user.userid,
        teamid: user.teamid,
        reason: values.leaveRequestNote,
        createdby: "",
        updatedby: "",
        orgid: user.orgid,
      });
      if (error) throw error;

      setModalVisible(false);
      setDrawerVisible(false);
    } catch (error) {
      console.error("Error inserting leave:", error);
    }
  };

  const fetchLeaves = useCallback(async () => {
    try {
      if (!selectedTeam || selectedTeam.length === 0) {
        const { data: allLeaves, error: allLeaveError } = await supabase.rpc(
          "get_leaves_by_user_org",
          { id: userId }
        );
        if (allLeaveError) throw allLeaveError;
        setLeaves(allLeaves);
      } else {
        const { data: selectLeaves, error: teamLeaveError } =
          await supabase.rpc("get_leaves_by_team", {
            id: selectedTeam[0].teamid,
          });
        if (teamLeaveError) throw teamLeaveError;
        setLeaves(selectLeaves);
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
    }
  }, [selectedTeam, userId]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const formattedLeaves = leaves.map((leave) => ({
    event_id: leave.leaveid,
    title: `${leave.leavetype} - ${leave.username}`,
    start: new Date(leave.startdate),
    end: new Date(leave.enddate),
    color: "#FFCCCC",
  }));

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
              <Select style={{ width: "150px" }} placeholder="Select your Team" onChange={handleTeamSelect} defaultValue={"All"} >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamid} value={team.teamid}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            ) : role === "MANAGER" ? (
              // Manager sees only his team
              // <div>{userTeam?.name}</div>
              <Select  style={{ width: "150px" }}   onChange={handleTeamSelect}    defaultValue={userTeam?.teamid} >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamid} value={team.teamid}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              // User sees his team
              <Select style={{ width: "150px" }} onChange={handleTeamSelect}  defaultValue={userTeam?.teamid}   >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamid} value={team.teamid}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            )
          ) : visibility === "TEAM" ? (
            // Render based on 'TEAM' visibility
            role === "OWNER" ? (
              // Owner sees all teams
              <Select   style={{ width: "150px" }}    placeholder="Select your Team"   onChange={handleTeamSelect} defaultValue={"All"} >
                <Select.Option value={"All"}>All Teams</Select.Option>
                {teamData.map((team: any) => (
                  <Select.Option key={team.teamid} value={team.teamid}>
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
                  <Select.Option key={team.teamid} value={team.teamid}>
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
                  <Select.Option key={team.teamid} value={team.teamid}>
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
                  <Select.Option key={team.teamid} value={team.teamid}>
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
                  <Select.Option key={team.teamid} value={team.teamid}>
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
                  <Select.Option key={team.teamid} value={team.teamid}>
                    {team.name}
                  </Select.Option>
                ))}
              </Select>
            )
          ) : null}
        </Col>
        <Col span={3}>
          { visibility === "SELF" ? (
              role === "USER" || role === "MANAGER"? (
                userTeam ? (
                  <Teams
                    key={userTeam.teamid}
                    team={userTeam}
                    visibility={visibility}
                    role={role} // Pass the role of the current user
                    // Add owner-specific functionality here
                  />
                ): (
                  teamData.map((team: Team) => (
                    <Teams
                      key={team.teamid}
                      team={team}
                      visibility={visibility}
                      role={role} // Pass the role of the current user
                    />
                  )
                )
                )
              ): selectedTeam.length > 0 ? (
                selectedTeam.map((team: Team) => (
                  <Teams
                    key={team.teamid}
                    team={team}
                    visibility={visibility}
                    role={role} // Pass the role of the current user
                  />
                ))
              ) :teamData.map((team: Team) => (
                <Teams
                  key={team.teamid}
                  team={team}
                  visibility={visibility}
                  role={role} // Pass the role of the current user
                />
              ))
            ): selectedTeam.length > 0 ? (
            selectedTeam.map((team: Team) => (
              <Teams
                key={team.teamid}
                team={team}
                visibility={visibility}
                role={role} // Pass the role of the current user
              />
            ))
          ): (visibility === "ORG" || visibility === "TEAM" ) && (role === "MANAGER" || role === "USER" ) && userTeam ? (
            <Teams
              key={userTeam.teamid}
              team={userTeam}
              visibility={visibility}
              role={role} // Pass the role of the current user
            />
          ) :(
            teamData.map((team: Team) => (
              <Teams
                key={team.teamid}
                team={team}
                visibility={visibility}
                role={role} // Pass the role of the current user
              />
            ))
          )}
        </Col>

        <Col span={21}>
          <Scheduler  height={600}  view="month"  events={formattedLeaves}  editable={false}  deletable={true}  day={null}  week={null}  agenda={false}  alwaysShowAgendaDays={true} />
        </Col>
      </Row>
      <Modal  title="Select User"  open={modalVisible}  onOk={() => setModalVisible(false)}  onCancel={() => setModalVisible(false)} >
        <Select style={{ width: "100%" }} onChange={handleSelectUser}>
          {selectedUsers && selectedUsers.length > 0
            ? selectedUsers.map((user: any) => (
                <Select.Option key={user.userid} value={user.userid}>
                  {user.name}
                </Select.Option>
              ))
            : users.map((user: any) => (
                <Select.Option key={user.userid} value={user.userid}>
                  {user.name} ({user.teamname})
                </Select.Option>
              ))}
        </Select>
        <Flex style={{ height: "200px", width: "100%", padding: "10px" }} vertical >
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
                    <Button onClick={() => setDrawerVisible(true)}>
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
            <Form.Item  label="Leave type:"    name="leaveType"    initialValue="paid of leave"  >
              <Radio.Group
                onChange={(e: any) => setLeaveType(e.target.value)}
                value={leaveType}
              >
                <Space direction="vertical">
                  <Radio value="paid of leave">Paid of leave</Radio>
                  <Radio value="sick leave">Sick leave</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
            <Form.Item  label="Requested dates:"  name="dates"  rules={[  {  required: true,  message: "Please select start and end dates"  } ]}>
              <DatePicker.RangePicker />
            </Form.Item>
            <Form.Item
              label="Leave request notes:"
              name="leaveRequestNote"
              initialValue=""
            >
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item  label="Approve this leave?"  name="approve"  initialValue={false}  valuePropName="checked"  >
              <Switch />
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
// "use client";

// import { SettingOutlined } from "@ant-design/icons";
// import React, { useEffect, useState, useCallback } from "react";
// import { 
//   Avatar, 
//   Button,
//   Card,
//   Col,
//   DatePicker,
//   Drawer,
//   Flex,
//   Form,
//   Input,
//   Modal,
//   Radio,
//   Row,
//   Select,
//   Space,
//   Switch,
//   Typography 
// } from "antd";
// import Teams from "./_components/teams";
// import { Scheduler } from "@aldabil/react-scheduler";
// import { createClient } from "@/app/_utils/supabase/client";

// const supabase = createClient();

// interface Team {
//   teamid: string;
//   name: string;
//   orgid: string;
//   isactive: boolean;
//   manager: string | null;
//   createdon: string;
//   createdby: string | null;
//   updatedby: string | null;
//   updatedon: string;
// }

// const Timeline = () => {
//   const [teamData, setTeamData] = useState<Team[]>([]);
//   const [selectedTeam, setSelectedTeam] = useState<Team[]>([]);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [visibility, setVisibility] = useState("");
//   const [userTeam, setUserTeam] = useState<Team | null>(null);
//   const [users, setUsers] = useState<any[]>([]);
//   const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
//   const [user, setUser] = useState<any>(null);
//   const [leaveType, setLeaveType] = useState<string>("paid of leave");
//   const [drawerVisible, setDrawerVisible] = useState(false);
//   const [leaves, setLeaves] = useState<any[]>([]);

//   const orgId = "8e9c6e9d-853b-4820-a220-0dab3c19e735";
//   const userId = "b44487bb-824c-4777-a983-eeb88fe16de5";
//   const teamId = "30928054-ef43-48c5-b7b7-57014144eefc";
//   const role = "USER";

//   const fetchVisibility = useCallback(async () => {
//     try {
//       const { data, error } = await supabase.rpc("get_user_org_visibility", {
//         id: userId,
//       });
//       if (error) throw error;
//       setVisibility(data);
//       return data;
//     } catch (error) {
//       console.error("Error fetching visibility:", error);
//     }
//   }, [userId]);

//   const fetchUserTeam = useCallback(async () => {
//     try {
//       const { data, error } = await supabase.rpc("get_team_by_id", {
//         id: teamId,
//       });
//       if (error) throw error;
//       setUserTeam(data[0]);
//     } catch (error) {
//       console.error("Error fetching user team:", error);
//     }
//   }, [teamId]);

//   const fetchTeamsData = useCallback(async () => {
//     try {
//       const { data, error } = await supabase.rpc("get_user_teams", {
//         id: userId,
//       });
//       if (error) throw error;
//       setTeamData(data);
//     } catch (error) {
//       console.error("Error fetching teams data:", error);
//     }
//   }, [userId]);

//   const fetchUsersData = useCallback(async () => {
//     try {
//       const visibility = await fetchVisibility();

//       if (visibility === "ORG") {
//         const { data, error } = await supabase.rpc(
//           "get_users_by_organization",
//           { id: userId }
//         );
//         if (error) throw error;
//         setUsers(data);
//       } else {
//         const { data, error } = await supabase.rpc(
//           "get_users_by_team_id",
//           { id: teamId }
//         );
//         if (error) throw error;
//         setUsers(data);
//       }
//     } catch (error) {
//       console.error("Error fetching users data:", error);
//     }
//   }, [userId, fetchVisibility, teamId]);

//   useEffect(() => {
//     fetchUserTeam();
//     fetchTeamsData();
//     fetchUsersData();
//   }, [fetchUserTeam, fetchTeamsData, fetchUsersData]);

//   const handleTeamSelect = async (teamId: string | null) => {
//     if (!teamId) {
//       setSelectedTeam([]);
//       setSelectedUsers([]);
//       return;
//     }

//     if (teamId === "All") {
//       try {
//         const [{ data: teamsData }, { data: usersData }] = await Promise.all([
//           supabase.rpc("get_user_teams", { id: userId }),
//           supabase.rpc("get_users_by_organization", { id: userId }),
//         ]);
//         setSelectedTeam(teamsData);
//         setSelectedUsers(usersData);
//       } catch (error) {
//         console.error("Error fetching teams and users data:", error);
//       }
//       return;
//     }

//     try {
//       const [{ data: team }, { data: users }] = await Promise.all([
//         supabase.rpc("get_team_by_id", { id: teamId }),
//         supabase.rpc("get_users_by_team_id", { id: teamId }),
//       ]);
//       setSelectedTeam(team);
//       setSelectedUsers(users);
//     } catch (error) {
//       console.error("Error handling team select:", error);
//     }
//   };

//   const handleSelectUser = (userId: string | null) => {
//     const selectedUser = users.find((user: any) => user.userid === userId);
//     setUser(selectedUser);
//   };

//   const onFinish = async (values: any) => {
//     try {
//       const { data, error } = await supabase.rpc("insert_new_leave", {
//         leavetype: values.leaveType,
//         startdate: new Date(values.dates[0].$d),
//         enddate: new Date(values.dates[1].$d),
//         duration: "FULL_DAY",
//         shift: "NONE",
//         isapproved: values.approve === true ? "APPROVED" : "PENDING",
//         userid: user.userid,
//         teamid: user.teamid,
//         reason: values.leaveRequestNote,
//         createdby: "",
//         updatedby: "",
//         orgid: orgId,
//       });
//       if (error) throw error;

//       setModalVisible(false);
//       setDrawerVisible(false);
//     } catch (error) {
//       console.error("Error inserting leave:", error);
//     }
//   };

//   const fetchLeaves = useCallback(async () => {
//     try {
//       let fetchMethod, params;
//       if (!selectedTeam || selectedTeam.length === 0) {
//         fetchMethod = "get_leaves_by_user_org";
//         params = { id: userId };
//       } else {
//         fetchMethod = "get_leaves_by_team";
//         params = { id: selectedTeam[0].teamid };
//       }
//       const { data, error } = await supabase.rpc(fetchMethod, params);
//       if (error) throw error;
//       setLeaves(data);
//     } catch (error) {
//       console.error("Error fetching leaves:", error);
//     }
//   }, [selectedTeam, userId]);

//   useEffect(() => {
//     fetchLeaves();
//   }, [fetchLeaves]);

//   const formattedLeaves = leaves.map((leave) => ({
//     event_id: leave.leaveid,
//     title: `${leave.leavetype} - ${leave.username}`,
//     start: new Date(leave.startdate),
//     end: new Date(leave.enddate),
//     color: "#FFCCCC",
//   }));

//   return (
//     <Flex vertical style={{ padding: "15px" }}>
//       <Row gutter={24}>
//         <Col span={12}>
//           <Button onClick={() => setModalVisible(true)}>Add Leave</Button>
//         </Col>
//         <Col span={12}>
//           <Avatar icon={<SettingOutlined />} />
//           {visibility && (
//             <Select
//               style={{ width: "150px" }}
//               placeholder="Select your Team"
//               onChange={handleTeamSelect}
//               defaultValue={"All"}
//             >
//               <Select.Option value={"All"}>All Teams</Select.Option>
//               {teamData.map((team: any) => (
//                 <Select.Option key={team.teamid} value={team.teamid}>
//                   {team.name}
//                 </Select.Option>
//               ))}
//             </Select>
//           )}
//         </Col>
//         <Col span={3}>
//           {selectedTeam.length > 0 ? (
//             selectedTeam.map((team: Team) => (
//               <Teams
//                 key={team.teamid}
//                 team={team}
//                 visibility={visibility}
//                 role={role}
//               />
//             ))
//           ) : (
//             teamData.map((team: Team) => (
//               <Teams
//                 key={team.teamid}
//                 team={team}
//                 visibility={visibility}
//                 role={role}
//               />
//             ))
//           )}
//         </Col>

//         <Col span={21}>
//           <Scheduler
//             height={600}
//             view="month"
//             events={formattedLeaves}
//             editable={false}
//             deletable={true}
//             day={null}
//             week={null}
//             agenda={false}
//             alwaysShowAgendaDays={true}
//           />
//         </Col>
//       </Row>
//       <Modal
//         title="Select User"
//         open={modalVisible}
//         onOk={() => setModalVisible(false)}
//         onCancel={() => setModalVisible(false)}
//         footer={[
//           <Button key="back" onClick={() => setModalVisible(false)}>
//             Cancel
//           </Button>,
//           <Button key="submit" type="primary" onClick={() => setDrawerVisible(true)}>
//             Select
//           </Button>,
//         ]}
//       >
//         <Select
//           showSearch
//           style={{ width: 200 }}
//           placeholder="Select a user"
//           optionFilterProp="children"
//           onChange={handleSelectUser}
//         >
//           {users.map((user: any) => (
//             <Select.Option key={user.userid} value={user.userid}>
//               {user.firstname} {user.lastname}
//             </Select.Option>
//           ))}
//         </Select>
//       </Modal>
//       <Drawer
//         title="New Leave Request"
//         placement="right"
//         closable={false}
//         onClose={() => setDrawerVisible(false)}
//         visible={drawerVisible}
//       >
//         <Form
//           onFinish={onFinish}
//           layout="vertical"
//           initialValues={{ leaveType: "paid of leave", dates: [null, null], approve: false }}
//         >
//           <Form.Item label="Leave Type" name="leaveType">
//             <Radio.Group>
//               <Radio value="paid of leave">Paid Leave</Radio>
//               <Radio value="sick leave">Sick Leave</Radio>
//               <Radio value="other leave">Other Leave</Radio>
//             </Radio.Group>
//           </Form.Item>
//           <Form.Item label="Dates" name="dates">
//             <DatePicker.RangePicker />
//           </Form.Item>
//           <Form.Item label="Leave Request Note" name="leaveRequestNote">
//             <Input.TextArea rows={4} />
//           </Form.Item>
//           <Form.Item label="Approve" name="approve" valuePropName="checked">
//             <Switch />
//           </Form.Item>
//           <Form.Item>
//             <Button type="primary" htmlType="submit">
//               Submit
//             </Button>
//           </Form.Item>
//         </Form>
//       </Drawer>
//     </Flex>
//   );
// };

// export default Timeline;

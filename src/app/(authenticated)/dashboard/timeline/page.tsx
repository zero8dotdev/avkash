"use client";

import { Col, Flex, Radio, Row, Space } from "antd";

import TeamSelect from "./_components/team-select";
import LeavePreview from "./_components/leave-preview";
import LeaveCalendar from "./_components/leave-calendar";
import { useEffect, useState } from "react";
import AddLeave from "./_components/add-leave";
import ShowCalendarURL from "./_components/calenderfeed";
import { useApplicationContext } from "@/app/_context/appContext";
import { fetchLeaveTypes } from "@/app/_actions";
import UserDrawer from "./_components/user-drawer";

export default function Page() {
  const [team, setTeam] = useState<string | undefined>(undefined);
  const {
    state: { orgId, userId, teamId },
  } = useApplicationContext();
  const [changeView, setChangeView] = useState<0 | 1 | 2>(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [leaveTypes, setLeaveTypes] = useState<any>([]);
  const [users, setUsers] = useState<any>([]);

  useEffect(() => {
    (async () => {
      const leaveTypes = await fetchLeaveTypes(orgId);
      if (leaveTypes) {
        setLeaveTypes(leaveTypes);
      }
    })();
  }, [orgId]);
  console.log("users.", users);
  return (
    <Row style={{ padding: "25px" }}>
      <Col span={24}>
        <Flex justify="space-between">
          <AddLeave
            users={users}
            onSelectedUser={(v: any) => setSelectedUser(v)}
          />

          <TeamSelect onChangeTeamUsers={(users: any) => setUsers(users)} />
          <Space>
            <Radio.Group defaultValue={changeView}>
              <Radio.Button value={1} onChange={() => setChangeView(1)}>
                Week
              </Radio.Button>
              <Radio.Button value={0} onChange={() => setChangeView(0)}>
                Month
              </Radio.Button>
            </Radio.Group>
          </Space>
        </Flex>
        <LeaveCalendar
          users={users}
          changeView={changeView}
          onChangeUser={(v: any) => setSelectedUser(v)}
        />
        <Flex gap={8} vertical>
          <ShowCalendarURL userId={userId} teamId={teamId} orgId={orgId} />
          <LeavePreview />
        </Flex>
      </Col>
      <UserDrawer
        selectedUser={selectedUser}
        leaveTypes={leaveTypes}
        onSelectUserChange={() => setSelectedUser(null)}
      />
    </Row>
  );
}

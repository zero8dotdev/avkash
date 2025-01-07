"use client";

import { Col, Flex, Radio, Row, Space } from "antd";

import TeamSelect from "./_components/team-select";
import Teams from "./_components/teams";
import LeavePreview from "./_components/leave-preview";
import LeaveCalendar from "./_components/leave-calendar";
import { useState } from "react";
import AddLeave from "./_components/add-leave";
import ShowCalendarURL from "./_components/calenderfeed";
import { useApplicationContext } from "@/app/_context/appContext";

export default function Page() {
  const [team, setTeam] = useState<string | undefined>(undefined);
  const {
    state: { orgId, userId, teamId },
  } = useApplicationContext();
  const [changeView, setChangeView] = useState<0 | 1 | 2>(0);
  return (
    <Row style={{ padding: "25px" }}>
      <Col span={24}>
        <Flex justify="space-between">
          <AddLeave team={team} />

          <TeamSelect changeTeam={(team: string) => setTeam(team)} />
          <Space>
            <Radio.Group defaultValue={changeView}>
              <Radio.Button value={0} onChange={() => setChangeView(0)}>
                Week
              </Radio.Button>
              <Radio.Button value={1} onChange={() => setChangeView(1)}>
                Month
              </Radio.Button>
            </Radio.Group>
          </Space>
        </Flex>
        <LeaveCalendar team={team} changeView={changeView} />
        <Flex gap={8} vertical>
          <ShowCalendarURL userId={userId} teamId={teamId} orgId={orgId} />
          <LeavePreview />
        </Flex>
      </Col>
    </Row>
  );
}

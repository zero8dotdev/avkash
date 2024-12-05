"use client";

import { Flex } from "antd";

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
  return (
    <>
      <TeamSelect
        changeTeam={(team: string) => {
          setTeam(team);
        }}
      />
      <LeaveCalendar />
      <Flex gap={8} vertical>
        <ShowCalendarURL userId={userId} teamId={teamId} orgId={orgId} />
        <LeavePreview />
      </Flex>
    </>
  );
}

"use client";

import { Flex } from "antd";

import TeamSelect from "./_components/team-select";
import Teams from "./_components/teams";
import LeavePreview from "./_components/leave-preview";
import LeaveCalendar from "./_components/leave-calendar";
import { useState } from "react";
import AddLeave from "./_components/add-leave";

export default function Page() {
  const [team, setTeam] = useState<string | undefined>(undefined);

  return (
    <Flex vertical gap={12}>
      <Flex gap={8} align="center" justify="space-between">
        <AddLeave team={team}/>
        <TeamSelect
          changeTeam={(team: string) => {
            setTeam(team);
          }}
        />
      </Flex>
      <Flex gap={8}>
        <Flex
          style={{ minWidth: "200px", maxHeight: "500px", overflowY: "scroll" }}
        >
          <Teams selectedTeam={team} />
        </Flex>
        <Flex flex={1} align="center" justify="stretch">
          <LeaveCalendar />
        </Flex>
      </Flex>
      <Flex gap={8}>
        <LeavePreview />
      </Flex>
    </Flex>
  );
}

"use client";

import { Select, Space, Spin, type SelectProps } from "antd";
const { Option } = Select;

import { useApplicationContext } from "@/app/_context/appContext";
import { useEffect } from "react";
import { getUsersListWithTeam } from "@/app/_components/header/_components/actions";

export default function TeamSelect({
  onChangeTeamUsers,
}: {
  onChangeTeamUsers: Function;
}) {
  const {
    state: {
      user: { role } = {},
      org: { visibility = "SELF" } = {},
      team: { teamId = "" } = {},
      orgId,
      teams,
    },
  } = useApplicationContext();

  const onChangeSelect: SelectProps["onChange"] = async (value) => {
    try {
      const fetchedUsers = await getUsersListWithTeam(value);
      onChangeTeamUsers(fetchedUsers || []);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    (async () => {
      try {
        if (teamId) {
          const fetchedUsers = await getUsersListWithTeam(teamId);
          onChangeTeamUsers(fetchedUsers || []);
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [teamId]);
  return (
    <Space size="middle">
      {!teamId || teams.length === 0 ? (
        <Spin />
      ) : (
        <Select
          onChange={onChangeSelect}
          style={{ minWidth: "150px" }}
          defaultValue={teamId}
          disabled={
            (visibility === "TEAM" || visibility === "SELF") &&
            (role === "MANAGER" || role === "USER")
              ? true
              : false
          }
          placeholder="Select Team"
        >
          {teams.length > 0
            ? teams.map((team) => {
                return (
                  <Option key={team.teamId} value={team.teamId}>
                    {team.name}
                  </Option>
                );
              })
            : null}
        </Select>
      )}
    </Space>
  );
}

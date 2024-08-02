"use client";

import { Select, type SelectProps } from "antd";
const { Option } = Select;

import { useApplicationContext } from "@/app/_context/appContext";

export default function TeamSelect({ changeTeam }: { changeTeam: Function }) {
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
      changeTeam(value === "all" ? undefined : value);
    } catch (error) {
      console.log(error);
    }
  };
  console.log(visibility, role);
  return (
    <Select
      onChange={onChangeSelect}
      style={{ minWidth: "100px" }}
      disabled={
        (visibility === "TEAM" || visibility === "SELF") &&
        (role === "MANAGER" || role === "USER")
          ? true
          : false
      }
      defaultValue={role === "OWNER" ? "all" : teamId}
      placeholder="Select Team"
    >
      <Option value="all">All Teams</Option>
      {teams.length === 1
        ? teams.map((team) => {
            return (
              <Option key={team.teamId} value={team.teamId}>
                {team.name}
              </Option>
            );
          })
        : null}
    </Select>
  );
}

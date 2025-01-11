"use client";

import { Select, Space, Typography, type SelectProps } from "antd";
const { Option } = Select;

import { useApplicationContext } from "@/app/_context/appContext";
import { useEffect } from "react";

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
    console.log("vlaue", value);
    try {
      changeTeam(value === "all" ? undefined : value);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Space size="middle">
      <Select
        onChange={onChangeSelect}
        style={{ minWidth: "150px" }}
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
    </Space>
  );
}

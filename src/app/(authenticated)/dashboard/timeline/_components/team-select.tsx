"use client";

import { forwardRef, useImperativeHandle } from "react";
import { Select, Space, Spin, type SelectProps } from "antd";
const { Option } = Select;

import { useApplicationContext } from "@/app/_context/appContext";
import { getUser, getUsersListWithTeam } from "../_actions";
import useSWR from "swr";

// Forward ref to expose mutate function to the parent
const TeamSelect = forwardRef(
  ({ onChangeTeamUsers }: { onChangeTeamUsers: Function }, ref) => {
    const {
      state: {
        role,
        org: { visibility = "SELF" } = {},
        team: { teamId = "" } = {},
        orgId,
        teams,
        userId,
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

    const fetchUsers = async (
      teamId: string,
      userId: string,
      role: string,
      visibility: string
    ) => {
      if (!teamId) return []; // Return an empty array if no teamId is provided

      if (role === "USER" && visibility === "SELF") {
        return await getUser(teamId, userId);
      } else {
        return await getUsersListWithTeam(teamId);
      }
    };

    const { data: users, error, isLoading, mutate } = useSWR(
      teamId ? [teamId, userId, role, visibility] : null,
      ([teamId, userId, role, visibility]) =>
        fetchUsers(teamId, userId, role, visibility),
      {
        onSuccess: (data) => {
          if (data) {
            onChangeTeamUsers(data);
          }
        },
      }
    );

    // Expose mutate function to parent using useImperativeHandle
    useImperativeHandle(ref, () => ({
      triggerMutate: () => {
        mutate();
      },
    }));

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
);

TeamSelect.displayName = "TeamSelect";

export default TeamSelect;

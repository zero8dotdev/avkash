"use client";

import { fetchTeamMembers } from "@/app/_actions";
// import { fetchTeamMembers } from "@/app/_actions/client-action";
import { useApplicationContext } from "@/app/_context/appContext";
import { List, Select } from "antd";
import { useState } from "react";

const UserList = ({ users }: { users: any[] }) => {
  const { state: appState } = useApplicationContext();
  const { teams } = appState;
  const [members, setMembers] =
    useState<Array<{ userId: string; name: string }>>();
  const [loading, setLoading] = useState(false);

  const teamChangeHandler = async (teamId: string) => {
    setLoading(true);
    const members = await fetchTeamMembers(teamId);
    setMembers(members);
    setLoading(false);
  };

  return (
    <>
      <Select
        placeholder="Select team"
        style={{ width: "100px" }}
        onChange={teamChangeHandler}
      >
        {teams.map(({ teamId, name }) => (
          <Select.Option key={teamId} value={teamId}>
            {name}
          </Select.Option>
        ))}
      </Select>
      <List
        loading={loading}
        dataSource={members}
        bordered
        renderItem={(user) => {
          return (
            <List.Item>
              <List.Item.Meta title={user.name}></List.Item.Meta>
            </List.Item>
          );
        }}
      />
      ;
    </>
  );
};

export default UserList;

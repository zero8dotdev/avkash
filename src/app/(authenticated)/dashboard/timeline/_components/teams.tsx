"use client";

import { fetchTeam, fetchTeamMembers } from "@/app/_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import { Avatar, Card, List } from "antd";
import { useState, useEffect } from "react";

type User = {
  name: string;
};

const TeamMembers = ({ teamId, name }: { teamId: string; name: string }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    (async () => {
      const users = await fetchTeamMembers(teamId);
      setUsers(users as User[]);
      setLoading(false);
    })();
  }, [teamId]);

  return (
    <Card
      style={{
        minWidth: "200px",
        width: "100%",
        margin: 0,
        padding: 0,
        marginBottom: "8px",
      }}
      title={name}
      loading={loading}
      styles={{
        body: {
          margin: "4px",
          padding: "4px",
        },
      }}
      size="small"
    >
      <List
        dataSource={users}
        style={{ margin: 0, padding: 0 }}
        locale={{ emptyText: "0 members." }}
        renderItem={(user, index) => (
          <List.Item
            style={{
              margin: 0,
              padding: "4px",
            }}
            key={index}
          >
            <List.Item.Meta
              avatar={<Avatar size="small" />}
              title={user.name}
            ></List.Item.Meta>
          </List.Item>
        )}
      ></List>
    </Card>
  );
};

export default function Teams({
  selectedTeam,
}: {
  selectedTeam: string | undefined;
}) {
  const {
    state: { teams },
  } = useApplicationContext();
  const [team, setTeam] = useState();

  useEffect(() => {
    if (!selectedTeam) {
      setTeam(undefined);
      return;
    }

    (async () => {
      const _team = await fetchTeam(selectedTeam);
      setTeam(_team);
    })();
  }, [selectedTeam]);

  return (
    <List
      dataSource={team ? [team] : teams}
      locale={{ emptyText: "" }}
      renderItem={(team, index) => {
        return (
          <List.Item
            key={team.teamId}
            style={{ padding: "0px", margin: "0px" }}
          >
            <TeamMembers {...team} />
          </List.Item>
        );
      }}
    ></List>
  );
}

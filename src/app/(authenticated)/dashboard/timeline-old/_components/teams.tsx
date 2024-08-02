"use client";
import { Card, Flex, List, Typography } from "antd";
import { useEffect, useState } from "react";
import { createClient } from "@/app/_utils/supabase/client";

// Initialize Supabase client
const supabase = createClient();

// Define Teams component
const Teams = ({ team, role, visibility }: any) => {
  const { teamid, name } = team;
  const [users, setUsers] = useState<any[]>([]);
  const userId = "b44487bb-824c-4777-a983-eeb88fe16de5";
  useEffect(() => {
    const fetchUsers = async () => {
      let data, error;

      if (visibility === "ORG" || visibility === "TEAM") {
        // Fetch users of this specific team for manager
        const result = await supabase.rpc("get_users_by_team_id", {
          id: teamid,
        });
        data = result.data;
        error = result.error;
      } else {
        if (role === "OWNER" || role === "MANAGER") {
          const result = await supabase.rpc("get_users_by_team_id", {
            id: teamid,
          });
          data = result.data;

          error = result.error;
        } else {
          const result = await supabase.rpc("get_user_data_by_id", {
            id: userId,
          });
          data = result.data;

          error = result.error;
        }
      }
      if (data && !error) {
        setUsers(data);
      } else {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [teamid, role, visibility]);

  return (
    <Card title={name} bodyStyle={{ padding: "0px" }}>
      <List
        dataSource={users}
        renderItem={(i) => (
          <List.Item style={{ paddingLeft: "10px" }}>{i.name}</List.Item>
        )}
      />
    </Card>
  );
};

export default Teams;

"use client";
import { Card, Flex, List, Typography } from "antd";
import { useEffect, useState } from "react";
import { createClient } from "@/app/_utils/supabase/client";
import { getUserDataBasedOnUUID, getUsersList } from "@/app/_components/header/_components/actions";

// Initialize Supabase client
const supabase = createClient();

// Define Teams component
const Teams = ({ team, role, visibility }: any) => {
  const { teamId, name } = team;
  const [users, setUsers] = useState<any[]>([]);
  const userId = "ec96fe6c-2f8f-4073-9838-b93c68766379";


  useEffect(() => {
    (async () => {
      let data, error;

      if (visibility === "ORG" || visibility === "TEAM") {
        // Fetch users of this specific team for manager
        const result = await getUsersList("teamId",teamId)
          data = result;
      } else {
        if (role === "OWNER" || role === "MANAGER") {
          const result = await getUsersList("teamId",teamId)
          data = result;

        } else {
          const result =  await getUserDataBasedOnUUID(userId)
          data = result;
        }
      }
      if (data && !error) {
        setUsers(data);
      } else {
        console.error("Error fetching users:", error);
      }
    })()
    
  }, [teamId, role, visibility]);



  return (
    <Card title={name} bodyStyle={{ padding: "0px" }} >
      <List
        dataSource={users}
        renderItem={(i) => <List.Item style={{paddingLeft:'10px'}}>{i.name}</List.Item>}
      />
    </Card>
  );
};

export default Teams;

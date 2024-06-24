"use client";
import { Flex, Typography } from "antd";
import { useEffect, useState } from "react";
import { createClient } from "@/app/_utils/supabase/client";

// Initialize Supabase client
const supabase = createClient();

// Define Teams component
const Teams = ({ team, role, visibility }: any) => {
  const { teamId, name } = team;
  const [users, setUsers] = useState<any[]>([]);
  const userId = "fea6db2f-7ffe-4c1b-be18-0ee41da20cf1";
  useEffect(() => {
    // const fetchUsers = async () => {
    //   let data, error;

    //   if (visibility === "ORG" || visibility === "TEAM") {

    //       // Fetch users of this specific team for manager
    //       const result = await supabase.rpc("get_users_by_team_id", {
    //         id: teamid,
    //       });
    //       data = result.data;
    //       error = result.error;
    //   } else {

    //     if  (role === "OWNER" || role === "MANAGER") {
    //       const result = await supabase.rpc("get_users_by_team_id", {
    //         id: teamid,
    //       });
    //       data = result.data;

    //       error = result.error;
    //     }else{
    //     const result = await supabase.rpc("get_user_data_by_id", {
    //       id: userId,
    //     });
    //     data = result.data;

    //     error = result.error;
    //   }
    // }
    //   if (data && !error) {
    //     setUsers(data);
    //   } else {
    //     console.error("Error fetching users:", error);
    //   }
    // };
  //   const fetchUsers = async () => {
  //     try {
  //       let data, error;
    
  //       if (visibility === "ORG" || visibility === "TEAM") {
  //         // Fetch users of this specific team for manager
  //         const { data: result, error: rpcError } = await supabase
  //           .from("User")
  //           .select(
  //             `
  //             userId,
  //             name,
  //             email,
  //             teamId,
  //             team.name as teamName,
  //             role,
  //             createdOn,
  //             createdBy,
  //             updatedBy,
  //             updatedOn,
  //             accruedLeave,
  //             usedLeave,
  //             keyword,
  //             orgId
  //           `
  //           )
  //           .eq("teamId", teamId)
  //           .join("Team", { alias: "team", using: "teamId" });
    
  //         data = result;
  //         error = rpcError;
  //       } else {
  //         if (role === "OWNER" || role === "MANAGER") {
  //           const { data: result, error: rpcError } = await supabase
  //             .from("User")
  //             .select(
  //               `
  //               userId,
  //               name,
  //               email,
  //               teamId,
  //               team.name as teamName,
  //               role,
  //               createdOn,
  //               createdBy,
  //               updatedBy,
  //               updatedOn,
  //               accruedLeave,
  //               usedLeave,
  //               keyword,
  //               orgId
  //             `
  //             )
  //             .eq("teamId", teamId)
  //             .join("Team", { alias: "team", using: "teamId" });
    
  //           data = result;
  //           error = rpcError;
  //         } else {
  //           const { data: result, error: rpcError } = await supabase
  //             .from("User")
  //             .select(
  //               `
  //               userId,
  //               name,
  //               email,
  //               teamId,
  //               role,
  //               createdOn,
  //               createdBy,
  //               updatedBy,
  //               updatedOn,
  //               accruedLeave,
  //               usedLeave,
  //               keyword,
  //               orgId
  //             `
  //             )
  //             .eq("userId", userId);
    
  //           data = result;
  //           error = rpcError;
  //         }
  //       }
    
  //       if (data && !error) {
  //         setUsers(data);
  //       } else {
  //         console.error("Error fetching users:", error);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching users:", error);
  //     }
  //   };

  //   fetchUsers();
  // }, [teamId, role, visibility]);
  const fetchUsers = async () => {
    try {
      let data, error;
  
      if (visibility === "ORG" || visibility === "TEAM") {
        // Fetch users of this specific team for manager
        const { data: result, error: rpcError } = await supabase
          .from("User")
          .select(
            `
            userId,
            name,
            email,
            teamId,
            role,
            createdOn,
            createdBy,
            updatedBy,
            updatedOn,
            accruedLeave,
            usedLeave,
            keyword,
            orgId
          `
          )
          .eq("teamId", teamId);
  
        data = result;
        error = rpcError;
      } else {
        if (role === "OWNER" || role === "MANAGER") {
          const { data: result, error: rpcError } = await supabase
            .from("User")
            .select(
              `
              userId,
              name,
              email,
              teamId,
              role,
              createdOn,
              createdBy,
              updatedBy,
              updatedOn,
              accruedLeave,
              usedLeave,
              keyword,
              orgId
            `
            )
            .eq("teamId", teamId);
  
          data = result;
          error = rpcError;
        } else {
          const { data: result, error: rpcError } = await supabase
            .from("User")
            .select(
              `
              userId,
              name,
              email,
              teamId,
              role,
              createdOn,
              createdBy,
              updatedBy,
              updatedOn,
              accruedLeave,
              usedLeave,
              keyword,
              orgId
            `
            )
            .eq("userId", userId);
  
          data = result;
          error = rpcError;
        }
      }
  
      if (data && !error) {
        setUsers(data);
      } else {
        console.error("Error fetching users:", error);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  
  fetchUsers();
  // fetchUsers();
}, [teamId, role, visibility]);
  
  return (
    <Flex vertical>
      <div
        style={{
          border: "1px solid #afb0a9",
          borderRadius: "5px",
          textAlign: "center",
        }}
      >
        <Typography.Title level={5} style={{ marginTop: "2px" }}>
          {name}
        </Typography.Title>
      </div>
      {users.map((user: any) => (
        <div
          key={user.userId}
          style={{
            border: "1px solid #afb0a9",
            borderRadius: "5px",
            padding: "5px",
          }}
        >
          {user.name}
        </div>
      ))}
    </Flex>
  );
};

export default Teams;

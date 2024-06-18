"use client"

import { createClient } from "@/app/_utils/supabase/client";
import { Flex, Typography } from "antd";
import { useEffect, useState } from "react";
const supabase = createClient()


const Teams = ({ team}: any) => {
  const {teamid,name}=team
  const [users,setUsers]=useState<any[]>([])
   useEffect(()=>{
    const fetchUsers = async () => {
    const { data, error } = await supabase
      .rpc('get_users_by_team_id', {"id":teamid });
    if (error) {
      console.error('Error invoking function:', error);
    } else {
      setUsers(data)
    }
  };
     fetchUsers()
   },[teamid])
    return (
      <Flex vertical>
        <div style={{ border:'1px solid #afb0a9',borderRadius:'5px',textAlign:"center"}}><Typography.Title level={5} style={{marginTop:'2px'}}>{name}</Typography.Title></div>
        {users.map((e: any) => {
          return (
            <div key={e.userid} style={{ border:'1px solid #afb0a9',borderRadius:'5px',padding:'5px'}}>
              {e.name}
            </div>
          );
        })}
      </Flex>
    );
  };
export default Teams
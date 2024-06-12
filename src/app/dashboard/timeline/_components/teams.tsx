"use client"
import { createClient } from "@supabase/supabase-js";
import { Flex, Typography } from "antd";
import { useEffect, useState } from "react";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const Teams = ({ team}: any) => {
  const {teamId,name}=team
  const [users,setUsers]=useState<any[]>([])
   useEffect(()=>{
     const fetchUsers=async()=>{
       try{
         const {data}=await supabase
         .from("User")
         .select("*")
         .eq("teamId",teamId)
         if(data){
          
          setUsers(data)
         }
       }catch{}
     }
     fetchUsers()
   },[teamId])
    return (
      <Flex vertical>
        <div style={{ border:'1px solid #afb0a9',borderRadius:'5px',textAlign:"center"}}><Typography.Title level={5} style={{marginTop:'2px'}}>{name}</Typography.Title></div>
        {users.map((e: any) => {
          return (
            <div key={e.userId} style={{ border:'1px solid #afb0a9',borderRadius:'5px',padding:'5px'}}>
              {e.name}
            </div>
          );
        })}
      </Flex>
    );
  };
export default Teams
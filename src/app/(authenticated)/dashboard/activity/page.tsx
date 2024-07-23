"use client";

import React, { useEffect, useState } from "react";
import { Timeline } from "antd";

import { createClient } from "@/app/_utils/supabase/client";

const supabase = createClient();

let data: any;

const App: React.FC = () => {
  const [activityLog, setActivityLog] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      // if (session?.user.id) {
      //   const { data, error } = await supabase
      //     .from("User")
      //     .select("*")
      //     .eq("user_id", "ab4cd0fd-82c1-4da9-9a00-380b460ef0a6");
      //   if (error) {
      //     console.log(error);
      //   }
      //   console.log(data);
      //   // ab4cd0fd-82c1-4da9-9a00-380b460ef0a6
      // }
    })();
  });

  // useEffect(() => {
  //   async function fetchActivityLog() {
  //     try {
  //       const { data: org_activity_log, error } = await supabase
  //         .from("org_activity_log")
  //         .select("*")
  //         .or(`team_id.eq.${teamId},user_id.eq.${userId},org_id.eq.${orgId}`)
  //         .order("changed_on", { ascending: true });

  //       if (error) {
  //         throw new Error(error.message);
  //       }

  //       if (org_activity_log) {
  //         setActivityLog(org_activity_log);
  //       }
  //     } catch (error: any) {
  //       console.error("Error fetching activity log:", error.message);
  //     }
  //   }

  //   fetchActivityLog();
  // }, []);

  return (
    <>
      <Timeline
        items={activityLog.map((each: any) => ({
          color: each.color,
          children: (
            <div>
              {each.keyword === "invitation" && (
                <p>You are Invited to {each.new_values.team_id}</p>
              )}
              {each.keyword === "leave update" && (
                <p>
                  {" "}
                  {each.new_values.updated_by} has {each.new_values.is_approved}{" "}
                  your {each.new_values.leave_type} leave from{" "}
                  {each.new_values.start_date} to {each.new_values.end_date}
                </p>
              )}
              {each.keyword === "leave request" && (
                <p>
                  You applied for {each.new_values.leave_type} leave from{" "}
                  {each.new_values.start_date} to {each.new_values.end_date}
                </p>
              )}
              {each.keyword === "accrual" && <p>Accrual Table</p>}
              {each.keyword === "change" && (
                <p>
                  Your {each.table_name} {each.changed_columns[0]} has changed
                  from {each.old_values.location} to {each.new_values.location}
                </p>
              )}
            </div>
          ),
        }))}
      />
    </>
  );
};

export default App;

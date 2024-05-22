"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from "@supabase/supabase-js";
import { Timeline } from 'antd';

const supabaseUrl = "https://iiqlttgnfgjnysnxogdj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcWx0dGduZmdqbnlzbnhvZ2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU2NjQ3ODUsImV4cCI6MjAzMTI0MDc4NX0.iTz-jFuz-lRYo4BVb41ni3IZkX_Zt5JfGsYfcg_7aJY";

const supabase = createClient(supabaseUrl, supabaseKey);
let data:any;
const userId = "7f831705-d92e-41cd-958c-aea9a6c9f1be"
const teamId = "c23f377e-6e55-4074-941d-e0ec3564299f"
const orgId = "a8743afc-4ee0-4cd0-8f7f-48cb62d6688a"

const App: React.FC = () => {
  const [activityLog, setActivityLog] = useState<any[]>([]);

  useEffect(() => {
    async function fetchActivityLog() {
      try {
        const { data: org_activity_log, error } = await supabase
          .from('org_activity_log')
          .select("*")
          .or(`team_id.eq.${teamId},user_id.eq.${userId},org_id.eq.${orgId}`).order('changed_on', { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        if (org_activity_log) {
          setActivityLog(org_activity_log);
        }
      } catch (error:any) {
        console.error("Error fetching activity log:", error.message);
      }
    }

    fetchActivityLog();
  }, []);

  return (
    <>
      <Timeline
        items={activityLog.map((each :any) => ({
          color: each.color,
          children: (
            <div>
              {each.keyword === 'invitation' && (
                <p>You are Invited to {each.new_values.team_id}</p>
              )}
              {each.keyword === 'leave update' && (
                <p> {each.new_values.updated_by} has {each.new_values.is_approved} your {each.new_values.leave_type} leave from {each.new_values.start_date} to {each.new_values.end_date}</p>
              )}
              {each.keyword === 'leave request' && (
                <p>You applied for {each.new_values.leave_type} leave from {each.new_values.start_date} to {each.new_values.end_date}</p>
              )}
              {each.keyword === 'accrual' && (
                <p>Accrual Table</p>
              )}
              {each.keyword === 'change' && (
                <p>Your {each.table_name} {each.changed_columns[0]} has changed from {each.old_values.location} to {each.new_values.location}</p>
              )}
            </div>
          )
        }))}
      />
    </>
  );
};

export default App;


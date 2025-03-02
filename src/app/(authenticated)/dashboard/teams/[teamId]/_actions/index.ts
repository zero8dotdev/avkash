'use server';

import { createAdminClient } from '@/app/_utils/supabase/adminClient';
import { createClient } from '@/app/_utils/supabase/server';
import { WebClient } from '@slack/web-api';

export const fetchTeamGeneralData = async (teamId: string) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('Team')
    .select('*')
    .eq('teamId', teamId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const updateTeamGeneralData = async (teamId: string, values: any) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('Team')
    .update({
      name: values.teamName,
      startOfWorkWeek: values.startOfWorkWeek,
      workweek: values.workweek,
      location: values.location,
      timeZone: values.timeZone,
    })
    .eq('teamId', teamId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const fetchLocations = async (orgId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('Organisation')
    .select('location')
    .eq('orgId', orgId)
    .single();

  if (error) {
    throw error;
  }
  return data;
};

export const fetchLeavePolicies = async (teamId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('LeavePolicy')
    .select(`*, leaveType:LeaveType(*)`)
    .eq('teamId', teamId);
  if (error) {
    throw error;
  }
  return data;
};

export const updatePolicyData = async (
  teamId: string,
  values: any,
  leavePolicyId: any
) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('LeavePolicy')
    .update({ ...values })
    .eq('teamId', teamId)
    .eq('leavePolicyId', leavePolicyId);
  if (error) {
    throw error;
  }
  return data;
};

export const updateTeamNotifications = async (teamId: string, values: any) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('Team')
    .update({ ...values })
    .eq('teamId', teamId);
  if (error) {
    throw error;
  }
  return data;
};

export const fetchTeamUsersData = async (teamId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('teamId', teamId);
  if (error) {
    throw error;
  }
  return data;
};

export const fetchTeamManagersData = async (teamId: string) => {
  const supabase = createClient();

  // Fetch team data to get the managers array
  const { data: teamData, error: teamError } = await supabase
    .from('Team') // Assuming the team table is named "Team"
    .select('managers') // Fetch only the "managers" field
    .eq('teamId', teamId)
    .single(); // Assuming teamId is unique, using `.single()` to fetch one record

  if (teamError) {
    throw teamError; // Handle errors while fetching team data
  }

  const managerIds = teamData.managers; // Extract the managers UUID array

  if (!managerIds || managerIds.length === 0) {
    return []; // If no managers are found, return an empty array
  }

  // Fetch users that match the UUIDs in the managers array
  const { data: users, error: userError } = await supabase
    .from('User') // Assuming the users table is named "User"
    .select('*')
    .in('userId', managerIds); // Fetch users whose "id" matches any UUID in the managers array

  if (userError) {
    throw userError; // Handle errors while fetching user data
  }

  return users; // Return the list of matching users
};

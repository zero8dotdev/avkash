'use server';

import { createClient } from "@/app/_utils/supabase/server";

/*
  Fetch the current logged in user
*/
export const fetchUser = async () => {
  try {
    const supabase = createClient();
    // TODO: figure out if we can skip this step.
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw error;
    }
    const { data: userProfile, error: userProfileError } = await supabase
      .from('User')
      .select()
      .eq('userId', user.id)
      .single();

    if (userProfileError || !userProfile) {
      throw userProfileError;
    }
    return userProfile;
  } catch (error) {
    console.log(error);
  }
};

/*
  Fetch the current logged in user's organisation
*/
export const fetchOrg = async (orgId: string) => {
  try {
    const supabase = createClient();

    const { data: organisation, error } = await supabase
      .from('Organisation')
      .select()
      .eq('orgId', orgId)
      .single();

    if (error || !organisation) {
      throw error;
    }

    return organisation;
  } catch (error) {
    console.log(error);
  }
};

/*
  Fetch the current logged in user's team
*/
export const fetchTeam = async (teamId: string) => {
  try {
    const supabase = createClient();

    const { data: team, error } = await supabase
      .from('Team')
      .select()
      .eq('teamId', teamId)
      .single();

    if (error || !team) {
      throw error;
    }
    return team;
  } catch (error) {
    console.log(error);
  }
};

/*
  Fetch the teams for based on current user's role and org visibility setting
*/
export const fetchAllTeams = async (orgId: string) => {
  try {
    const supabase = createClient();

    const { data: teams, error } = await supabase
      .from('Team')
      .select()
      .eq('orgId', orgId);

    if (error) {
      throw error;
    }

    return teams;
  } catch (error) {
    console.log(error);
  }
};

export const fetchTeamMembers = async (teamId: string) => {
  try {
    const supabase = createClient();
    const { data: teamMembers, error } = await supabase
      .from("User")
      .select()
      .eq("teamId", teamId);

    if (error) {
      throw error;
    }

    return teamMembers;
  } catch (error) {
    console.log(error);
  }
};

export const updataOrgData = async (values: any, orgId: string) => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("Organisation")
    .update({
      ...values
    }).eq("orgId", orgId)
    .select()
  if (error) {
    throw error;
  }
  return data
}

export const fetchleaveTypes = async (orgId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("LeaveType")
    .select("name,leaveTypeId,color,isActive")
    .eq("orgId", orgId)

  if (error) {
    throw error;
  }
  return data

}
export const updateLeaveType = async (values: any, leaveTypeId: any) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("LeaveType")
    .update({ ...values })
    .eq("leaveTypeId", leaveTypeId)
    .select()
  if (error) {
    throw error;
  }
  return data
}
export const fetchTeamsData = async (orgId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("Team")
    .select(`*, User(*)`)
    .eq("orgId", orgId);

  if (error) {
    throw error;
  }

  const processedData = data.map(team => {
    const teamId = team.teamId
    const name = team.name;
    const status = team.isActive;
    const users = team.User.length;
    const manager = team.User.find((user: any) => user.role === 'MANAGER')?.name || 'No manager assigned';

    return {
      teamId,
      name,
      manager,
      users,
      status
    };
  });

  return processedData;
}
export const fetchPublicHolidays = async (countryCode: any) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("PublicHolidays")
    .select("*")
    .eq("iso", countryCode)
    .eq("year", 2024)

  if (error) {
    throw error;
  }

  return data
}
export const updateLeaveTypeBasedOnOrg = async (isActive: boolean, orgId: string, leaveTypeId: any) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("LeaveType")
    .update({ isActive: isActive })
    .eq("orgId", orgId)
    .eq('leaveTypeId', leaveTypeId)
    .select()
  if (error) {
    throw error;
  }
  return data

}

export const updateTeamData = async (isActive: boolean, teamId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("Team")
    .update({ isActive: isActive })
    .eq('teamId', teamId)
    .select()
  if (error) {
    throw error;
  }
  return data



}


export const fetchAllOrgUsers = async (orgId: string, withTeam: boolean) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("User")
    .select(`${withTeam ? '*, Team(*)' : '*'}`)
    .eq("orgId", orgId);
  if (error) {
    throw error;
  }
  return data
}

export const  insertNewLeaveType=async(values:any)=>{
  
  const supabase = createClient()
  const {data,error}=await supabase 
  .from("LeaveType")
  .insert(values)
  .select()
  if (error) {
    throw error;
  }
  return data
}
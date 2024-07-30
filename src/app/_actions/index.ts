'use server';

import { createClient } from "@/app/_utils/supabase/server";
import { createAdminClient } from "../_utils/supabase/adminClient";
import { WebClient } from "@slack/web-api";


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
  const supabase = createClient();

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
    .eq("orgId", orgId)
    .single();
  if (error) {
    throw error;
  }
  return data
}

export const insertNewLeaveType = async (values: any) => {

  const supabase = createClient()
  const { data, error } = await supabase
    .from("LeaveType")
    .insert(values)
    .select()
  if (error) {
    throw error;
  }
  return data
}

export const updateLeavePolicies = async (values: any, leaveTypeId: string, orgId: string) => {
  const supabase = createClient()

  const { data: isDataAvailable, error } = await supabase
    .from("LeavePolicy")
    .select("*")
    .eq('leaveTypeId', leaveTypeId)
    .eq('orgId', orgId)
  if (error) {
    console.log(error)
  }
  console.log(isDataAvailable)
  if (isDataAvailable === undefined || isDataAvailable?.length === 0 || isDataAvailable === null) {
    console.log("keshav")
    const { data, error } = await supabase
      .from("LeavePolicy")
      .insert({ ...values, leaveTypeId, orgId })
    if (error) {
      console.log(error)
    }
    return data


  } else {
    const { data, error } = await supabase
      .from("LeavePolicy")
      .update(values)
      .eq('leaveTypeId', leaveTypeId)
      .eq("orgId", orgId)

      .select("*")
    if (error) {
      console.log(error)
    }

    return data
  }
}

/* Sign Up process, takes care of creating org team and user */

export const signUpAction = async (values: any) => {
  const supabaseServerClient = createClient();
  const { data: { user: authUser }, error } = await supabaseServerClient.auth.getUser();

  if (!authUser) {
    throw new Error('Something went wrong!');
  };

  const { name, company_name, team_name, email } = values;
  const supabase = createAdminClient();

  try {
    // create one organisation
    const { data: org, error: orgError } = await supabase
      .from('Organisation')
      .insert({
        name: company_name,
        createdBy: authUser.id
      })
      .select('*')
      .single();

    if (orgError) {
      throw orgError;
    }

    // create a team with that orgId
    const { data: team, error: teamError } = await supabase
      .from("Team")
      .insert({ name: team_name, orgId: org.orgId, createdBy: authUser.id })
      .select()
      .single();

    if (teamError) {
      throw teamError;
    }

    // create a user as well
    const { data: user, error: userError } = await supabase
      .from("User")
      .insert({
        userId: authUser.id,
        name: name,
        email: email,
        teamId: team.teamId,
        role: 'OWNER',
        accruedLeave: {},
        usedLeave: {},
        orgId: org.orgId,
        createdBy: authUser.id
      })
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    return {
      org,
      team,
      user
    }
  } catch (error) {
    throw error;
  }
};

export const fetchAllUsersFromChatApp = async (orgId: string) => {
  try {
    const supabaseAdminClient = createAdminClient();

    const { data: organisation, error } = await supabaseAdminClient
      .from('Organisation')
      .select('*, OrgAccessData(slackAccessToken)')
      .eq('orgId', orgId)
      .single();


    const slackAccessToken = organisation['OrgAccessData'][0]['slackAccessToken'];
    const slackClient = new WebClient(slackAccessToken);

    const result = await slackClient.users.list({
      limit: 1000,
    })

    if (!result.ok) {
      throw new Error(`Error fetching users: ${result.error}`);
    }

    if (error) {
      throw error;
    }

    return result.members?.filter(({ is_bot, deleted, is_email_confirmed }) => !is_bot && !deleted && is_email_confirmed);
  } catch (error) {
    console.log(error);
  };
};
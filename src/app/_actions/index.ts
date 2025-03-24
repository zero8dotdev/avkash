'use server';

import { createClient } from '@/app/_utils/supabase/server';
import { WebClient } from '@slack/web-api';
import { createAdminClient } from '../_utils/supabase/adminClient';

/*
  Fetch the current logged in user
*/
export const fetchUser = async () => {
  try {
    const supabase = await createClient();
    // TODO: figure out if we can skip this step.
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

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
    const supabase = await createClient();

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
    const supabase = await createClient();

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
    const supabase = await createClient();

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

export const fetchLeaveTypes = async (
  teamId: string,
  userId: string,
  orgId: string
) => {
  try {
    const supabaseAdminClient = createAdminClient();

    const { data, error } = await supabaseAdminClient
      .from('LeavePolicy')
      .select(`*, LeaveType(*)`)
      .eq('teamId', teamId);

    if (error) {
      throw error;
    }
    const activeLeavePolicies = data.filter(
      (policy) => policy.isActive && policy.LeaveType.isActive
    );

    return activeLeavePolicies;
  } catch (error) {
    console.error(error);
  }
};

/* Sign Up process, takes care of creating org team and user */
export const signUpAction = async (values: any) => {
  const supabaseServerClient = await createClient();
  const {
    data: { user: authUser },
    error,
  } = await supabaseServerClient.auth.getUser();

  if (!authUser) {
    throw new Error('Something went wrong!');
  }

  const { name, team_name, email, slackUserId } = values;
  const supabaseAdminClient = createAdminClient();

  try {
    // create one organisation
    const { data: org, error: orgError } = await supabaseAdminClient
      .from('Organisation')
      .insert({
        ownerId: authUser.id,
        createdBy: authUser.id,
      })
      .select('*')
      .single();

    if (orgError) {
      throw orgError;
    }

    // create a team with that orgId
    const { data: team, error: teamError } = await supabaseAdminClient
      .from('Team')
      .insert({
        name: team_name,
        orgId: org.orgId,
        createdBy: authUser.id,
        managers: [authUser.id],
      })
      .select()
      .single();

    if (teamError) {
      throw teamError;
    }

    // create a user as well
    const { data: user, error: userError } = await supabaseAdminClient
      .from('User')
      .insert({
        userId: authUser.id,
        name,
        email,
        picture: authUser?.user_metadata.picture,
        teamId: team.teamId,
        slackId: slackUserId,
        accruedLeave: {},
        usedLeave: {},
        orgId: org.orgId,
        createdBy: authUser.id,
      })
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    return {
      org,
      team,
      user,
    };
  } catch (error) {
    throw error;
  }
};

export const getLeaves = async (idColumn: any, id: any) => {
  const supabase = createAdminClient();
  const { data: leaves, error: leaveError } = await supabase
    .from('Leave')
    .select(`*, User(*)`)
    .eq(`${idColumn}`, id);
  if (leaveError) {
    throw leaveError;
  }
  return leaves;
};

export const getUserRole = async (userId: any): Promise<string> => {
  try {
    const supabase = await createClient();

    // Fetch user, team, and organisation data
    const { data, error } = await supabase
      .from('User')
      .select(
        `
        userId,
        Organisation(*),
        Team(*)
      `
      )
      .eq('userId', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return 'Error';
    }

    // Get the single Organisation and Team data
    const organisation = data.Organisation as any; // Organisation should now be a single object
    const team = data.Team as any; // Team should now be a single object
    // Check if the Organisation exists and if user is the Owner
    if (organisation?.ownerId === userId) {
      return 'OWNER';
    }

    // Check if the Team exists and if user is a Manager for the specific team
    if (team?.managers?.includes(userId)) {
      return 'MANAGER';
    }

    // Default to "User" if no higher roles match
    return 'USER';
  } catch (error) {
    console.error('Unexpected error:', error);
    return 'Error';
  }
};

export const getUserVisibility = async (orgId: any) => {
  const supabase = createAdminClient();

  try {
    const { data: visibility, error: visibilityError } = await supabase
      .from('Organisation')
      .select('visibility')
      .eq('orgId', orgId)
      .single();

    if (visibilityError) {
      throw visibilityError;
    }
    return visibility.visibility;
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

    const slackAccessToken = organisation.OrgAccessData[0].slackAccessToken;
    const slackClient = new WebClient(slackAccessToken);

    const result = await slackClient.users.list({
      limit: 1000,
    });

    if (!result.ok) {
      throw new Error(`Error fetching users: ${result.error}`);
    }

    if (error) {
      throw error;
    }

    const users = result.members?.filter(
      ({ is_bot, deleted, is_email_confirmed }) =>
        !is_bot && !deleted && is_email_confirmed
    );

    const existedUsers = await supabaseAdminClient
      .from('User')
      .select('*')
      .eq('orgId', orgId);
    if (existedUsers.error) {
      throw existedUsers.error;
    }
    const existingUserEmails = new Set(
      existedUsers.data.map((user: any) => user.email)
    );

    // Filter out non-existing users by email
    const nonExistingUsers = users?.filter(
      (user: any) => !existingUserEmails.has(user.profile.email)
    );
    return nonExistingUsers;
  } catch (error) {
    console.log(error);
  }
};

export const isInitialSetupDone = async (orgId: string) => {
  const supabase = createAdminClient();
  const res = await supabase
    .from('Organisation')
    .select('isSetupCompleted')
    .eq('orgId', orgId)
    .single();

  return res.data;
};

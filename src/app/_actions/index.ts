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
    })
    .eq("orgId", orgId)
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
  const { color } = values

  const leaveTypeValues = { ...values, color: color.slice(1) }


  const { data, error } = await supabase
    .from("LeaveType")
    .update(leaveTypeValues)
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
  const { data: holidaysdata, error } = await supabase
    .from("PublicHolidays")
    .select("*")
    .eq("iso", countryCode)
    .eq("year", 2024)

  if (error) {
    throw error;
  }
  return holidaysdata
};

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
  if (isDataAvailable === undefined || isDataAvailable?.length === 0 || isDataAvailable === null) {
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

export const fetchLeaveTypes = async (orgId: string) => {
  try {
    const supabaseAdminClient = createAdminClient();

    const { data, error } = await supabaseAdminClient
      .from('LeaveType')
      .select('*')
      .eq('orgId', orgId);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(error);
  }
}

/* Sign Up process, takes care of creating org team and user */
export const signUpAction = async (values: any) => {
  const supabaseServerClient = createClient();
  const { data: { user: authUser }, error } = await supabaseServerClient.auth.getUser();

  if (!authUser) {
    throw new Error('Something went wrong!');
  };

  const { name, company_name, team_name, email, slackId } = values;
  const supabaseAdminClient = createAdminClient();

  try {
    // create one organisation
    const { data: org, error: orgError } = await supabaseAdminClient
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
    const { data: team, error: teamError } = await supabaseAdminClient
      .from("Team")
      .insert({ name: team_name, orgId: org.orgId, createdBy: authUser.id })
      .select()
      .single();

    if (teamError) {
      throw teamError;
    }

    // create a user as well
    const { data: user, error: userError } = await supabaseAdminClient
      .from("User")
      .insert({
        userId: authUser.id,
        name: name,
        email: email,
        teamId: team.teamId,
        role: 'OWNER',
        slackId,
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

    // create a leaveType for ORG
    const defaultLeaveTypes = [
      { name: 'Paid Time Off', isActive: true, color: '' },
      { name: 'Sick', isActive: true, color: '' },
      { name: 'Unpaid', isActive: false, color: '' }
    ];

    console.log(defaultLeaveTypes
      .map((leaveType: any) => ({
        ...leaveType,
        orgId: org.orgId,
        createdBy: authUser.id
      })));


    const { data: leaveTypes, error: leaveTypesError } = await supabaseAdminClient
      .from('LeaveType')
      .insert(defaultLeaveTypes
        .map((leaveType: any) => ({
          ...leaveType,
          orgId: org.orgId,
          createdBy: authUser.id
        })))
      .select('*');

    if (leaveTypesError) {
      throw leaveTypesError;
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



export const getLeaves = async (idColumn: any, id: any) => {
  const supabase = createAdminClient();
  const { data: leaves, error: leaveError } = await supabase
    .from("Leave").select(`*, User(*)`).eq(`${idColumn}`, id)
  if (leaveError) {
    throw leaveError;
  }
  return leaves
}


export const getUserRole = async (userId: any) => {
  const supabase = createAdminClient();

  try {
    const { data: role, error: roleError } = await supabase
      .from("User")
      .select("role")
      .eq("userId", userId)
      .single();

    if (roleError) {
      throw roleError;
    }
    return role.role;
  } catch (error) {
    throw error
  }
};

export const getUserVisibility = async (orgId: any) => {
  const supabase = createAdminClient();

  try {
    const { data: visibility, error: visibilityError } = await supabase
      .from("Organisation")
      .select("visibility")
      .eq("orgId", orgId)
      .single();

    if (visibilityError) {
      throw visibilityError;
    }
    return visibility.visibility;
  } catch (error) {
    throw error
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

    const users = result
    .members
    ?.filter(({
      is_bot,
      deleted,
      is_email_confirmed
    }) => !is_bot && !deleted && is_email_confirmed)
  
      const existedUsers = await supabaseAdminClient.from("User").select("*").eq("orgId",orgId)  
      if (existedUsers.error){
        throw existedUsers.error
      } 
      const existingUserEmails = new Set(existedUsers.data.map((user:any) => user.email));
  
      // Filter out non-existing users by email
      const nonExistingUsers = users?.filter((user:any) => !existingUserEmails.has(user.profile.email));
    return nonExistingUsers;
  } catch (error) {
    console.log(error);
  };
};

export const completeSetup = async (orgId: string, setupData: any) => {
  try {
    const {
      startOfWorkWeek,
      workweek,
      timeZone,
      leaveChange: notificationLeaveChanged,
      dailySummary: notificationDailySummary,
      weeklySummary: notificationWeeklySummary,
      sendNtf: notificationToWhom,
      leavePolicies,
      holidaysList,
      countryCode,
      users,
      teamId
    } = setupData;

    const supabaseServerClient = createClient();
    const { data: { user: currentUser }, error } = await supabaseServerClient.auth.getUser();

    const supabaseAdminClient = createAdminClient();

    const { data: organisation, error: orgError } = await supabaseAdminClient
      .from('Organisation')
      .update({
        startOfWorkWeek,
        workweek,
        notificationLeaveChanged,
        notificationDailySummary,
        notificationWeeklySummary,
        // notificationToWhom: Array.isArray(notificationToWhom) && notificationToWhom[0]
      })
      .eq('orgId', orgId)
      .select('*');

    if (orgError) {
      throw orgError;
    }

    // leavePolicies
    const { data: leavePoliciesData, error: leavePoliciesError } = await supabaseAdminClient
      .from('LeavePolicy')
      .insert(leavePolicies.map((policy: any) => ({ ...policy, orgId })))
      .select('*');

    if (leavePoliciesError) {
      throw leavePoliciesError;
    }

    // holidays
    const { data: holidaysData, error: holidaysError } = await supabaseAdminClient
      .from('Holiday')
      .insert(
        holidaysList
          .map(({
            name,
            isRecurring,
            isCustom,
            date
          }: any) => ({
            name,
            isRecurring,
            isCustom,
            orgId,
            date,
            createdBy: currentUser?.id,
            location: countryCode
          })))
      .select();

    if (holidaysError) {
      throw holidaysError;
    }


    let accruedLeave = leavePoliciesData
      .filter(({ isActive }) => isActive)
      .reduce((acc, leavePolicy) => {
        acc[leavePolicy.leaveTypeId] = { balance: leavePolicy.unlimited ? 'unlimited' : leavePolicy.maxLeaves }
        return acc;
      }, {});

    let usedLeave = leavePoliciesData
      .filter(({ isActive }) => isActive)
      .reduce((acc, leavePolicy) => {
        acc[leavePolicy.leaveTypeId] = { balance: leavePolicy.unlimited ? 'unlimited' : 0 }
        return acc;
      }, {});

    const acc = { loggedInUser: {}, users: [] };
    const { loggedInUser, users: restUsers } = users
      .reduce((acc: any, { slackId, name, email, isProrate }: any) => {
        if (slackId === currentUser?.user_metadata.sub) {
          acc.loggedInUser = {
            id: currentUser?.id,
            slackId,
            orgId,
            accruedLeave,
            usedLeave
          }
        } else {
          acc.users.push({
            slackId,
            name,
            email,
            orgId,
            accruedLeave,
            usedLeave,
            teamId,
            createdBy: currentUser?.id
          });
        }
        return acc;
      }, acc);


    const { data: userData, error: userError } = await supabaseAdminClient
      .from('User')
      .update({
        slackId: loggedInUser.slackId,
        accruedLeave: loggedInUser.accruedLeave,
        usedLeave: loggedInUser.usedLeave
      })
      .eq('userId', loggedInUser.id)
      .select();

    if (userError) {
      throw userError;
    }

    const { data: usersData, error: usersError } = await supabaseAdminClient
      .from('User')
      .insert(restUsers)
      .select('*');

    if (usersError) {
      throw usersError;
    }
    const result = await supabaseAdminClient.from('Organisation').update({"initialSetup": true })
    if (result.error){
      throw result.error
    }
    return true;

  } catch (error) {
    console.log(error);
    throw error
  }
};

export const updateHolidaysList = async (holidaysList: any, orgId: string, countryCode: any) => {
  const holidayData = holidaysList.map((e: any) => {
    return {
      name: e.name,
      date: e.date,
      isRecurring: e.isRecurring,
      isCustom: e.isCustom,
      location: countryCode,
      orgId: orgId
    }
  })
  const supabase = createClient()
  const { data: deleteData, error: deleteError } = await supabase
    .from("Holiday")
    .delete()
    .eq("orgId", orgId)
    .select()

  if (deleteData) {
    console.log(deleteError)

    const { data, error } = await supabase
      .from('Holiday')
      .insert(holidayData)
      .select()
    if (error) {
      console.log(error)
    }
    return data
  }
}

export const fetchTeamUsers = async (teamId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("User")
    .select("name")
    .eq("teamId", teamId)
  if (error) {
    console.log(error)
  }
  return data
}

export const fetchAllActivities = async (userId: string, teamId: string, orgId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("ActivityLog")
    .select("*")
    .or(`userId.eq.${userId},teamId.eq.${userId},teamId.eq.${orgId}`);
  if (error) {
    console.log(error)
  }
  return data
}

export const isSlackTokenExists = async (orgId: string) => {
  try {
    const serverClient = createClient();
    const { count, error } = await serverClient
      .from('OrgAccessData')
      .select('*', { count: 'exact', head: true })
      .eq('orgId', orgId)

    console.log('isSlackTokenExists');
    if (error) {
      throw error;
    }

    return !!count;
  } catch (error) {
    throw error;
  }
}


export const isInitialSetupDone = async (orgId: string) => {
  const supabase = createAdminClient();
  const res = await supabase.from("Organisation").select("initialSetup").eq("orgId", orgId).single()

  return res.data
}

export const fetchUserDetails=async(userId:string)=>{
  const supabase=createClient()
  const {data,error}=await supabase
  .from("User")
  .select("*")
  .eq('userId',userId)
  .single()
  if(error){
    console.log(error)
  }
  return data

}

export const createNewTeam=async(values:any,orgId:string)=>{
  const supabase=createClient()
  const {data:teamData,error}=await supabase
  .from("Team")
  .insert({...values})
  .select("*")
  if(error){
    console.log(error)
  }
  return teamData
  
}
export const addUsersToNewTeam=async(values:any,userId:any)=>{
   console.log(values)
  const supabase=createClient()
  const {data,error}=await supabase 
  .from("User")
  .update({teamId:values})
  .eq("userId",userId)
  if(error){
    console.log(error)
  }
  console.log(data)
  return data
}


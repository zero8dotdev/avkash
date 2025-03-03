'use server';

import { createClient } from '@/app/_utils/supabase/server';
import { createAdminClient } from '@/app/_utils/supabase/adminClient';

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

export async function getUsersListWithTeam(teamId: string) {
  const supabaseAdmin = createAdminClient();
  const { data: usersData, error: usersError } = await supabaseAdmin
    .from('User')
    .select(
      '*, Team(name), Leave(leaveId, leaveTypeId, startDate, endDate, duration, shift, isApproved, reason, managerComment, LeaveType(color))'
    )
    .eq('teamId', teamId);

  if (usersError) {
    console.error(usersError);
    return null;
  }

  return usersData;
}

export async function getUser(teamId: string, userId: string) {
  const supabaseAdmin = createAdminClient();
  const { data: usersData, error: usersError } = await supabaseAdmin
    .from('User')
    .select(
      '*, Team(name), Leave(leaveId, leaveTypeId, startDate, endDate, duration, shift, isApproved, reason, managerComment, LeaveType(color))'
    )
    .eq('teamId', teamId)
    .eq('userId', userId);

  if (usersError) {
    console.error(usersError);
    return null;
  }

  return usersData;
}

// export const insertLeave = async (values: any, orgId: any, teamId: any, userId: any) => {
//   const supabase = createClient();

//   // Prepare the data for insertion
//   const { data, error } = await supabase
//     .from('Leave')
//     .insert({
//       leaveTypeId: values?.type,
//       startDate: values?.startDate,
//       endDate: values?.endDate,
//       duration: values.duration,
//       shift: values.shift,
//       isApproved: values.isApproved || 'PENDING',  // Use value from form or default to 'PENDING'
//       userId: userId,
//       teamId: teamId,
//       orgId: orgId,
//       reason: values.reason,
//       managerComment: values.managerComment,
//     })
//     .single();

//   if (error) {
//     console.log(error);
//     throw new Error("Failed to insert leave.");
//   }

//   return data;
// };

export const insertLeave = async (
  values: any,
  orgId: any,
  teamId: any,
  userId: any
) => {
  const supabase = await createClient();

  // Prepare the data for insertion, now including shift and duration
  const { data, error } = await supabase
    .from('Leave')
    .insert({
      leaveTypeId: values.type,
      startDate: values.startDate,
      endDate: values.endDate,
      duration: values.duration || 'FULL_DAY', // 'FULL_DAY' or 'HALF_DAY'
      shift: values.shift || 'NONE', // 'MORNING', 'AFTERNOON', or 'NONE'
      isApproved: values.isApproved || 'PENDING', // Default to 'PENDING'
      userId,
      teamId,
      orgId,
      reason: values.reason,
      managerComment: values.managerComment,
    })
    .single();

  if (error) {
    console.log(error);
    throw new Error('Failed to insert leave.');
  }

  return data;
};

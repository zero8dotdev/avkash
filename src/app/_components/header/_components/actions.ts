

'use server'

import supabaseAdmin from "@/app/_utils/supabase/adminClient"
import { log } from "console"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function logoutAction() {
  revalidatePath('/', "layout")
  redirect('/')
}

export async function getUserData(slackId: any) {
  const { data: userData, error: userError } = await supabaseAdmin
    .from("User")
    .select('*')
    .eq("slackId", slackId)
    // [TODO]: we can use .single() supabase function, Where ever we are sure that
    // we are expecting a singular response.

  if (userData) {
    return userData
  } else {
    // [TODO] : Propogate this error to the top.
    return userError
  }
}

export async function applyLeave(leaveType: string, startDate: string, endDate: string, duration: string, isApproved: string, userId: string, teamId: string, reason: string, orgId: string) {
  const { data } = await supabaseAdmin
    .from("Leave")
    .insert({
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration,
      isApproved,
      userId,
      teamId,
      reason,
      orgId,
      shift: "NONE",
    })
    .select();
  if (data) {
    return data
  }

};

interface LeaveHistoryParams {
  userId?: string;
  teamId?: string;
}

export async function updateLeaveStatus(leaveId: string, allFields: any = {}) {

  let updateValue: any = allFields;
  // if(allFields){
  //   updateValue = allFields;
  // }else{
  //   updateValue = allFields;
  // }
  const { data, error } = await supabaseAdmin
    .from("Leave")
    .update(updateValue)
    .eq("leaveId", leaveId)
}

export async function getLeavesHistory({ userId, teamId }: LeaveHistoryParams) {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - 7);
  const { data, error } = await supabaseAdmin
    .from("Leave")
    .select(`*,User(slackId),Team(name)`)
    .or(`createdOn.gte.${daysAgo.toISOString()},isApproved.eq.PENDING`);


  if (error) {
    console.error('Error fetching leave history:', error);
    throw new Error('This feature is coming soon!!!');
  }

  const leaves = data ?? [];

  let filteredLeaves = leaves;
  if (userId) {
    filteredLeaves = filteredLeaves.filter(leave => leave.userId === userId);
  } else if (teamId) {
    filteredLeaves = filteredLeaves.filter(leave => leave.teamId === teamId);
  }

  // console.log("filteredLeaves",filteredLeaves);

  const pendingLeaves = filteredLeaves.filter(leave => leave.isApproved === 'PENDING');

  return { leaves: filteredLeaves, pending: pendingLeaves };
}

export async function getLeaveReports() {
  return 'this feature is coming soon!!!'

}

export async function getTeamsList(orgId: string) {
  const { data: teamsData, error: teamsError } = await supabaseAdmin
    .from("Team")
    .select('*')
    .eq('orgId', orgId)

  return teamsData

}

export async function getUsersList(teamId: string) {
  const { data: usersData, error: usersError } = await supabaseAdmin
    .from("User")
    .select('*')
    .eq('teamId', teamId)

  return usersData

}

export async function getLeaveDetails(leaveId: string) {
  const { data, error } = await supabaseAdmin
    .from("Leave").select("*,User(name,email,slackId),Team(name)").eq('leaveId', leaveId)
  return data
}

export async function getLeaveTypes(orgId: string) {
  const { data, error } = await supabaseAdmin
    .from("LeaveType")
    .select("leaveTypeId,name")
    .eq("orgId", orgId)
  return data
}

export async function getManagerIds() {
  const { data, error } = await supabaseAdmin
    .from("User")
    .select("*")
    .eq('role', "OWNER")
  return data
}
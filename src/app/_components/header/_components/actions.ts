
'use server'

import { createAdminClient } from "@/app/_utils/supabase/adminClient"
import { createClient } from "@/app/_utils/supabase/server";
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server";

interface LeaveHistoryParams {
  userId?: string;
  teamId?: string;
}

export async function logoutAction() {
  revalidatePath('/', "layout")
  redirect('/')
}

interface getUserDataProps {
  id: string;
  slackId?: string;
  googleId?: string;
}
const supabaseAdmin = createAdminClient();

export async function getUserData({ id, slackId, googleId }: getUserDataProps) {
  const supabaseAdmin = createAdminClient();
  const { data: userData, error: userError } = await supabaseAdmin
    .from("User")
    .select('*')
    .eq(`${slackId ? 'slackId' : 'googleId'}`, id)
    .single()

  if (userData) {
    return userData
  } else {
    return userError
  }
}

export async function getUserDataBasedOnUUID(userId: any) {
  const supabaseAdmin = createAdminClient();
  const { data: userData, error: userError } = await supabaseAdmin
    .from("User")
    .select('*')
    .eq("userId", userId)
    .single()

  if (userData) {
    return userData
  } else {
    // [TODO] : Propogate this error to the top.
    return userError
  }
}

export async function applyLeave(leaveType: string, startDate: string, endDate: string, duration: string, shift: string, isApproved: string, userId: string, teamId: string, reason: string, orgId: string) {

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
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
      shift,
    })
    .select();
  if (data) {
    console.log(data)
    return data
  } else {
    console.log(error);
  }

};

export async function updateLeaveStatus(leaveId: string, allFields: any = {}) {

  let updateValue: any = allFields;
  // if(allFields){
  //   updateValue = allFields;
  // }else{
  //   updateValue = allFields;
  // }
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("Leave")
    .update(updateValue)
    .eq("leaveId", leaveId)
}

export async function getLeavesHistory({ userId, teamId }: LeaveHistoryParams) {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - 7);
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("Leave")
    .select(`*,User(name,orgId,slackId),Team(name)`)
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


  const pendingLeaves = filteredLeaves.filter(leave => leave.isApproved === 'PENDING');

  return { leaves: filteredLeaves, pending: pendingLeaves };
}

export async function getLeavesHistory1({ days, userId, teamId }: { days: number, userId?: string, teamId?: string }) {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("Leave")
    .select(`*,User(name,orgId,slackId),Team(name)`)
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


  const pendingLeaves = filteredLeaves.filter(leave => leave.isApproved === 'PENDING');

  return { leaves: filteredLeaves, pending: pendingLeaves };
}


export async function getLeaveReports() {
  return 'this feature is coming soon!!!'

}

export async function getTeamsList(orgId: string) {
  const supabaseAdmin = createAdminClient();
  const { data: teamsData, error: teamsError } = await supabaseAdmin
    .from("Team")
    .select('*')
    .eq('orgId', orgId)

  return teamsData

}

export async function getUsersList(teamId: string) {
  const supabaseAdmin = createAdminClient();
  const { data: usersData, error: usersError } = await supabaseAdmin
    .from("User")
    .select('*')
    .eq('teamId', teamId)

  return usersData

}

export async function getLeaveDetails(leaveId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("Leave").select("*,User(name,email,slackId,accruedLeave,usedLeave),Team(name)").eq('leaveId', leaveId)
  return data
}

export async function getLeaveTypes(orgId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("LeaveType")
    .select("leaveTypeId,name,LeavePolicy(*)")
    .eq("orgId", orgId)

  return data
}

export async function getLeaveTypeDetails(leaveType: string, orgId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("LeaveType")
    .select("leaveTypeId,name,LeavePolicy(unlimited)")
    .eq("leaveTypeId", leaveType)
    .eq('orgId', orgId)
    .single()
  return data
}

export async function getManagerIds(orgId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("User")
    .select("*")
    .eq('role', "OWNER")
    .eq('orgId', orgId)
    .single()
  return data.slackId
}

export async function fetchOrgWorkWeek(orgId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("Organisation")
    .select("location,workweek")
    .eq('orgId', orgId)
    .single()
  return data
}

export async function fetchHolidays(startDate: string, endDate: string, location: string) {
  try {
    console.log(startDate);
    const start = new Date(startDate).toISOString().slice(0, 10);
    console.log(start)
    const end = new Date(endDate).toISOString().slice(0, 10);
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('Holiday')
      .select('*')
      .gte('date', start)
      .lte('date', end);

    if (error) {
      return null;
    }
    return data;
  } catch (error) {
    return null;
  }
}

export async function getSlackAccessToken(slackId: string) {
  const { data, error } = await supabaseAdmin
    .from("User")
    .select("orgId,Organisation(slackAccessToken)")
    .eq('slackId', slackId)
    .single()
  return data
}


export const addSubscriptionToOrg = async (orgId: string, subscriptionId: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('Organisation')
      .update({ subscriptionId: subscriptionId })
      .eq('orgId', orgId);

    if (error) {
      throw new Error(`Failed to add subscription ID to organisation: ${error.message}`);
    }
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const fetchInvoices = async (subscriptionId: any) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID!;
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch(`${process.env.RAZORPAY_URL}invoices?subscription_id=${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }
    const data = await response.json();
    return data
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId: any) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID!;
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch(`${process.env.RAZORPAY_URL}subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        cancel_at_cycle_end: 0
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }
    const data = await response.json();
    return data
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

export const getQuantity = async (orgId: string) => {
  const { data, error } = await supabaseAdmin
    .from("User")
    .select("userId", { count: "exact" })
    .eq("orgId", orgId);
  if (error) {
    console.log(error);
  }
  return data?.length;
};

export const insertData = async (res: any) => {
  try {
    const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = res
    const data = await supabaseAdmin.from("PaySubMap").insert({ "razorpayPaymentId": razorpay_payment_id, "razorpaySignature": razorpay_signature, "razorpaySubscriptionId": razorpay_subscription_id });
  } catch (error) {
    console.error("Error inserting data:", error);
  }
};

export const getSubDetails = async (subscriptionId: string) => {
  const { data, error } = await supabaseAdmin

    .from("Subscription")
    .select("*")
    .eq("id", subscriptionId)
    .single();
  if (error) {
    console.log(error);
  }
  return data;
}

export const contactUs = async({firstName,lastName,email,message,}:{firstName: string,lastName: string,email: string,message: string, recaptchaToken: string})=>{
  const {data,error} = await supabaseAdmin
        .from("ContactEmail")
        .insert({
          firstName,
          lastName,
          email,
          message,
        })
        .select();
    return data
}
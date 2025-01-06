"use server";

import { createClient } from "@/app/_utils/supabase/server";
import { createAdminClient } from "@/app/_utils/supabase/adminClient";
import { ConsoleSqlOutlined } from "@ant-design/icons";

export const updateteamsettings = async (teamId: any, setupData: any) => {
  const supabaseAdminClient = createAdminClient();
  const { startOfWorkWeek, workweek, timeZone } = setupData;

  const { data, error } = await supabaseAdminClient
    .from("Team")
    .update({
      startOfWorkWeek: startOfWorkWeek,
      workweek: workweek,
      timeZone: timeZone,
    })
    .eq("teamId", teamId)
    .select();
  if (error) throw error;
  return data;
};

export interface LeavePolicy {
  maxLeaves: number; // Maximum number of leaves allowed
  accruals?: boolean; // Whether leaves are accrued
  rollover?: boolean; // Whether unused leaves are rolled over
  autoApprove?: boolean; // Whether leave requests are auto-approved
  accrualFrequency?: "MONTHLY" | "YEARLY"; // Frequency of accruals
  accrueOn?: "START" | "END"; // When accruals happen in the period
  rollOverLimit?: string; // Maximum leaves that can be rolled over
  rollOverExpiry?: string; // Expiry date for rolled-over leaves
  createdBy?: string; // ID of the user who created the policy
  createdOn?: string; // Creation timestamp
  updatedBy?: string; // ID of the user who last updated the policy
  updatedOn?: string; // Last update timestamp
}

export const insertLeavePolicies = async (
  orgId: string,
  userId: string,
  teamId: string,
  leavePolicies: Record<string, LeavePolicy>
) => {
  const supabaseAdminClient = createAdminClient();

  // Fetch leave types for the given orgId
  const { data: leaveTypesData, error: leaveTypeError } =
    await supabaseAdminClient.from("LeaveType").select("*").eq("orgId", orgId);

  if (leaveTypeError) throw leaveTypeError;

  // Map leavePolicies with corresponding leaveTypeId
  const enrichedLeavePolicies = Object.entries(leavePolicies)
    .map(([leaveName, policy]) => {
      // Ensure policy is an object before spreading
      if (typeof policy !== "object" || policy === null) {
        console.warn(`Skipping invalid policy for leave name: ${leaveName}`);
        return null; // Skip this policy
      }

      // Find the leaveType by matching the name
      const matchedLeaveType = leaveTypesData.find(
        (leaveType: any) => leaveType.name === leaveName
      );

      if (!matchedLeaveType) {
        console.warn(`No leave type found for leave name: ${leaveName}`);
        return null; // Skip this policy as leave type is missing
      }

      let rollOverExpiry = policy.rollOverExpiry;
      if (rollOverExpiry) {
        const date = new Date(rollOverExpiry); // Convert to Date object
        rollOverExpiry = `${date.getMonth() + 1}/${date.getDate()}`; // Format as MM/DD
      }

      // Ensure maxLeaves is a number
      const maxLeaves = Number(policy.maxLeaves);
      if (isNaN(maxLeaves)) {
        console.warn(`Invalid maxLeaves value for ${leaveName}`);
        return null; // Skip this policy if maxLeaves is invalid
      }

      // Return the policy with added leaveTypeId
      return {
        ...policy,
        teamId,
        leaveTypeId: matchedLeaveType.leaveTypeId,
        createdBy: userId,
        createdOn: new Date().toISOString(),
        rollOverExpiry, // Use the formatted rollOverExpiry
      };
    })
    .filter((policy) => policy !== null);

  if (enrichedLeavePolicies.length === 0) {
    console.log("No valid leave policies to insert");
    return []; // Return empty if no valid policies
  }

  // Insert into LeavePolicy table
  const { data: leavePoliciesData, error: leavePoliciesError } =
    await supabaseAdminClient
      .from("LeavePolicy")
      .insert(enrichedLeavePolicies)
      .select("*");

  if (leavePoliciesError) throw leavePoliciesError;
  return leavePoliciesData;
};

export const updateLocation = async (
  id: any,
  location: any,
  type: "org" | "team"
) => {
  const supabaseAdminClient = createAdminClient();
  const table = type === "org" ? "Organisation" : "Team";
  const idField = type === "org" ? "orgId" : "teamId";

  const { data, error } = await supabaseAdminClient
    .from(table)
    .update({ location: location })
    .eq(idField, id)
    .select("*");

  if (error) throw error;
  return data;
};

// Insert Holidays
export const insertHolidays = async (
  orgId: any,
  holidaysList: any,
  currentUserId: any,
  countryCode: any
) => {
  const supabaseAdminClient = createAdminClient();

  const { data, error } = await supabaseAdminClient
    .from("Holiday")
    .insert(
      holidaysList.map(({ name, isRecurring, isCustom, date }: any) => ({
        name,
        isRecurring,
        isCustom,
        orgId,
        date,
        createdBy: currentUserId,
        location: countryCode,
      }))
    )
    .select("*");

  if (error) throw error;
  return data;
};

export const updateTeamNotificationsSettings = async (
  teamId: any,
  setupData: any
) => {
  const supabaseAdminClient = createAdminClient();
  const { leaveChanged, dailySummary, weeklySummary, sendntw } = setupData;
  const { data, error } = await supabaseAdminClient
    .from("Team")
    .update({
      notificationLeaveChanged: leaveChanged,
      notificationDailySummary: dailySummary,
      notificationWeeklySummary: weeklySummary,
      notificationToWhom: sendntw,
    })
    .eq("teamId", teamId)
    .select();
  if (error) throw error;
  return data;
};

export const fetchLeavePolicies = async (teamId: string) => {
  const supabaseAdminClient = createAdminClient();

  const { data, error } = await supabaseAdminClient
    .from("LeavePolicy")
    .select("*")
    .eq("teamId", teamId);

  if (error) throw error;
  return data;
};

// // Update or Insert Users
// export const insertUsers = async (
//   orgId: any,
//   users: any,
//   currentUserId: any,
//   teamId: any,
//   accruedLeave: any,
//   usedLeave: any
// ) => {
//   const supabaseAdminClient = createAdminClient();
//   console.log("users", users);
//   const loggedInUser = users.find((user: any) => user.userId === currentUserId);

//   const restUsers = users.filter((user: any) => user.userId !== currentUserId);

//   // Update logged-in user
//   if (loggedInUser) {
//     const { error } = await supabaseAdminClient
//       .from("User")
//       .update({
//         slackId: loggedInUser.slackId,
//         accruedLeave,
//         usedLeave,
//       })
//       .eq("userId", currentUserId)
//       .select();

//     if (error) throw error;
//   }

//   // Insert other users
//   const { data, error } = await supabaseAdminClient
//     .from("User")
//     .insert(
//       restUsers.map((user: any) => ({
//         ...user,
//         orgId,
//         teamId,
//         accruedLeave,
//         usedLeave,
//         createdBy: currentUserId,
//       }))
//     )
//     .select("*");

//   if (error) throw error;
//   return data;
// };
export const insertUsers = async (orgId: any, users: any) => {
  const supabaseAdminClient = createAdminClient();

  const { data, error } = await supabaseAdminClient
    .from("User")
    .insert(users)
    .select("*");

  if (error) throw error;
  return data;
};

// Mark Organisation Setup Complete
export const updateInitialsetupState = async (
  orgId: any,
  currentstatus: any
) => {
  const supabaseAdminClient = createAdminClient();

  const { data, error } = await supabaseAdminClient
    .from("Organisation")
    .update({ initialSetup: currentstatus })
    .eq("orgId", orgId)
    .select("*");

  if (error) throw error;
  return data;
};


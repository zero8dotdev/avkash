// 'use server';

// import { createClient } from "@/app/_utils/supabase/server";
// import { createAdminClient } from "@/app/_utils/supabase/adminClient";

// export const completeSetup = async (orgId: string, setupData: any) => {
//     try {
//       const {
//         startOfWorkWeek,
//         workweek,
//         timeZone,
//         leaveChange: notificationLeaveChanged,
//         dailySummary: notificationDailySummary,
//         weeklySummary: notificationWeeklySummary,
//         sendNtf: notificationToWhom,
//         leavePolicies,
//         holidaysList,
//         countryCode,
//         users,
//         teamId
//       } = setupData;

//       const supabaseServerClient = createClient();
//       const { data: { user: currentUser }, error } = await supabaseServerClient.auth.getUser();

//       const supabaseAdminClient = createAdminClient();

//       const { data: organisation, error: orgError } = await supabaseAdminClient
//         .from('Organisation')
//         .update({
//           startOfWorkWeek,
//           workweek,
//           notificationLeaveChanged,
//           notificationDailySummary,
//           notificationWeeklySummary,
//           // notificationToWhom: Array.isArray(notificationToWhom) && notificationToWhom[0]
//         })
//         .eq('orgId', orgId)
//         .select('*');

//       if (orgError) {
//         throw orgError;
//       }

//       // leavePolicies
//       const { data: leavePoliciesData, error: leavePoliciesError } = await supabaseAdminClient
//         .from('LeavePolicy')
//         .insert(leavePolicies.map((policy: any) => ({ ...policy, orgId })))
//         .select('*');

//       if (leavePoliciesError) {
//         throw leavePoliciesError;
//       }

//       // holidays
//       const { data: holidaysData, error: holidaysError } = await supabaseAdminClient
//         .from('Holiday')
//         .insert(
//           holidaysList
//             .map(({
//               name,
//               isRecurring,
//               isCustom,
//               date
//             }: any) => ({
//               name,
//               isRecurring,
//               isCustom,
//               orgId,
//               date,
//               createdBy: currentUser?.id,
//               location: countryCode
//             })))
//         .select();

//       if (holidaysError) {
//         throw holidaysError;
//       }

//       let accruedLeave = leavePoliciesData
//         .filter(({ isActive }) => isActive)
//         .reduce((acc, leavePolicy) => {
//           acc[leavePolicy.leaveTypeId] = { balance: leavePolicy.unlimited ? 'unlimited' : leavePolicy.maxLeaves }
//           return acc;
//         }, {});

//       let usedLeave = leavePoliciesData
//         .filter(({ isActive }) => isActive)
//         .reduce((acc, leavePolicy) => {
//           acc[leavePolicy.leaveTypeId] = { balance: leavePolicy.unlimited ? 'unlimited' : 0 }
//           return acc;
//         }, {});

//       const acc = { loggedInUser: {}, users: [] };
//       const { loggedInUser, users: restUsers } = users
//         .reduce((acc: any, { slackId, name, email, isProrate }: any) => {
//           if (slackId === currentUser?.user_metadata.sub) {
//             acc.loggedInUser = {
//               id: currentUser?.id,
//               slackId,
//               orgId,
//               accruedLeave,
//               usedLeave
//             }
//           } else {
//             acc.users.push({
//               slackId,
//               name,
//               email,
//               orgId,
//               accruedLeave,
//               usedLeave,
//               teamId,
//               createdBy: currentUser?.id
//             });
//           }
//           return acc;
//         }, acc);

//       const { data: userData, error: userError } = await supabaseAdminClient
//         .from('User')
//         .update({
//           slackId: loggedInUser.slackId,
//           accruedLeave: loggedInUser.accruedLeave,
//           usedLeave: loggedInUser.usedLeave
//         })
//         .eq('userId', loggedInUser.id)
//         .select();

//       if (userError) {
//         throw userError;
//       }

//       const { data: usersData, error: usersError } = await supabaseAdminClient
//         .from('User')
//         .insert(restUsers)
//         .select('*');

//       if (usersError) {
//         throw usersError;
//       }

//       const result = await supabaseAdminClient
//         .from('Organisation')
//         .update({ "initialSetup": true })
//         .eq('orgId', orgId)
//         .select();

//       if (result.error) {
//         throw result.error
//       }
//       return true;

//     } catch (error) {
//       console.log(error);
//       throw error
//     }
//   };

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

// Insert Leave Policies
// export const insertLeavePolicies = async (
//   orgId: any,
//   teamId: any,
//   leavePolicies: any
// ) => {
//   const supabaseAdminClient = createAdminClient();

//   // Fetch leave types for the given orgId
//   const { data: leaveTypesData, error: leaveTypeError } =
//     await supabaseAdminClient.from("LeaveType").select("*").eq("orgId", orgId);

//   if (leaveTypeError) throw leaveTypeError;

//   // Map leavePolicies with corresponding leaveTypeId
//   const enrichedLeavePolicies = Object.entries(leavePolicies).map(
//     ([leaveName, policy]) => {
//       // Find the leaveType by matching the name
//       const matchedLeaveType = leaveTypesData.find(
//         (leaveType: any) => leaveType.name === leaveName
//       );

//       if (!matchedLeaveType) {
//         throw new Error(`No leave type found for name: ${leaveName}`);
//       }

//       // Return the policy with added leaveTypeId
//       return {
//         ...policy,
//         teamId,
//         leaveTypeId: matchedLeaveType.leaveTypeId,
//       };
//     }
//   );

//   // Insert into LeavePolicy table
//   const { data: leavePoliciesData, error: leavePoliciesError } =
//     await supabaseAdminClient
//       .from("LeavePolicy")
//       .insert(enrichedLeavePolicies)
//       .select("*");

//   if (leavePoliciesError) throw leavePoliciesError;

//   return leavePoliciesData;
// };
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

// Update or Insert Users
export const insertUsers = async (
  orgId: any,
  users: any,
  currentUserId: any,
  teamId: any,
  accruedLeave: any,
  usedLeave: any
) => {
  const supabaseAdminClient = createAdminClient();
  console.log("users", users);
  // const loggedInUser = users.find((user: any) => user.userId === currentUserId);

  // const restUsers = users.filter((user: any) => user.userId !== currentUserId);

  // // Update logged-in user
  // if (loggedInUser) {
  //   const { error } = await supabaseAdminClient
  //     .from("User")
  //     .update({
  //       slackId: loggedInUser.slackId,
  //       accruedLeave,
  //       usedLeave,
  //     })
  //     .eq("userId", currentUserId)
  //     .select();

  //   if (error) throw error;
  // }

  // // Insert other users
  // const { data, error } = await supabaseAdminClient
  //   .from("User")
  //   .insert(
  //     restUsers.map((user: any) => ({
  //       ...user,
  //       orgId,
  //       teamId,
  //       accruedLeave,
  //       usedLeave,
  //       createdBy: currentUserId,
  //     }))
  //   )
  //   .select("*");

  // if (error) throw error;
  // return data;
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

// Complete Setup Orchestrator
export const completeSetup = async (orgId: any, setupData: any) => {
  try {
    const supabaseServerClient = createClient();
    const {
      data: { user: currentUser },
    } = await supabaseServerClient.auth.getUser();
    if (!currentUser) throw new Error("User not authenticated");

    const { leavePolicies, holidaysList, users, teamId, countryCode } =
      setupData;

    // Step 1: Update Organisation
    await updateteamsettings(teamId, setupData);

    // Step 2: Insert Leave Policies
    // const leavePoliciesData = await insertLeavePolicies(orgId, leavePolicies);

    // // Step 3: Insert Holidays
    // await insertHolidays(orgId, holidaysList, currentUser.id, countryCode);

    // const activePolicies = leavePoliciesData.filter(({ isActive }) => isActive);
    // const accruedLeave = activePolicies.reduce((acc, policy) => {
    //   acc[policy.leaveTypeId] = {
    //     balance: policy.unlimited ? "unlimited" : policy.maxLeaves,
    //   };
    //   return acc;
    // }, {});
    // const usedLeave = activePolicies.reduce((acc, policy) => {
    //   acc[policy.leaveTypeId] = { balance: policy.unlimited ? "unlimited" : 0 };
    //   return acc;
    // }, {});

    // await updateOrInsertUsers(
    //   orgId,
    //   users,
    //   currentUser.id,
    //   teamId,
    //   accruedLeave,
    //   usedLeave
    // );

    // Step 6: Mark Setup Complete
    // await markSetupComplete(orgId, currentstatus);

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// const leavePoliciesData = await insertLeavePolicies(orgId, leavePolicies);

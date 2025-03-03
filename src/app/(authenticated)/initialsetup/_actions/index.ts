"use server";

import { createClient } from "@/app/_utils/supabase/server";
import { createAdminClient } from "@/app/_utils/supabase/adminClient";

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
  rollOver?: boolean; // Whether unused leaves are rolled over
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
  leavePolicies: Record<string, LeavePolicy>,
) => {
  const supabaseAdminClient = createAdminClient();

  const deleteLeavePolicies = await supabaseAdminClient
    .from("LeavePolicy")
    .delete()
    .eq("teamId", teamId);

  if (deleteLeavePolicies.error) {
    throw new Error(
      `Error deleting leave policies: ${deleteLeavePolicies.error.message}`,
    );
  }

  // Delete all existing leave types and leave policies for the given orgId
  const deleteLeaveTypes = await supabaseAdminClient
    .from("LeaveType")
    .delete()
    .eq("orgId", orgId);

  if (deleteLeaveTypes.error) {
    throw new Error(
      `Error deleting leave types: ${deleteLeaveTypes.error.message}`,
    );
  }

  // Default leave types
  const defaultLeaveTypes = [
    { name: "Paid Time Off", isActive: true, color: "85a7de" },
    { name: "Sick", isActive: true, color: "d7a4ed" },
    { name: "Unpaid", isActive: false, color: "dbd1ce" },
  ];

  // Create default leave types
  const transformedLeaveTypes = defaultLeaveTypes.map((leaveType) => ({
    ...leaveType,
    orgId,
    createdBy: userId,
  }));

  const { data: leaveTypes, error: leaveTypesError } = await supabaseAdminClient
    .from("LeaveType")
    .insert(transformedLeaveTypes)
    .select("*");

  if (leaveTypesError) {
    throw new Error(`Error inserting leave types: ${leaveTypesError.message}`);
  }

  // Fetch newly created leave types for the given orgId
  const { data: leaveTypesData, error: leaveTypeError } =
    await supabaseAdminClient
      .from("LeaveType")
      .select("*")
      .eq("orgId", orgId);

  if (leaveTypeError) {
    throw new Error(`Error fetching leave types: ${leaveTypeError.message}`);
  }

  // Enrich leave policies with leaveTypeId
  const enrichedLeavePolicies = Object.entries(leavePolicies)
    .map(([leaveName, policy]) => {
      if (typeof policy !== "object" || policy === null) return null;

      const matchedLeaveType = leaveTypesData.find((lt: any) =>
        lt.name === leaveName
      );
      if (!matchedLeaveType) return null;

      const rollOverExpiry = policy?.rollOverExpiry
        ? new Date(policy.rollOverExpiry).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
        })
        : undefined;

      // const maxLeaves = Number(policy?.maxLeaves);
      // // if (isNaN(maxLeaves)) return null;
      const accruals = policy?.accruals || false;
      const rollOver = policy?.rollOver || false;
      return {
        ...policy,
        teamId,
        leaveTypeId: matchedLeaveType.leaveTypeId,
        createdBy: userId,
        createdOn: new Date().toISOString(),
        rollOverExpiry,
        accruals,
        rollOver,
      };
    })
    .filter(Boolean);

  if (enrichedLeavePolicies.length === 0) {
    console.log("No valid leave policies to insert");
    return [];
  }

  // Insert enriched leave policies
  const { data: leavePoliciesData, error: leavePoliciesError } =
    await supabaseAdminClient
      .from("LeavePolicy")
      .insert(enrichedLeavePolicies)
      .select("*");

  if (leavePoliciesError) {
    throw new Error(
      `Error inserting leave policies: ${leavePoliciesError.message}`,
    );
  }

  return leavePoliciesData;
};

export const updateLocation = async (
  id: any,
  location: any,
  type: "org" | "team",
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

export const insertHolidays = async (
  orgId: any,
  holidaysList: any,
  currentUserId: any,
  countryCode: any,
) => {
  const supabaseAdminClient = createAdminClient();

  // Delete all existing holidays for the given orgId and countryCode (location)
  const { error: deleteError } = await supabaseAdminClient
    .from("Holiday")
    .delete()
    .eq("orgId", orgId)
    .eq("location", countryCode);

  if (deleteError) {
    throw new Error(
      `Failed to delete existing holidays: ${deleteError.message}`,
    );
  }

  // Insert new holidays
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
      })),
    )
    .select("*");

  if (error) throw error;
  return data;
};

export const updateTeamNotificationsSettings = async (
  teamId: any,
  setupData: any,
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
  currentstatus: any,
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

// Mark Organisation Setup Complete
export const updateInitialsetupstatus = async (
  orgId: any,
  currentstatus: any,
) => {
  const supabaseAdminClient = createAdminClient();

  const { data, error } = await supabaseAdminClient
    .from("Organisation")
    .update({ isSetupCompleted: currentstatus })
    .eq("orgId", orgId)
    .select("*");

  if (error) throw error;
  return data;
};

export const getAvatarBackground = async (userId: any) => {
  // const colors = [
  //   "FFF5F5", // Light Misty Rose
  //   "F8FFF8", // Light Honeydew
  //   "F7F7FF", // Light Lavender
  //   "FFFAE5", // Light Lemon Chiffon
  //   "EDF7F3", // Light Pastel Mint
  //   "FFD8D5", // Light Coral
  //   "CAB7D4", // Light Amethyst
  //   "FFE4E8", // Light Rose Quartz
  //   "CBE9C8", // Light Greenery
  //   "DDEBF5", // Light Serenity Blue
  //   "FBFBFB", // Light White Smoke
  //   "E8E8E8", // Light Light Gray
  //   "E6E6E6", // Light Silver
  //   "BFBFBF", // Light Gray
  //   "A3A3A3", // Light Dark Slate Gray
  //   "C29A80", // Light Sienna
  //   "B98F7C", // Light Saddle Brown
  //   "F0DCC4", // Light Burly Wood
  //   "D9C2C2", // Light Rosy Brown
  //   "F7CFA9", // Light Sandy Brown
  // ];
  const darkColors = [
    "CC4A4A", // Dark Misty Rose
    "5DA45D", // Dark Honeydew
    "4646B5", // Dark Lavender
    "CC9C2B", // Dark Lemon Chiffon
    "337D6B", // Dark Pastel Mint
    "C7423D", // Dark Coral
    "7A4C89", // Dark Amethyst
    "C74F5D", // Dark Rose Quartz
    "4A8D45", // Dark Greenery
    "3A6FA5", // Dark Serenity Blue
    "4A4A4A", // Dark White Smoke
    "5C5C5C", // Dark Light Gray
    "666666", // Dark Silver
    "3D3D3D", // Dark Gray
    "262626", // Dark Dark Slate Gray
    "8B5035", // Dark Sienna
    "7A4535", // Dark Saddle Brown
    "B38E6D", // Dark Burly Wood
    "9D7A7A", // Dark Rosy Brown
    "B77C3F", // Dark Sandy Brown
  ];

  const index = userId.charCodeAt(0) % darkColors.length;
  return `https://api.dicebear.com/9.x/initials/svg?seed=${
    userId.split(" ")
      .join("+")
  }&radius=50&backgroundColor=${darkColors[index]}`;
};

export const updateUser = async (
  userId: any,
  accruedLeave: any,
  usedLeave: any,
) => {
  const supabaseAdminClient = createAdminClient();

  const { data, error } = await supabaseAdminClient
    .from("User")
    .update({ accruedLeave: accruedLeave, usedLeave: usedLeave })
    .eq("userId", userId)
    .select("*");

  if (error) throw error;
  return data;
};

export const fetchTeamGeneralData = async (teamId: any) => {
  const supabaseClient = await createClient();
  const { data, error } = await supabaseClient
    .from("Team")
    .select("*")
    .eq("teamId", teamId).single();

  if (error) throw error;
  return data;
};

export const fetchOrgLeavePolicyData = async (orgId: any) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("LeaveType")
    .select("*, LeavePolicy(*)")
    .eq("orgId", orgId);

  if (error) throw error;
  return data;
};

export const fetchHolidaysData = async (orgId: any, countryCode: any) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("Holiday")
    .select()
    .eq("orgId", orgId)
    .eq("location", countryCode);
  if (error) throw error;
  return data;
};

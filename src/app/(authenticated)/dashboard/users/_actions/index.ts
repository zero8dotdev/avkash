"use server";

import { createAdminClient } from "@/app/_utils/supabase/adminClient";
import { createClient } from "@/app/_utils/supabase/server";
import { WebClient } from "@slack/web-api";

export const fetchOrgTeamsData = async (orgId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("Team")
    .select("*")
    .eq("orgId", orgId)
    .select();
  if (error) {
    throw error;
  }
  return data;
};

export const fetchTeamUsersData = async (teamId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("User")
    .select("*")
    .eq("teamId", teamId)
    .select();
  if (error) {
    throw error;
  }
  return data;
};

export const fetchOrgUsersData = async (orgId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("User")
    .select("*")
    .eq("orgId", orgId)
    .select();
  if (error) {
    throw error;
  }
  return data;
};

export const getLeaveSummaryByUser = async (userId: string) => {
  const supabase = createClient();

  // Step 1: Get the user's organization ID and active leave types
  const { data: userOrgData, error: userOrgError } = await supabase
    .from("User")
    .select("orgId")
    .eq("userId", userId)
    .single();
  if (userOrgError || !userOrgData?.orgId) {
    console.error("Error fetching user organization:", userOrgError);
    return null;
  }

  const { orgId } = userOrgData;

  const { data: leaveTypes, error: leaveTypeError } = await supabase
    .from("LeaveType")
    .select(
      "leaveTypeId, name, isActive, color, LeavePolicy(maxLeaves, unlimited)"
    )
    .eq("orgId", orgId)
    .eq("isActive", true);

  if (leaveTypeError) {
    console.error("Error fetching active leave types:", leaveTypeError);
    return null;
  }

  // Step 2: Query the leave_summary view for the specific user
  const { data: leaveData, error: leaveError } = await supabase
    .from("leave_summary")
    .select("*")
    .eq("userId", userId);

  if (leaveError) {
    console.error("Error fetching leave summary:", leaveError);
    return null;
  }

  // Step 3: Combine data
  const result = leaveTypes.map((type) => {
    const takenCount = leaveData
      .filter(
        (leave) =>
          leave.leaveTypeId === type.leaveTypeId &&
          leave.isApproved === "APPROVED"
      )
      .reduce((sum, leave) => sum + leave.count, 0);

    const plannedCount = leaveData
      .filter(
        (leave) =>
          leave.leaveTypeId === type.leaveTypeId &&
          leave.isApproved === "PENDING"
      )
      .reduce((sum, leave) => sum + leave.count, 0);

    const totalLeaves = type.LeavePolicy?.[0]?.unlimited
      ? Infinity
      : type.LeavePolicy?.[0]?.maxLeaves || 0;

    return {
      key: type.leaveTypeId,
      leaveType: type.name,
      taken: takenCount || 0,
      planned: plannedCount || 0,
      total: totalLeaves,
      remaining:
        totalLeaves === Infinity
          ? "Unlimited"
          : Math.max(totalLeaves - takenCount, 0),
      available:
        totalLeaves === Infinity
          ? "Unlimited"
          : Math.max(totalLeaves - takenCount - plannedCount, 0),
    };
  });

  return result;
};

export const getLeaveSummaryByUserByPeriod = async (
  userId: string,
  year?: number,
  month?: number
) => {
  const supabase = createClient();

  // Step 1: Get the user's organization ID and active leave types
  const { data: userOrgData, error: userOrgError } = await supabase
    .from("User")
    .select("orgId")
    .eq("userId", userId)
    .single();

  if (userOrgError || !userOrgData?.orgId) {
    console.error("Error fetching user organization:", userOrgError);
    return null;
  }

  const { orgId } = userOrgData;

  const { data: leaveTypes, error: leaveTypeError } = await supabase
    .from("LeaveType")
    .select(
      "leaveTypeId, name, isActive, color, LeavePolicy(maxLeaves, unlimited)"
    )
    .eq("orgId", orgId)
    .eq("isActive", true);

  if (leaveTypeError) {
    console.error("Error fetching active leave types:", leaveTypeError);
    return null;
  }

  // Step 2: Build filters for year and month
  let query = supabase.from("leave_summary").select("*").eq("userId", userId);

  if (year) {
    query = query
      .gte("createdAt", `${year}-01-01`)
      .lte("createdAt", `${year}-12-31`);
  }

  if (month) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year!, month!, 0).toISOString().split("T")[0];
    query = query.gte("createdAt", startDate).lte("createdAt", endDate);
  }

  const { data: leaveData, error: leaveError } = await query;

  if (leaveError) {
    console.error("Error fetching leave summary:", leaveError);
    return null;
  }

  // Step 3: Combine data
  const result = leaveTypes.map((type) => {
    const takenCount = leaveData
      .filter(
        (leave) =>
          leave.leaveTypeId === type.leaveTypeId &&
          leave.isApproved === "APPROVED"
      )
      .reduce((sum, leave) => sum + leave.count, 0);

    const plannedCount = leaveData
      .filter(
        (leave) =>
          leave.leaveTypeId === type.leaveTypeId &&
          leave.isApproved === "PENDING"
      )
      .reduce((sum, leave) => sum + leave.count, 0);

    const totalLeaves = type.LeavePolicy?.[0]?.unlimited
      ? Infinity
      : type.LeavePolicy?.[0]?.maxLeaves || 0;

    return {
      key: type.leaveTypeId,
      leaveType: type.name,
      taken: takenCount || 0,
      planned: plannedCount || 0,
      total: totalLeaves,
      remaining:
        totalLeaves === Infinity
          ? "Unlimited"
          : Math.max(totalLeaves - takenCount, 0),
      available:
        totalLeaves === Infinity
          ? "Unlimited"
          : Math.max(totalLeaves - takenCount - plannedCount, 0),
    };
  });

  return result;
};

export const formatLeavesData = (rawData: any[]) => {
  return rawData.map((leave) => ({
    type: leave.LeaveType.name,
    startDate: leave.startDate,
    endDate: leave.endDate,
    leaveRequestNote: leave.reason || "",
    status: leave.isApproved.toLowerCase(),
    color: leave.LeaveType.color,
  }));
};

export const getLeaves = async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("Leave") // Selecting from the 'Leave' table
    .select(
      `
      *,
      LeaveType (
        leaveTypeId,
        name,
        isActive,
        color
      )
    `
    ) // Nested select to include the related LeaveType data
    .eq("userId", userId); // Filtering based on the userId

  if (error) {
    throw error; // Handling any error that may occur
  }
  const formattedLeaves = formatLeavesData(data);
  return formattedLeaves; // Returning the fetched data
};

export const getActivity = async (userId: string) => {
  const supabase = createClient();

  try {
    // Step 1: Fetch the user's teamId and orgId from the User table
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("teamId, orgId")
      .eq("userId", userId)
      .single();

    if (userError) {
      throw new Error(`Error fetching user data: ${userError.message}`);
    }

    if (!userData) {
      throw new Error("User not found");
    }

    const { teamId, orgId } = userData;

    // Step 2: Fetch activity logs for the user's teamId and orgId
    const { data: activityLogs, error: activityError } = await supabase
      .from("ActivityLog")
      .select("*")
      .or(`teamId.eq.${teamId},orgId.eq.${orgId}, userId.eq.${userId}`)
      .order("changedOn", { ascending: true }); // Order by "changedOn" ascending

    if (activityError) {
      throw new Error(`Error fetching activity logs: ${activityError.message}`);
    }

    return activityLogs;
  } catch (error) {
    console.error("Error in getActivity:", error);
    throw error;
  }
};

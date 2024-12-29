"use server";

import { createAdminClient } from "@/app/_utils/supabase/adminClient";
import { createClient } from "@/app/_utils/supabase/server";
import { WebClient } from "@slack/web-api";

export const updataOrgGeneralData = async (values: any, orgId: string) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("Organisation")
    .update({
      ...values,
    })
    .eq("orgId", orgId)
    .select();
  if (error) {
    throw error;
  }
  return data;
};

export const fetchOrgGeneralData = async (orgId: string) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("Organisation")
    .select("*")
    .eq("orgId", orgId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const fetchOrgleaveTypes = async (orgId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("LeaveType")
    .select("*")
    .eq("orgId", orgId);

  if (error) {
    throw error;
  }

  return data;
};

export const updateLeaveTypeBasedOnOrg = async (
  isActive: boolean,
  orgId: string,
  leaveTypeId: any
) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("LeaveType")
    .update({ isActive: isActive })
    .eq("orgId", orgId)
    .eq("leaveTypeId", leaveTypeId)
    .select();
  if (error) {
    throw error;
  }
  return data;
};

export const updateLeaveType = async (values: any, leaveTypeId: any) => {
  const supabase = createClient();
  const { color } = values;
  console.log("values", values);
  const leaveTypeValues = { ...values, color: color.slice(1) };

  const { data, error } = await supabase
    .from("LeaveType")
    .update(leaveTypeValues)
    .eq("leaveTypeId", leaveTypeId)
    .select();
  if (error) {
    throw error;
  }
  console.log("data", data);
  return data;
};



export const insertNewLeaveType = async (values: any) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("LeaveType")
    .insert(values)
    .select();
  if (error) {
    throw error;
  }
  return data;
};

export const fetchAllTeams = async (orgId: string) => {
  try {
    const supabase = createClient();

    const { data: teams, error } = await supabase
      .from("Team")
      .select()
      .eq("orgId", orgId);

    if (error) {
      throw error;
    }

    return teams;
  } catch (error) {
    console.log(error);
  }
};

export const fetchTeamUsers = async (teamId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("User")
    .select("name")
    .eq("teamId", teamId);
  if (error) {
    console.log(error);
  }
  return data;
};
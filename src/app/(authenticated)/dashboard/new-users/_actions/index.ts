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
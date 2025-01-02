"use server";

import { createAdminClient } from "@/app/_utils/supabase/adminClient";
import { createClient } from "@/app/_utils/supabase/server";
import { WebClient } from "@slack/web-api";

export const fetchTeamGeneralData = async (teamId: string) => {
    const supabase = createClient();
  
    const { data, error } = await supabase
      .from("Team")
      .select("*")
      .eq("teamId", teamId)
      .single();
    if (error) {
      throw error;
    }
    return data;
  };

  


  export const updateTeamGeneralData = async (teamId: string, values: any) => {
    const supabase = createClient();
  console.log("teamId", teamId);
    // const { data, error } = await supabase
    //   .from("Team")
    //   .select("*")
    //   .eq("teamId", teamId)
    //   .single();
    // if (error) {
    //   throw error;
    // }
    // return data;
  };

  export const fetchLocations = async (orgId: string) => {
    const supabase = createClient();
    console.log("orgId", orgId)
    const { data, error } = await supabase
    .from("Organisation")
    .select("location")
    .eq("orgId", orgId)
    .single();

    console.log("data", data);
  if (error) {
    throw error;
  }
  return data;
  };
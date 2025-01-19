import { createClient } from "@/app/_utils/supabase/client";

export const fetchTeamMembers = async (teamId: string) => {
  try {
    const supabase = createClient();

    const { data: teamMembers, error } = await supabase
      .from("User")
      .select()
      .eq("teamId", teamId);

    if (error) {
      throw error;
    }
    return teamMembers;
  } catch (error) {
    console.log(error);
  }
};


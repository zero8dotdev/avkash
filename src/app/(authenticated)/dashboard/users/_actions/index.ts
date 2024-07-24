import { createClient } from "@/app/_utils/supabase/server";

export const getUserDetails = async (userId: string) => {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("User")
      .select("*")
      .eq("userId", userId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.log(error);
  }
};
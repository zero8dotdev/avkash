import { createClient } from "@/app/_utils/supabase/server"

export const fetchUserComplex = async (userId: string) => {
  try {
    const serverClient = createClient();
    const { data, error } = await serverClient
      .from('User')
      .select('*, Organisation(*), Team(*)');

    if (error) {
      throw error;
    }

    console.log(data);
  } catch (error) {
    console.log(error);
  }
}
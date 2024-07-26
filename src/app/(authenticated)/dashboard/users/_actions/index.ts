import { createClient } from "@/app/_utils/supabase/server";

export const getUserDetails = async (userId: string) => {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("User")
      .select(`* ,Leave(*)`)
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

// export const  fetchUserActivities=async(userId:string,orgId:string,teamId:string)=>{
//   const supabase = createClient();
//   try {
//     const { data, error } = await supabase
//       .from("OrgActivityLog")
//       .select("*")
//       .eq("userId", userId)
//       .eq('teamId',teamId)
//       .eq("orgId",orgId)
//       if (error) {
//         throw error;
//       }
  
//       return data;
//   } catch (error) {
    
//   }
// }
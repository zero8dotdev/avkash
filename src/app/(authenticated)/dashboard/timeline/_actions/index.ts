"use server";

import { createClient } from "@/app/_utils/supabase/server";
import { WebClient } from "@slack/web-api";
import { createAdminClient } from "@/app/_utils/supabase/adminClient";
import { clear } from "console";
// export const getUserRole = async (
//     userId: string,
//     orgId: string,
//     teamId?: string
//   ): Promise<string> => {
//     try {
//       const supabase = createClient();

//       // Fetch user and related data
//       const { data, error } = await supabase
//         .from("User")
//         .select(`
//           userId,
//           Organisation(ownerId),
//           Team(managers)
//         `)
//         .eq("userId", userId)
//         .single();

//       if (error) {
//         console.error("Error fetching user role:", error);
//         return "Error";
//       }

//       console.log("Fetched data:", data);

//       // Check if the Organisation array has data and if user is the Owner
//       if (data.Organisation?.[0]?.ownerId === userId) {
//         return "Owner";
//       }

//       // Check if the Team array has data and if user is a Manager
//       if (data.Team?.[0]?.managers?.includes(userId)) {
//         return "Manager";
//       }

//       // Default to "User" if no higher roles match
//       return "User";
//     } catch (error) {
//       console.error("Unexpected error:", error);
//       return "Error";
//     }
//   };

// export const getUserRole = async (
//     userId: string,
//     teamId: string,
//     orgId: string
//   ): Promise<string> => {
//     try {
//       const supabase = createClient();

//       // Fetch user, team, and organisation data
//       const { data, error } = await supabase
//         .from("User")
//         .select(`
//           userId,
//           Organisation(*),
//           Team(*)
//         `)
//         .eq("userId", userId)
//         .single();

//       if (error) {
//         console.error("Error fetching user role:", error);
//         return "Error";
//       }

//       console.log("Fetched data:",data,
//         //  data?.Organisation?.ownerId, data.Team.managers
//         );

//       // Check if the Organisation array has data and if user is the Owner
//       if (data.Organisation.ownerId === userId) {
//         return "Owner";
//       }

//       // Check if the Team array has data and if user is a Manager for the specific team
//       if (data.Team?.managers?.includes(userId) && data.Team?.[0]?.teamId === teamId) {
//         return "Manager";
//       }

//       // Default to "User" if no higher roles match
//       return "User";
//     } catch (error) {
//       console.error("Unexpected error:", error);
//       return "Error";
//     }
//   };

export const getUserRole = async (userId: string): Promise<string> => {
  try {
    const supabase = createClient();

    // Fetch user, team, and organisation data
    const { data, error } = await supabase
      .from("User")
      .select(
        `
          userId,
          Organisation(*),
          Team(*)
        `
      )
      .eq("userId", userId)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      return "Error";
    }

    // Get the single Organisation and Team data
    const organisation = data.Organisation as any; // Organisation should now be a single object
    const team = data.Team as any; // Team should now be a single object

    // Check if the Organisation exists and if user is the Owner
    if (organisation?.ownerId === userId) {
      return "OWNER";
    }

    // Check if the Team exists and if user is a Manager for the specific team
    if (team?.managers?.includes(userId)) {
      return "MANAGER";
    }

    // Default to "User" if no higher roles match
    return "USER";
  } catch (error) {
    console.error("Unexpected error:", error);
    return "Error";
  }
};

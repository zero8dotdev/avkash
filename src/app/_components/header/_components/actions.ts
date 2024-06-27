'use server'

import { createClient as createAdminClient } from "@/app/_utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const supabaseAdmin = createAdminClient();

export async function logoutAction() {
  revalidatePath('/', "layout")
  redirect('/')
}

export async function getUserData(email: any) {
  const { data: userData, error: userError } = await supabaseAdmin
    .from("User")
    .select('*')
    .eq("email", 'gnani@zero8.dev')

  if (userData) {
    return userData
  } else {
    return userError
  }
}

export async function applyLeave(startDate: any, endDate: any, userId: any, teamId: any, orgId: any) {
  const { data } = await supabaseAdmin
    .from("Leave")
    .insert({
      leaveType: 'sick',
      isApproved: "PENDING",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      userId,
      teamId,
      orgId,
      reason: 'from slack chat app',
      duration: "FULL_DAY",
      shift: "NONE",
    })
    .select();
  if (data) {
    console.log('from aplyleave', data);
    return data
  }

}
import { createClient } from "@/app/_utils/supabase/server";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  let redirectPath: string | null = "/";
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get("code") || "";
  const state = searchParams.get("state") || "";

  if (!code) {
    redirectPath = "/error";
    return;
  }
  try {
    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        state,
        client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        grant_type: "authorization_code",
        redirect_uri:
          `${process.env.NEXT_PUBLIC_REDIRECT_URL}welcome/install-to-slack`
      }),
    });
    const res = await response.json();

    if(res.ok){
      const serverClient = createClient();
      const {
        data: { user: authUser },
        error: authError,
      } = await serverClient.auth.getUser();
  
      if (authError) {
        throw authError;
      }
      const { data: user, error: userError } = await serverClient
        .from("User")
        .select()
        .eq("userId", authUser?.id)
        .single();
  
      if (userError) {
        console.log(userError);
      }
  
      const { status, statusText,error } = await serverClient
        .from("OrgAccessData")
        .insert({
          orgId: user?.orgId,
          slackAccessToken: res?.access_token,
          ownerSlackId: res?.authed_user?.id,
        })
        .select();
  
        if (error){
          throw error
        }
  
      if (status === 201 && statusText === "Created") {
        redirectPath = "/initialsetup/settings";
      } else {
        redirectPath = "/error";
      }
    }
    else{
      redirectPath="/error"
    }
  } catch (error) {
    console.log(error)
    throw error;
  } finally {
    redirect(redirectPath);
  }
}

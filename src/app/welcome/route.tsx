import { redirect } from "next/navigation";
import { createClient } from "../_utils/supabase/server";
import { type NextRequest } from "next/server";
import { isInitialSetupDone } from "../_actions";

export async function GET(request: NextRequest) {
  let redirectPath: string | null = null;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    redirectPath = "/login";
    return;
  }

  const supabase = createClient();
  try {
    const { data: authUserSession, error: authError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      throw authError;
    }

    const {
      data: user,
      error: userError,
      count,
    } = await supabase
      .from("User")
      .select("*")
      .eq("userId", authUserSession.user.id);

    if (userError) {
      throw userError;
    }
    if (user.length === 0) {
      redirectPath = "/signup";
      return;
    }

    let isInitialSetupavailable = await isInitialSetupDone(user[0].orgId);
    if (!isInitialSetupavailable?.isSetupCompleted) {
      redirectPath = "/setup";
    } else {
      redirectPath = "/dashboard";
    }
  } catch (error) {
    redirectPath = "/error";
  } finally {
    redirect(redirectPath || "/");
  }
}

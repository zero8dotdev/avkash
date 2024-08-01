import { redirect } from "next/navigation";
import { createClient } from "../_utils/supabase/server";
import { type NextRequest } from "next/server";

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

    const { data: user, error } = await supabase
      .from("User")
      .select("*")
      .eq("userId", authUserSession.user.id)
      .single();

    if (!user) {
      redirectPath = "/signup";
      return;
    }

    redirectPath = "/dashboard";
  } catch (error) {
    redirectPath = "/error";
  } finally {
    redirect(redirectPath || "/");
  }
}

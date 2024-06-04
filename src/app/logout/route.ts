import { redirect } from "next/navigation";
import { createClient } from "../_utils/supabase/server";

export async function GET(request: Request, response: Response) {
  const supabase = createClient();

  await supabase.auth.signOut();

  return redirect('/');
};

import { NextApiRequest, NextApiResponse } from "next";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { createClient } from "@/app/_utils/supabase/server";

export async function GET(request: NextApiRequest, response: NextApiResponse) {
  const cookieStore = cookies();

  const supabase = createClient({});
}
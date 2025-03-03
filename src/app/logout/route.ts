import { redirect } from 'next/navigation';
import { createClient } from '@/app/_utils/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();

  await supabase.auth.signOut();

  return redirect('/');
}

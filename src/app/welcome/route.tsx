import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import { createClient } from '../_utils/supabase/server';
import { checkSlackOwnership } from '../_actions';

export async function GET(request: NextRequest) {
  let redirectPath: string | null = null;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    redirectPath = '/login';
    return;
  }

  const supabase = await createClient();
  try {
    const { data: authUserSession, error: authError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (authError) {
      throw authError;
    }
    const result = await checkSlackOwnership();
    // const redirectMap: Record<string, string> = {
    //   'initial-setup': '/initialsetup/settings',
    //   'add-to-slack': '/add-to-slack',
    //   signup: '/signup',
    //   'dashboard/timeline': '/dashboard/timeline',
    //   'you-are-not-admin': '/you-are-not-admin',
    //   'ask-for-invitation': '/ask-for-invitation',
    //   login: '/login',
    // };

    redirectPath = `/${result}`;
  } catch (error) {
    redirectPath = '/error';
  } finally {
    redirect(redirectPath || '/');
  }
}

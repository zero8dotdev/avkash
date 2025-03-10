import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import { createClient } from '../_utils/supabase/server';
import { isInitialSetupDone, fetchOwnerSlackId } from '../_actions';

async function checkSlackAdmin(
  slackId: string,
  slackAccessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://slack.com/api/users.info?user=${slackId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${slackAccessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error('Slack API error:', data.error);
      return false;
    }

    if (!data.user) {
      console.error('User not found');
      return false;
    }

    console.log('Slack User Data:', data.user);

    // Check if the user is an admin or owner
    return data.user.is_admin || data.user.is_owner;
  } catch (error) {
    console.error('Error fetching Slack user info:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  let redirectPath: string | null = null;
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get('code');
  console.log('code:', code);
  if (!code) {
    console.log('No code found, redirecting to login');
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

    const { data: user, error: userError } = await supabase
      .from('User')
      .select('userId, slackId, orgId')
      .eq('userId', authUserSession.user.id)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user:', userError);
      throw userError;
    }

    if (!user) {
      redirectPath = '/signup';
      return;
    }

    if (!user.orgId) {
      // User exists but has no orgId
      const { data: slackData, error: slackError } = await supabase
        .from('OrgAccessData')
        .select('slackAccessToken')
        .eq('ownerSlackId', user.slackId)
        .maybeSingle();

      console.log('slackData:', slackData);
      console.log('slackError:', slackError);
      if (slackError || !slackData?.slackAccessToken) {
        console.log('Slack access token not found , User is not the admin');
        redirectPath = '/you-are-not-admin';
      } else {
        // User is admin with no org , so create one
        redirectPath = '/setup';
      }
    } else {
      // User has orgId, redirect to timeline
      redirectPath = '/dashboard/timeline';
    }
  } catch (error) {
    console.error('Error in GET handler:', error);
  } finally {
    redirect(redirectPath || '/');
  }
}

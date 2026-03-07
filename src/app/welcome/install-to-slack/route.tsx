import { getUserAndOrgStatus } from '@/app/_actions';
import { createAdminClient } from '@/app/_utils/supabase/adminClient';
import { createClient } from '@/app/_utils/supabase/server';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  let redirectPath: string = '/';

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code') || '';
  const state = searchParams.get('state') || '';

  if (!code) {
    return redirect('/error');
  }

  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        state,
        client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_REDIRECT_URL}welcome/install-to-slack`,
      }),
    });

    const res = await response.json();
    // console.log(res, 'SLACKDATA');

    if (!res.ok) {
      redirectPath = '/error';
    } else {
      const slackUserId = res?.authed_user?.id;
      const botToken = res?.access_token;

      const userInfoRes = await fetch(
        `https://slack.com/api/users.info?user=${slackUserId}`,
        {
          headers: {
            Authorization: `Bearer ${botToken}`,
          },
        }
      );

      const userInfo = await userInfoRes.json();
      const isAdminOrOwner =
        userInfo?.user?.is_admin || userInfo?.user?.is_owner;

      const serverClient = await createClient();
      const adminClient = createAdminClient();
      if (!isAdminOrOwner) {
        // Update auth user metadata to false
        const { data: userData, error: userError } =
          await serverClient.auth.getUser();

        if (!userError && userData?.user) {
          const { user } = userData;

          const { error: updateError } =
            await adminClient.auth.admin.updateUserById(user.id, {
              user_metadata: {
                ...user.user_metadata,
                is_slack_admin: false,
              },
            });

          if (updateError) {
            console.error('Error updating user metadata:', updateError.message);
          }
        }

        const result = await getUserAndOrgStatus();
        console.log(result, 'RESULT');

        if (result === 'dashboard/timeline') {
          redirectPath = '/dashboard/timeline';
        } else if (result === 'you-are-not-admin') {
          redirectPath = '/you-are-not-admin';
        } else if (result === 'ask-for-invitation') {
          redirectPath = '/ask-for-invitation';
        }
      } else {
        const serverClient = await createClient();

        const { data, error: insertError } = await serverClient
          .from('OrgAccessData')
          .insert({
            slackAccessToken: botToken,
            ownerSlackId: slackUserId,
          })
          .select();

        if (!insertError && data) {
          const { data: userData, error: userError } =
            await serverClient.auth.getUser();

          if (!userError && userData?.user) {
            const { user } = userData;

            const { error: updateError } =
              await adminClient.auth.admin.updateUserById(user.id, {
                user_metadata: {
                  ...user.user_metadata,
                  is_slack_admin: true,
                },
              });

            if (updateError) {
              console.error(
                'Error updating user metadata:',
                updateError.message
              );
            }
          }

          // ✅ Redirect after success (admin case)
          redirectPath = '/signup';
        }
      }

      // You can now use redirectPath here for navigation logic
    }
  } catch (error) {
    console.error('OAuth Error:', error);
    redirectPath = '/error';
  }

  return redirect(redirectPath);
}

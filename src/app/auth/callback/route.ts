import { createAdminClient } from '@/app/_utils/supabase/adminClient';
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code') || '';
  const state = searchParams.get('state') || '';

  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code,
      state,
      client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      grant_type: 'authorization_code'
    })
  })

  const { bot_user_id, access_token } = await response.json();
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin
    .from('OrgAccessData')
    .insert({ ownerSlackId: bot_user_id, slackAccessToken: access_token })
    .select();

  if (error) {
    redirect('/error')
  }

  redirect('/signup')
}
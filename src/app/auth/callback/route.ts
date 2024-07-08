export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code') || '';
  const state = searchParams.get('state') || '';

  console.log({ state, code });
  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code,
      state,
      client_id: "6356258938273.7279987270326",
      client_secret: "191a051daa9b5c320f2038139af49bd0",
      redirect_uri: "https://flounder-wise-completely.ngrok-free.app/auth/callback",
      grant_type: 'authorization_code'
    })
  })

  const slackResponse = await response.json();

  console.log(slackResponse);
  return Response.json({ name: 'Asshutosh Tripathi' });
}
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type BodyProps = { [key: string]: any };

export default async function getBodyAndSlackId(request: NextRequest): Promise<any> {
  const headersList = headers();
  const contentType = headersList.get('content-type');

  let body: BodyProps = {};
  let currentUserSlackId: string = '';
  try {
    if (contentType === 'application/json') {
      body = await request.json();
      if (body.type === 'url_verification') {
        return new NextResponse(JSON.stringify({ challenge: body.challenge }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      currentUserSlackId = body.event.user;
    }else if (contentType === 'application/x-www-form-urlencoded') {
      const params = new URLSearchParams(await request.text());
      body = Object.fromEntries(params.entries());
      currentUserSlackId = JSON.parse(body.payload).user.id;

    }
    return [body, currentUserSlackId];
  } catch (error) {
    return new NextResponse('Invalid request body', { status: 400 });
  }
}
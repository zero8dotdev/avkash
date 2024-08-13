import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type BodyProps = { [key: string]: any };

export default async function getBodyAndSlackId(request: NextRequest): Promise<any> {
  const headersList = headers();
  const contentType = headersList.get('content-type');

  let body: any = {};
  let currentUserSlackId: string = '';
  let appId = '';
  // try {
  if (contentType === 'application/json') {
    body = await request.text();
    body = JSON.parse(body)
    console.log(body);
    
    // appId = body.api_app_id
    // if (body.type === 'url_verification') {
    //   const res = JSON.stringify({ challenge: body.challenge })
    //   return NextResponse.json({ challenge: body.challenge }, {
    //     status: 200,
    //     headers: { 'Content-Type': 'application/json' }
    //   });
    // }
    // currentUserSlackId = body.event.user;
    //   } else if (contentType === 'application/x-www-form-urlencoded') {
    //     const params = new URLSearchParams(await request.text());
    //     body = Object.fromEntries(params.entries());
    //     appId = JSON.parse(body.payload).api_app_id  
    //     currentUserSlackId = JSON.parse(body.payload).user.id;

    //   }
    //   console.log('hi');

      return [body];
    // } catch (error) {
    //   return new NextResponse('Invalid request body', { status: 400 });
    // }
  }
}
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type bodyProps = {[key: string]: any}


export default async function getBodyAndSlackId(request: NextRequest): Promise<any> {
    const headersList = headers();
    const contentType = headersList.get('content-type');
  
    let body: bodyProps = {};
    let currentUserSlackId: string = '';
    try {
        if (contentType === 'application/x-www-form-urlencoded') {
          const params = new URLSearchParams(await request.text());
          body = Object.fromEntries(params.entries());
          currentUserSlackId = JSON.parse(body.payload).user.id;
        } else if (contentType === 'application/json') {
          body = await request.json();
          currentUserSlackId = body.event.user;
        }
        return [body,currentUserSlackId]
      } catch (error) {
        return new NextResponse('Invalid request body', { status: 400 });
      }
}
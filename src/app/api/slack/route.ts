import { NextRequest, NextResponse } from 'next/server';
import {
  applyLeave,
  getUserData,
  getTeamsList,
  getUsersList,
  getLeaveReports,
  getLeavesHistory,
  updateLeaveStatus,
  getLeaveDetails,
  getLeaveTypes,
  getManagerIds
} from '@/app/_components/header/_components/actions';
import getBodyAndSlackId from '../../_components/slack/getBodyAndSlackId';
import handleAppHomeOpened  from '../../_components/slack/handleAppHomeOpened';
import handlePayload from '@/app/_components/slack/payload/handlePayload';
import handleSlashCommand from '@/app/_components/slack/handleSlashCommand';
import handleBotIgnoreMessages from '@/app/_components/slack/handleBotIgnoreMessages';

export interface avkashUserInfoProps{
  userId: string,
  name: string,
  email: string,
  teamId: string,
  role: string
  createdOn: string,
  createdBy: string,
  updatedBy: string,
  updatedOn:string,
  accruedLeave: { 'Paid time off': string, sick: string },
  usedLeave: { 'Paid time off': string, sick: string },
  keyword: string,
  slackId: string,
  orgId: string,
  isOwner?: boolean,

}
let avkashUserInfo: avkashUserInfoProps;

export async function POST(request: NextRequest) {
  // fetching the body here from request
  const [body, currentUserSlackId] = await getBodyAndSlackId(request);
  console.log('new body gnani',body);
  avkashUserInfo = await getUserData(currentUserSlackId);
  avkashUserInfo['isOwner'] = avkashUserInfo.role === 'OWNER' ? true : false;

  /*
    [TODO]
    So from the slack, We are getting 4 kinds of interactions.
      Can we create 4 modules to handle these below types?
    1. Url Verification [Mostly done only once OR automatically]
    2. App home Opened
    3. Slack Command
    4. User type a message.
  */
  try {
    if (body.type === 'url_verification') {
      return handleUrlVerification(body);
    }
    if (body.event?.type == 'message') {
      return await handleBotIgnoreMessages(body.event);
    }

    if (body.event?.type === 'app_home_opened') {
      return await handleAppHomeOpened({avkashUserInfo, yourDashboard:false});
    }
    if (body.payload) {
      const payload = JSON.parse(body.payload);
      return await handlePayload(avkashUserInfo,payload);
    }

    if (body.command) {
      return handleSlashCommand(body.command);
    }
    // [TODO]: We can write a friendly message.
    return new NextResponse('Unrecognized request', { status: 400 });
  } catch (error) {
    // console.error('Error processing request:', error);
    // [TODO]: If our code execution comes to this point. Means error is at our end.
    // WE can make this message more friendly.
    return new NextResponse('An error occurred while processing your request.', { status: 500 });
  }
}

function handleUrlVerification(body: any) {
  return new NextResponse(JSON.stringify({ challenge: body.challenge }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}





import { NextRequest, NextResponse } from 'next/server';
import { getSlackAccessToken, getUserData } from '@/app/_components/header/_components/actions';
import getBodyAndSlackId from '../../_components/slack/getBodyAndSlackId';
import handleAppHomeOpened from '../../_components/slack/handleAppHomeOpened';
import handlePayload from '@/app/_components/slack/payload/handlePayload';
import handleSlashCommand from '@/app/_components/slack/handleSlashCommand';
import handleBotIgnoreMessages from '@/app/_components/slack/handleBotIgnoreMessages';

export interface avkashUserInfoProps {
  userId: string,
  name: string,
  email: string,
  teamId: string,
  role: string
  createdOn: string,
  createdBy: string,
  updatedBy: string,
  updatedOn: string,
  accruedLeave: { 'Paid time off': string, sick: string },
  usedLeave: { 'Paid time off': string, sick: string },
  keyword: string,
  slackId: string,
  orgId: string,
  isOwner?: boolean,
  isManager?: boolean,
  accessToken?: string,

}
let avkashUserInfo: avkashUserInfoProps;
let accessToken: any;

export async function POST(request: NextRequest) {
  console.time('request started');
  const [body, currentUserSlackId] = await getBodyAndSlackId(request);
  const [accessTokenData, userInfo] = await Promise.all([
    getSlackAccessToken(currentUserSlackId),
    getUserData({ id: currentUserSlackId, slackId: 'slackId' })
  ]);
  avkashUserInfo = userInfo;
  if (!accessTokenData || accessTokenData.length === 0) {
    console.log('just ignore it!!!!!!')
  } else {
    const slackAccessToken = accessTokenData[0]?.slackAccessToken;
    avkashUserInfo['accessToken'] = slackAccessToken;
  }
  avkashUserInfo['isOwner'] = avkashUserInfo.role === 'OWNER' ? true : false;
  avkashUserInfo['isManager'] = avkashUserInfo.role === 'MANAGER' ? true : false;
  accessToken = avkashUserInfo.accessToken;



  // fetching the body here from request

  // const [body, currentUserSlackId] = await getBodyAndSlackId(request);
  // const accessTokenData: any = await getSlackAccessToken(currentUserSlackId);
  // const slackAccessToken = accessTokenData[0]?.slackAccessToken;
  // avkashUserInfo = await getUserData({ id: currentUserSlackId, slackId: 'slackId' });
  // avkashUserInfo['isOwner'] = avkashUserInfo.role === 'OWNER' ? true : false;
  // avkashUserInfo['isManager'] = avkashUserInfo.role === 'MANAGER' ? true : false;
  // avkashUserInfo['accessToken'] = slackAccessToken;
  // accessToken = avkashUserInfo.accessToken;

  try {
    if (body.event?.type == 'message') {
      return await handleBotIgnoreMessages(avkashUserInfo, body.event);
    }

    if (body.event?.type === 'app_home_opened') {
  
      return await handleAppHomeOpened({ avkashUserInfo, yourDashboard: false });
    }
    if (body.payload) {
      const payload = JSON.parse(body.payload);
      return await handlePayload(avkashUserInfo, payload);
    }

    if (body.command) {
      return handleSlashCommand(body.command);
    }
    return new NextResponse('Unrecognized request', { status: 400 });
  } catch (error) {
    return new NextResponse('An error occurred while processing your request.', { status: 500 });
  }
}

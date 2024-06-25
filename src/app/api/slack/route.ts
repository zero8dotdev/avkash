import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import { createClient } from "@/app/_utils/supabase/server";
import { applyLeave, getUserData } from '@/app/_components/header/_components/actions';


const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);


export async function POST(request: NextRequest) {
  const headersList = headers();
  const contentType = headersList.get('content-type');

  let body: { [key: string]: any } = {};

  try {
    if (contentType === 'application/x-www-form-urlencoded') {
      const params = new URLSearchParams(await request.text());
      body = Object.fromEntries(params.entries());
    } else if (contentType === 'application/json') {
      body = await request.json();
    }
  } catch (error) {
    console.error('Error parsing request body:', error);
    return new NextResponse('Invalid request body', { status: 400 });
  }

  try {
    if (body.type === 'url_verification') {
      return handleUrlVerification(body);
    }

    if (body.payload) {
      const payload = JSON.parse(body.payload);
      return await handlePayload(payload);
    }

    if (body.event?.type === 'app_home_opened') {
      return await handleAppHomeOpened(body.event.user);
    }

    if (body.command) {
      return handleSlashCommand(body.command);
    }

    if (body.event?.type === 'message') {
      return await handleMessageEvent(body.event);
    }

    return new NextResponse('Unrecognized request', { status: 400 });
  } catch (error) {
    console.error('Error processing request:', error);
    return new NextResponse('An error occurred while processing your request.', { status: 500 });
  }
}

function handleUrlVerification(body: any) {
  return new NextResponse(JSON.stringify({ challenge: body.challenge }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}

async function handlePayload(payload: any) {
  const { type, container, user, view, trigger_id, actions } = payload;
  const view_id = container?.view_id;
  const channel_id = container?.channel_id;
  const user_id = user?.id;

  switch (type) {
    case 'view_submission':
      return handleViewSubmission(view, user_id);

    case 'block_actions':
      const action_id = actions?.[0]?.action_id;
      return handleAction(action_id, channel_id, user_id, view_id, trigger_id);

    default:
      return new NextResponse('Unrecognized payload type', { status: 400 });
  }
}

async function handleViewSubmission(view: any, user_id: string) {
  const supabase = createClient();

  const userInfo = await slackClient.users.info({ user: user_id });
  const userEmail = userInfo?.user?.profile?.email;
  const callback_id = view?.callback_id;
  const startDate = view?.state?.values?.start_date_block?.start_date?.selected_date;
  const endDate = view?.state?.values?.end_date_block?.end_date?.selected_date;

  console.log('ueremail:', userEmail);

  const userDetails: any = await getUserData(userEmail)
  const { userId, teamId, orgId } = userDetails[0];

  const abc = await applyLeave(startDate, endDate, userId, teamId, orgId)
  await slackClient.chat.postMessage({
    channel: user_id,
    text: `Your leave request from ${startDate} to ${endDate} has been successfully submitted.`,
  });

  return new NextResponse(null, { status: 200 });
}

async function handleAction(action_id: string, channel_id: string, user_id: string, view_id: string, trigger_id: string) {
  switch (action_id) {
    case 'msg-req-leave':
      return sendMessage(channel_id, 'You clicked on Request Leave', user_id, view_id);

    case 'msg-your-leaves':
      return sendMessage(channel_id, 'You clicked on Your Leaves', user_id, view_id);

    case 'msg-leave-reports':
      return sendMessage(channel_id, 'You clicked on Leave Reports', user_id, view_id);

    case 'home-req-leave':
      return openRequestLeaveModal(trigger_id, user_id);

    case 'submit_leave_request':
      return new NextResponse('Leave request submitted', { status: 200 });

    default:
      return new NextResponse('Unrecognized action', { status: 400 });
  }
}

async function sendMessage(channel_id: string, text: string, user_id: string, view_id: string) {
  await slackClient.chat.postMessage({ channel: channel_id, text });
  return new NextResponse(JSON.stringify({ text }), { headers: { 'Content-Type': 'application/json' }, status: 200 });
}

async function openRequestLeaveModal(trigger_id: string, user_id: string) {
  await slackClient.views.open({
    trigger_id,
    view: {
      type: 'modal',
      callback_id: 'home-req-leave',
      title: { type: 'plain_text', text: 'Request Leave' },
      submit: { type: 'plain_text', text: 'Submit', emoji: true },
      blocks: [
        {
          type: 'input',
          block_id: 'start_date_block',
          element: { type: 'datepicker', action_id: 'start_date', placeholder: { type: 'plain_text', text: 'Select a start date' } },
          label: { type: 'plain_text', text: 'Start Date' }
        },
        {
          type: 'input',
          block_id: 'end_date_block',
          element: { type: 'datepicker', action_id: 'end_date', placeholder: { type: 'plain_text', text: 'Select an end date' } },
          label: { type: 'plain_text', text: 'End Date' }
        }
      ]
    }
  });

  return new NextResponse('Modal opened', { status: 200 });
}

async function handleAppHomeOpened(user_id: string) {
  const view: any = {
    type: 'home',
    callback_id: 'home_view',
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `Welcome to your Home tab, <@${user_id}>!` } },
      { type: 'divider' },
      { type: 'section', text: { type: 'mrkdwn', text: 'Here you can add various interactive blocks, buttons, and more.' } },
      {
        type: 'actions',
        elements: [
          { type: 'button', text: { type: 'plain_text', text: 'Request Leave', emoji: true }, action_id: 'home-req-leave' },
          { type: 'button', text: { type: 'plain_text', text: 'Your Leaves', emoji: true }, action_id: 'home-your-leaves' },
          { type: 'button', text: { type: 'plain_text', text: 'Leave Report', emoji: true }, action_id: 'home-leave-report' }
        ]
      }
    ]
  };

  await slackClient.views.publish({ user_id, view });
  return new NextResponse('App home opened', { status: 200 });
}

async function handleMessageEvent(event: any) {
  const { user, text, channel, bot_id } = event;
  const isSlash = text[0] === '/';

  if (bot_id || isSlash) {
    return new NextResponse('Ignoring bot or slash command message', { status: 200 });
  }

  const userInfo = await slackClient.users.info({ user });
  const username = userInfo?.user?.name;
  const responseText = `Hey @${username}, see what you can do with the avkash!!!`;

  const blocks = [
    { type: 'section', text: { type: 'mrkdwn', text: responseText } },
    { type: 'divider' },
    {
      type: 'actions',
      elements: [
        { type: 'button', text: { type: 'plain_text', text: 'Request Leave', emoji: true }, value: 'req_leave', action_id: 'msg-req-leave' },
        { type: 'button', text: { type: 'plain_text', text: 'Your Leaves', emoji: true }, value: 'your_leaves', action_id: 'msg-your-leaves' },
        { type: 'button', text: { type: 'plain_text', text: 'Leave Report', emoji: true }, value: 'leave_report', action_id: 'msg-leave-reports' }
      ]
    }
  ];

  await slackClient.chat.postMessage({ channel, text: responseText, blocks });
  return new NextResponse('Message processed', { status: 200 });
}

function handleSlashCommand(command: string) {
  let responseText;
  switch (command) {
    case '/hi':
      responseText = 'Welcome to ZERO8.DEV !!!';
      break;
    default:
      responseText = 'You entered an unregistered slash command';
  }

  return new NextResponse(JSON.stringify({ response_type: 'in_channel', text: responseText }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}

import { log } from 'console';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import { createClient } from "@/app/_utils/supabase/server";
import { applyLeave, getUserData, getTeamsList, getUsersList, getLeaveReports, getLeavesHistory, updateLeaveStatus, getLeaveDetails, getLeaveTypes, getManagerIds } from '@/app/_components/header/_components/actions';
// [TODO]: alway remove unused imports.
import { act } from 'react';
import UserListItem from '@/app/dashboard/timeline/_components/UserListitem';
import { channel } from 'diagnostics_channel';

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
let avkash_userInfo: any = {};
let currentUserSlackId = '';
let isOwner: boolean = false;

export async function POST(request: NextRequest) {
  // [TODO] If TODO#1 is not possible, We can make this below code in a function. Which always return body.
  const headersList = headers();
  const contentType = headersList.get('content-type');

  let body: { [key: string]: any } = {};

  try {
    if (contentType === 'application/x-www-form-urlencoded') {
      const params = new URLSearchParams(await request.text());
      body = Object.fromEntries(params.entries());
      currentUserSlackId = JSON.parse(body.payload).user.id;
    } else if (contentType === 'application/json') {
      body = await request.json();
      currentUserSlackId = body.event.user;
    }
  } catch (error) {
    console.error('Error parsing request body:', error);
    return new NextResponse('Invalid request body', { status: 400 });
  }

  // [TODO]: Can be removed OR we can cofigure a logging library
  console.log('printing body:', body);

  avkash_userInfo = await getUserInfo(currentUserSlackId);
  // [TODO] we should have all the avkash mapping for that user.
  // Like, ROle, ORG, Manager

  if (avkash_userInfo) {
    // [TODO]: Let's use only camleCase So, `avkash_userInfo` becomes `avkashUserInfo`
    // avkashUserInfo can also have one property `isOwner` in the same object.

    isOwner = avkash_userInfo.role === 'OWNER' ? true : false;
  }

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

    if (body.event?.type === 'app_home_opened') {
      return await handleAppHomeOpened(body.event.user, isOwner, false);
    }

    if (body.payload) {
      const payload = JSON.parse(body.payload);
      return await handlePayload(payload);
    }

    if (body.command) {
      return handleSlashCommand(body.command);
    }

    if (body.event?.type == 'message') {
      return await handleBotIgnoreMessages(body.event);
    }

    // [TODO]: We can write a friendly message.
    return new NextResponse('Unrecognized request', { status: 400 });
  } catch (error) {
    console.error('Error processing request:', error);
    // [TODO]: If our code execution comes to this point. Means error is at our end.
    // WE can make this message more friendly.
    return new NextResponse('An error occurred while processing your request.', { status: 500 });
  }
}

async function createCommonModalBlocks(startDate?: string, endDate?: string, dayType?: any, leaveType?: string, notes?: string) {
  const leaveTypesList: any = await getLeaveTypes(avkash_userInfo.orgId);
  let initialLeaveType: any;
  const leaveTypes = leaveTypesList.map((leave: { leaveTypeId: String, name: string }) => {

    const res = {
      "text": {
        "type": "plain_text",
        "text": leave.name,
        "emoji": true
      },
      "value": leave.name
    };
    if (leaveType) {
      if (leaveType === leave.name) {
        initialLeaveType = res
      }
    }
    return res
  })

  return [
    {
      type: 'input',
      block_id: 'start_date_block',
      element: {
        type: 'datepicker',
        initial_date: startDate && startDate,
        action_id: 'start_date',
        placeholder: { type: 'plain_text', text: 'Select a start date' }
      },
      label: { type: 'plain_text', text: 'Start Date' }
    },
    {
      type: 'input',
      block_id: 'end_date_block',
      element: {
        type: 'datepicker',
        initial_date: endDate && endDate,
        action_id: 'end_date',
        placeholder: { type: 'plain_text', text: 'Select an end date' }
      },
      label: { type: 'plain_text', text: 'End Date' }
    },
    {
      type: 'input',
      block_id: 'day_type_block',
      element: {
        type: 'radio_buttons',
        action_id: 'day_type',
        options: [
          {
            text: { type: 'plain_text', text: 'Full Day' },
            value: 'full_day'
          },
          {
            text: { type: 'plain_text', text: 'Half Day' },
            value: 'half_day'
          },

        ],
        initial_option: dayType && dayType,
      },
      label: { type: 'plain_text', text: 'Day Type' }
    },
    {
      type: 'input',
      block_id: 'type_block',
      element: {
        type: 'static_select',
        action_id: 'type',
        placeholder: { type: 'plain_text', text: 'Select leave type' },
        options: leaveTypes,
        initial_option: initialLeaveType && initialLeaveType,
      },
      label: { type: 'plain_text', text: 'Leave Type' }
    },
    {
      type: 'input',
      block_id: 'notes_block',
      optional: true,
      element: {
        type: 'plain_text_input',
        initial_value: notes ? notes : '',
        action_id: 'notes',
        placeholder: { type: 'plain_text', text: 'Enter any notes' }
      },
      label: { type: 'plain_text', text: 'Notes' }
    }
  ]
}

// [TODO]: better name for param will be slackId
async function getUserInfo(userId: string) {
  const userDetails: any = await getUserData(userId);
  return userDetails[0];
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
      const selected_team_id = actions?.[0]?.selected_option?.value;


      if (action_id === 'select_team') {
        return openAddLeaveModal({ user_id, view_id, trigger_id, selected_team_id });
      } else if (action_id.startsWith('approve_leave_')) {
        return handleApproveReviewLeave(action_id, view);
      }

      return handleAction(action_id, channel_id, user_id, view_id, trigger_id);

    default:
      return new NextResponse('Unrecognized payload type', { status: 400 });
  }
}

async function getManagerId() {
  const res: any = await getManagerIds();
  return res[0].slackId;
}

async function handleViewSubmission(view: any, user_id: string) {
  const updates_channel_Id = 'C06GP1QCS0Y';
  const managerSlackId = await getManagerId();
  const startDate = view?.state?.values?.start_date_block?.start_date?.selected_date;
  const endDate = view?.state?.values?.end_date_block?.end_date?.selected_date;
  const duration_temp = view?.state?.values?.day_type_block?.day_type?.selected_option?.value;
  let duration = '';
  if (duration_temp == 'full_day') {
    duration = 'FULL_DAY';
  } else if (duration_temp == 'half_day' || duration_temp == 'half_day') {
    duration = 'HALF_DAY';
  }
  const leaveType = view?.state?.values?.type_block?.type?.selected_option?.value;
  const leaveReason = view?.state?.values?.notes_block?.notes?.value;
  const isApproved = 'PENDING';
  let text = '';
  let appliedUserId = '';
  let applyiedUserName = '';
  let applylingTeam = '';
  let channelId = '';
  const callback_id = view?.callback_id;
  if (callback_id == 'add-leave') {
    appliedUserId = view?.state?.values?.select_user_block?.select_user?.selected_option?.value;
    applyiedUserName = view?.state?.values?.select_user_block?.select_user?.selected_option?.text?.text;
    applylingTeam = view?.state?.values?.select_team_block?.select_team?.selected_option?.value;
    channelId = managerSlackId;
    text = `Leave apply for <@${appliedUserId}> from ${startDate} to ${endDate} has been successfully successfully`;
  } else if (callback_id.startsWith('review_leave_')) {
    const leaveId = callback_id.split("review_leave_")[1];
    const leaveDetails: any = await getLeaveDetails(leaveId);
    const appliedUserSlackId = leaveDetails[0].User.slackId;
    const isReviewApproved = view?.state?.values?.approve_reject_block?.approve_reject_type.selected_option?.value;
    const mngrNotes = view?.state?.values?.mngr_notes_block?.mngr_notes?.value;
    const msgForUser = `Hey <@${user_id}>! your leave from ${startDate} to ${endDate} has been ${isReviewApproved == 'approve' ? `Approved` : 'Rejected'}\n\nChek comments: ${mngrNotes}`;

    const allFields = { leaveType, startDate, endDate, duration, shift: 'NONE', isApproved: `${isReviewApproved === "approve" ? "APPROVED" : "REJECTED"}`, reason: leaveReason, managerComment: mngrNotes };

    await updateLeaveStatus(leaveId, allFields);
    await slackClient.chat.postMessage({ channel: appliedUserSlackId, text: msgForUser })
    await slackClient.chat.postMessage({ channel: managerSlackId, text: `Leaves applied for <@${appliedUserSlackId}> from ${leaveDetails[0].Team.name} from ${startDate} to ${endDate} has been ${isReviewApproved == 'approve' ? "Approved" : "Rejected"}` })
    if (isReviewApproved == 'approve') {
      slackClient.chat.postMessage({ channel: updates_channel_Id, text: `Hello Everyone!!!!\n\n<@${appliedUserSlackId}> is going on ${leaveType} leave from ${startDate} to ${endDate}` })
    }
    return new NextResponse(null, { status: 200 })
  }
  else {
    appliedUserId = avkash_userInfo?.userId;
    applylingTeam = avkash_userInfo?.teamId;
    text = `Your Leave apply from ${startDate} to ${endDate} has been submitted successfully`;
    channelId = user_id;
  }

  const leaveDetails: any = await applyLeave(leaveType, startDate, endDate, duration, isApproved, appliedUserId, applylingTeam, leaveReason, avkash_userInfo?.orgId);
  const leaveId = leaveDetails[0].leaveId;
  const appliedLeaveDetailsList: any = await getLeaveDetails(leaveId);
  const appliedLeaveDetails = appliedLeaveDetailsList[0];

  const approveCard = {
    channel: managerSlackId,
    text: `Leave Request`,
    blocks: [
      {
        type: "rich_text",
        elements: [
          {
            "type": "rich_text_preformatted",
            "elements": [
              {
                "type": "text",
                "text": `Leave Request\n\nTeam:  ${appliedLeaveDetails.Team.name} \nUser:  ${appliedLeaveDetails.User.name} \nEmail: ${appliedLeaveDetails.User.email}\nFrom: ${appliedLeaveDetails.startDate}\nTo: ${appliedLeaveDetails.startDate}\nType: ${leaveType}\nReason: ${leaveReason}`,
              }
            ]
          },
        ]
      },

      {
        type: 'actions',
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Review",
              emoji: true
            },
            action_id: `review_${leaveId}`
          }
        ]
      }
    ]
  };

  await slackClient.chat.postMessage(approveCard);


  await slackClient.chat.postMessage({
    channel: user_id,
    text: text,
  });

  return new NextResponse(null, { status: 200 });
}

async function handleApproveReviewLeave(action_id: any, view: any) {
  const leaveId = action_id.split('approve_leave_')[1];
  const startDate = view?.state?.values?.start_date_block?.start_date?.selected_date;
  const endDate = view?.state?.values?.end_date_block?.end_date?.selected_date;
  const duration_temp = view?.state?.values?.day_type_block?.day_type?.selected_option?.value;

  const appliedUserId = view?.state?.values?.select_user_block?.select_user?.selected_option?.value;
  const appliedUserName = view?.state?.values?.select_user_block?.select_user?.selected_option?.text?.text;


  let duration = '';
  if (duration_temp == 'full_day') {
    duration = 'FULL_DAY';
  } else if (duration_temp == 'half_day') {
    duration = 'HALF_DAY';
  }
  const leaveType = view?.state?.values?.type_block?.type?.selected_option?.value;
  const leaveReason = view?.state?.values?.leave_reason_block?.notes?.value;
  const mngrNotes = view?.state?.values?.manager_reason_block?.notes?.value;
  const isApproved = 'APPROVED';

  const allFields: any = {
    leaveType,
    startDate,
    endDate,
    duration,
    shift: 'NONE',
    isApproved,
    reason: leaveReason,
  };

  const fetchLeaev: any = await getLeaveDetails(leaveId);
  const user_slack_id = fetchLeaev[0].User.slackId;
  const user_name = fetchLeaev[0].User.name;

  await updateLeaveStatus(leaveId, allFields);
  await slackClient.chat.postMessage({
    channel: user_slack_id,
    text: `Hey <@${user_name}> your leave from ${startDate} to ${endDate} is Approved`,
  });

  return new NextResponse('leave approved', { status: 200 });

}


async function handleAction(action_id: string, channel_id: string, user_id: string, view_id: string, trigger_id: string) {
  if (action_id.startsWith('review_')) {
    const leaveId = action_id.split('review_')[1];
    return reviewLeave(action_id, leaveId, trigger_id);
  }

  switch (action_id) {
    case 'msg-req-leave':
      return openRequestLeaveModal(trigger_id, user_id);

    case 'msg-your-leaves':
      return sendUserLeaves(channel_id, user_id);

    case 'msg-leave-reports':
      return sendLeaveReports(channel_id, user_id);


    case 'add-leave':
      return openAddLeaveModal({ user_id, view_id, trigger_id });

    case 'team-dashboard':
      return handleAppHomeOpened(user_id, isOwner, false);

    case 'your-dashboard':
      return handleAppHomeOpened(user_id, isOwner, true);

    default:
      return new NextResponse('Unrecognized action', { status: 400 });
  }
}

async function reviewLeave(action_id: string, leaveId: string, trigger_id: any) {

  const leavesList: any = await getLeaveDetails(leaveId);
  const leaveDetails = leavesList[0];
  const start_dateFormat = new Date(leaveDetails.startDate);
  const end_dateFormat = new Date(leaveDetails.endDate);
  const start_date = start_dateFormat.toISOString().slice(0, 10)
  const end_date = end_dateFormat.toISOString().slice(0, 10);
  let durationText: string = '';
  let durationValue: string = '';

  const leaveTypeOptions = [
    { text: { type: 'plain_text', text: 'Sick Leave' }, value: 'sick' },
    { text: { type: 'plain_text', text: 'Paid Leave' }, value: 'paid' },
    { text: { type: 'plain_text', text: 'Test Leave' }, value: 'test' },
  ];

  let initial_leaveType: any = ''

  if (leaveDetails.leaveType == 'sick') {
    initial_leaveType = leaveTypeOptions[0]
  } else if (leaveDetails.leaveType == 'paid') {
    initial_leaveType = leaveTypeOptions[1]
  } else {
    initial_leaveType = leaveTypeOptions[2]
  }

  if (leaveDetails.duration == 'FULL_DAY') {
    durationText = "Full Day";
    durationValue = 'full_day';
  } else {
    durationText = "Half Day";
    durationValue = 'half_day';
  }
  const initial_radio_option = {
    text: { type: 'plain_text', text: durationText },
    value: durationValue
  }

  const commonBlocks = await createCommonModalBlocks(start_date, end_date, initial_radio_option, leaveDetails.leaveType, leaveDetails.reason);

  const review_model_view: any = {
    type: 'modal',
    callback_id: `review_leave_${leaveId}`,
    title: { type: 'plain_text', text: 'Edit Leave' },
    submit: { type: 'plain_text', text: 'Submit', emoji: true },
    blocks: [
      {
        "type": "rich_text",
        "elements": [
          {
            "type": "rich_text_quote",
            "elements": [
              {
                "type": "text",
                "text": `Team:  ${leaveDetails.Team.name} \n\nUser:  ${leaveDetails.User.name} \n\nEmail: ${leaveDetails.User.email}`,
              }
            ]
          },
        ]
      },
      // can use commonmodel
      ...commonBlocks,
      {
        type: 'input',
        block_id: 'mngr_notes_block',
        element: {
          type: 'plain_text_input',
          action_id: 'mngr_notes',
          placeholder: { type: 'plain_text', text: 'your review comments' }
        },
        label: { type: 'plain_text', text: 'Manager notes' }
      },
      {
        type: 'input',
        block_id: 'approve_reject_block',
        element: {
          type: 'radio_buttons',
          action_id: 'approve_reject_type',
          options: [
            {
              text: { type: 'plain_text', text: 'approve' },
              value: 'approve'
            },
            {
              text: { type: 'plain_text', text: 'reject' },
              value: 'reject'
            },

          ],
        },
        label: { type: 'plain_text', text: 'Approve/Reject' }
      },

    ],
  };

  await slackClient.views.open({
    trigger_id,
    view: review_model_view
  });

  return new NextResponse("opened leave review modal", { status: 200 });

}


async function openRequestLeaveModal(trigger_id: string, user_id: string) {
  const commonBlocks = await createCommonModalBlocks();
  await slackClient.views.open({
    trigger_id,
    view: {
      type: 'modal',
      callback_id: 'home-req-leave',
      title: { type: 'plain_text', text: 'Request Leave' },
      submit: { type: 'plain_text', text: 'Submit', emoji: true },
      blocks: commonBlocks
    }
  });

  return new NextResponse('Modal opened', { status: 200 });
}

interface openAddLeave {
  user_id?: any,
  view_id?: any,
  trigger_id?: any,
  selected_team_id?: any,
  action_id?: any,
  leaveId?: any,
}


async function openAddLeaveModal({ user_id, view_id, trigger_id, selected_team_id, action_id, leaveId }: openAddLeave) {
  let teamsInfo = await getTeamsList(avkash_userInfo.orgId);
  const teamsList = teamsInfo?.map((team) => ({
    "text": {
      "type": "plain_text",
      "text": team.name,
      "emoji": true
    },
    "value": team.teamId
  }));

  let usersList: any = [];
  if (selected_team_id) {
    const usersInfo = await getUsersList(selected_team_id);
    usersList = usersInfo?.map((user) => ({
      "text": {
        "type": "plain_text",
        "text": user.name,
        "emoji": true
      },
      "value": user.userId
    }));
  }

  const noUserView = [
    {
      "text": {
        "type": "plain_text",
        "text": "No users available",
        "emoji": true
      },
      "value": "no_users"
    }
  ];

  const commonBlocks = await createCommonModalBlocks();

  const view: any = {
    type: 'modal',
    callback_id: 'add-leave',
    title: { type: 'plain_text', text: 'Add Leave' },
    submit: { type: 'plain_text', text: 'Submit', emoji: true },
    blocks: [
      {
        type: 'input',
        dispatch_action: true,
        block_id: 'select_team_block',
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Select an item",
            emoji: true,
          },
          "options": teamsList,
          "action_id": "select_team"
        },
        label: { type: 'plain_text', text: 'Team' }
      },
      {
        type: 'input',
        block_id: 'select_user_block',
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Select an item",
            emoji: true,
          },
          "options": selected_team_id && usersList.length ? usersList : noUserView,
          "action_id": "select_user"
        },
        label: { type: 'plain_text', text: 'User' }
      },
      ...commonBlocks
    ]
  };

  if (selected_team_id) {
    await slackClient.views.update({
      view_id,
      view
    });
  } else {
    await slackClient.views.open({
      trigger_id,
      view
    });
  }
  return new NextResponse('modal opened', { status: 200 });
}

async function fetchLeavesHistory(userId?: any, teamId?: any) {
  function changeDate(startDate: string | number | Date) {
    const date = new Date(startDate);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };
    const formattedDate: string = date.toLocaleDateString(undefined, options);
    return formattedDate;
  }

  function formatDates(leavesList: any[]) {
    const responseList = leavesList.map((leave: any) => {
      const formattedStartDate = changeDate(leave.startDate);
      const formattedEndDate = changeDate(leave.endDate);
      return {
        leaveId: leave.leaveId,
        leaveType: leave.leaveType,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        duration: leave.duration,
        isApproved: leave.isApproved,
        userName: leave.User.slackId,
        teamName: leave.Team.name,

      }
    })
    return responseList

  }

  const { leaves, pending } = await getLeavesHistory(userId || teamId)

  const allLeavesHistory = formatDates(leaves);
  const pendingHistory = formatDates(pending);

  return [allLeavesHistory, pendingHistory];


}


function createButtonsBlock(buttons: { text: string, action_id: string, url?: string }[]) {
  return {
    type: 'actions',
    elements: buttons.map(button => ({
      type: 'button',
      text: { type: 'plain_text', text: button.text, emoji: true },
      action_id: button.action_id,
      ...(button.url && { url: button.url }),
    }))
  };
}

function createLeaveHistoryBlock(leaves: { leaveId: string, leaveType: any, startDate: any, endDate: any, duration: string, isApproved: any, userName: any, teamName: any }[]) {

  const res = leaves.map(leave => (
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<@${leave.userName}> from ${leave.teamName}\n${leave.startDate} - ${leave.endDate}\n${leave.leaveType} - ${leave.isApproved}  ${leave.isApproved === 'APPROVED' ? ':thumbsup:' : (leave.isApproved === 'PENDING' ? ':wink:' : ':laughing:')}`
      }
    }
  ))

  return res
}

function createPendingLeaveBlocks(pendingLeaves: { leaveId: string, startDate: string, endDate: string, leaveType: string, userName: string, teamName: string }[]) {
  if (pendingLeaves.length === 0) {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "There are no pending leave requests at the moment."
        }
      }
    ];
  }

  return pendingLeaves.map(leave => ([
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<@${leave.userName}> from ${leave.teamName} has applied leave from ${leave.startDate} - ${leave.endDate}\n${leave.leaveType}`
      }
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Review",
            emoji: true
          },
          action_id: `review_${leave.leaveId}`
        }
      ]
    }
  ])).flat();
}

function createHomeView(user_id: string, blocks: any[]) {
  return {
    type: 'home',
    callback_id: 'individual_view',
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `Welcome to your Home tab, <@${user_id}>!` } },
      { type: 'divider' },
      { type: 'section', text: { type: 'mrkdwn', text: 'Here you can add various interactive blocks, buttons, and more.' } },
      ...blocks
    ]
  };
}

async function handleAppHomeOpened(user_id: string, isManager?: boolean, yourDashboard?: boolean) {
  let formattedLeavesHistory: any = [];
  let pendingLeaves: any = [];
  let req_btn_text: string = '';
  let team_your_leave: string = '';
  let actionId: string = '';

  const userId = avkash_userInfo.userId;
  const teamId = avkash_userInfo.teamId;
  const orgId = avkash_userInfo.orgId;

  if (!isManager || yourDashboard) {
    req_btn_text = 'Request Leave';
    actionId = 'home-req-leave';
    team_your_leave = 'Your Past 7 Days Leaves';
    const [allLeavesHistory] = await fetchLeavesHistory({ userId });
    formattedLeavesHistory = allLeavesHistory;
  } else {
    req_btn_text = 'Add Leave';
    actionId = 'add-leave';
    team_your_leave = 'Your Team Past 7 Leaves';
    const [allLeavesHistory, pendingHistory] = await fetchLeavesHistory({ teamId });
    formattedLeavesHistory = allLeavesHistory;
    pendingLeaves = pendingHistory;
  }

  const common_top_block = createButtonsBlock([
    { text: req_btn_text, action_id: actionId },
    { text: "Web App", action_id: 'home-web-app', url: 'https://www.avkash.io/' },
    { text: "Options", action_id: 'home-options' },
  ]);

  const team_dashboard_block = createButtonsBlock([
    { text: "Team Dashboard", action_id: 'team-dashboard' },
    { text: "Your Dashboard", action_id: 'your-dashboard' }
  ]);

  const leaveHistoryBlocks = createLeaveHistoryBlock(formattedLeavesHistory);

  const pendingLeavesBlocks = createPendingLeaveBlocks(pendingLeaves);

  const blocks = [
    common_top_block,
    ...(isManager ? [{ type: 'divider' }, team_dashboard_block] : []),
    { type: 'divider' },
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Pending Leaves",
        emoji: true
      }
    },
    ...pendingLeavesBlocks,
    {
      type: "header",
      text: {
        type: "plain_text",
        text: team_your_leave,
        emoji: true
      }
    },
    ...leaveHistoryBlocks,
  ];

  const view: any = createHomeView(user_id, blocks);

  await slackClient.views.publish({ user_id, view });
  return new NextResponse('App home opened', { status: 200 });
}


// [TODO]: Can we invoke this on top itself.

async function handleBotIgnoreMessages(event: any) {
  const { user, text, channel, bot_id } = event;
  const isSlash = text[0] === '/';
  const channel_type = event.channel_type;

  if (bot_id || isSlash) {
    return new NextResponse('Ignoring bot or slash command message', { status: 200 });
  }

  const responseText = `Hey <@${user}>, see what you can do with the avkash!!!`;

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

  if (channel_type === 'im') {

    await slackClient.chat.postMessage({ channel, text: responseText, blocks });
  }

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

async function sendUserLeaves(channel_id: string, user_id: string) {
  const userInfo = await slackClient.users.info({ user: user_id });
  const userEmail = userInfo?.user?.profile?.email;

  let leaveText = 'Your leave records:\n';

  await slackClient.chat.postMessage({ channel: channel_id, text: leaveText });
  return new NextResponse('User leaves sent', { status: 200 });
}

async function sendLeaveReports(channel_id: string, user_id: string) {
  const leaveReports = await getLeaveReports();
  let reportText = 'Leave Reports:\n';
  await slackClient.chat.postMessage({ channel: channel_id, text: reportText });
  return new NextResponse('Leave reports sent', { status: 200 });
}












































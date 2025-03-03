import { NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";
import { getLeavesHistory, getTeamsList } from "@/app/_components/header/_components/actions";
import { avkashUserInfoProps } from "../route";


interface appHomeOpenedProps {
  avkashUserInfo: avkashUserInfoProps;
  yourDashboard?: boolean;
  viewId?: string;
  ownerSelectedTeamId?: string;
}
export default async function handleAppHomeOpened({ avkashUserInfo, yourDashboard, viewId, ownerSelectedTeamId }: appHomeOpenedProps) {
  const slackClient = new WebClient(avkashUserInfo.accessToken);
  let teamsList: any;
  if (avkashUserInfo.isOwner) {
    teamsList = await getTeamsList(avkashUserInfo.orgId);
  }
  let formattedLeavesHistory: any = [];
  let pendingLeaves: any = [];
  let req_btn_text: string = '';
  let team_your_leave: string = '';
  let actionId: string = '';
  const isManager = avkashUserInfo?.isManager;
  const userId = avkashUserInfo?.userId;
  const currentTeamId = avkashUserInfo?.teamId;
  const orgId = avkashUserInfo?.orgId;
  let pendingText;

  if (avkashUserInfo.isOwner && !yourDashboard) {
    req_btn_text = 'Add Leave';
    actionId = 'add-leave';
    team_your_leave = 'Your Team Past 7 Leaves';
    pendingText = "Pending Leaves";
    let teamId;
    teamId = ownerSelectedTeamId ? ownerSelectedTeamId :  avkashUserInfo.teamId;
    const [allLeavesHistory, pendingHistory] = await fetchLeavesHistory({ days: 7, teamId });
    formattedLeavesHistory = allLeavesHistory;
    pendingLeaves = pendingHistory;
  } else if (!isManager || yourDashboard) {
    pendingText = "Upcoming Leaves";
    req_btn_text = 'Request Leave';
    actionId = 'home-req-leave';
    team_your_leave = 'Your Past 7 Days Leaves';
    // this is the problem for your-dashboard check fetchLeavesHistory method
    const [allLeavesHistory,pendingHistory] = await fetchLeavesHistory({ days: 7, userId });
    formattedLeavesHistory = allLeavesHistory;
    pendingLeaves = pendingHistory;

  } else {
    pendingText = "Pending Leaves";
    req_btn_text = 'Add Leave';
    actionId = 'add-leave';
    team_your_leave = 'Your Team Past 7 Leaves';
    let teamId;
    if (ownerSelectedTeamId) {
      teamId = ownerSelectedTeamId
    } else {
      teamId = avkashUserInfo.teamId;
    }
    const [allLeavesHistory, pendingHistory] = await fetchLeavesHistory({ days: 7, teamId });
    formattedLeavesHistory = allLeavesHistory;
    pendingLeaves = pendingHistory;
  }
  const common_top_block = createButtonsBlock([
    { text: req_btn_text, action_id: actionId },
    { text: "Web App", action_id: 'home-web-app', url: 'https://www.avkash.io/' },
    { text: "Options", action_id: 'home-options' },
  ]);

  const teamDashboardBlock = () => {
    if (avkashUserInfo.isOwner) {
      const options = teamsList.map((team: { teamId: string, name: string }) => ({
        text: {
          type: "plain_text",
          text: team.name,
          emoji: true
        },
        value: team.teamId
      }));

      const initialOption = options.find((option: {value: string})  => option.value === avkashUserInfo.teamId);
      return [{
        type: 'actions',
        block_id: 'owner_team_block',
        elements: [
          {
            type: "static_select",
            placeholder: {
              type: "plain_text",
              text: "Select a team",
              emoji: true
            },
            options: options,
            initial_option: initialOption,
            action_id: "owner_select_team"
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Your Dashboard', emoji: true },
            action_id: 'your-dashboard',
          }
        ]
      }];
    } else {
      return createButtonsBlock([
        { text: "Team Dashboard", action_id: 'team-dashboard' },
        { text: "Your Dashboard", action_id: 'your-dashboard' }
      ]);
    }
  }
  const leaveHistoryBlocks = createLeaveHistoryBlock(formattedLeavesHistory);
  const teamDashboardBlockArray: any = teamDashboardBlock();
  const pendingLeavesBlocks: any = (!isManager || yourDashboard) ? userUpcomingBlock(pendingLeaves): createPendingLeaveBlocks(pendingLeaves);
  const checkOwnerOrManagerOrUser = (avkashUserInfo.isOwner ? [{ type: 'divider' }, ...teamDashboardBlockArray] : isManager ? [{ type: 'divider' }, teamDashboardBlockArray] : []);
  const blocks = [
    common_top_block,
    ...checkOwnerOrManagerOrUser,
    // ...(isManager || avkashUserInfo.isOwner ? [{ type: 'divider' }, teamDashboardBlock()] : []),
    { type: 'divider' },
    {
      type: "header",
      text: {
        type: "plain_text",
        text: pendingText,
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

  const view: any = createHomeView(avkashUserInfo.slackId, blocks);

  if (viewId) {
    await slackClient.views.update({ view_id: viewId, view });
  } else {
    await slackClient.views.publish({ user_id: avkashUserInfo.slackId, view });
  }

  return new NextResponse('App home opened', { status: 200 });
}


export async function fetchLeavesHistory({ days, userId, teamId }: { days: number, userId?: string, teamId?: string, }) {
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
        orgId: leave.User.orgId,

      }
    })
    return responseList

  }

  let allLeaves: any;
  if (userId) {
    allLeaves = await getLeavesHistory({ days, userId })
  } else {
    allLeaves = await getLeavesHistory({ days, teamId })

  }

  const { leaves, pending } = allLeaves;

  const allLeavesHistory = formatDates(leaves);
  const pendingHistory = formatDates(pending);
  return [allLeavesHistory, pendingHistory];


}

function createButtonsBlock(buttons: { text: string, action_id: string, url?: string }[]) {
  return {
    type: 'actions',
    elements: buttons.map(button => {
      return {
        type: 'button',
        text: { type: 'plain_text', text: button.text, emoji: true },
        action_id: button.action_id,
        ...(button.url && { url: button.url }),
      }
    })
  };
}

function createLeaveHistoryBlock(leaves: { leaveId: string, leaveType: any, startDate: any, endDate: any, duration: string, isApproved: any, userName: any, teamName: any }[]) {

  const noPendingLeaves = leaves.filter(leave => leave.isApproved !== 'PENDING');

  if(noPendingLeaves.length === 0) {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "There are no history of leaves at the moment."
        }
      }
    ];
  }

  return noPendingLeaves.map(leave => (
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<@${leave.userName}> from ${leave.teamName}\n${leave.startDate} - ${leave.endDate}\n${leave.leaveType} - ${leave.isApproved}  ${leave.isApproved === 'APPROVED' ? ':white_check_mark:' : (leave.isApproved === 'PENDING' ? ':wink:' : ':x:')}`
      }
    }
  ))

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
          action_id: `review_${leave.leaveId}`,
          style:'primary',
        }
      ]
    }
  ])).flat();
}

function userUpcomingBlock(pendingLeaves: { leaveId: string, startDate: string, endDate: string, leaveType: string, userName: string, teamName: string }[]){
  
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

  const block = pendingLeaves.map(leave => (
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `(${leave.startDate} - ${leave.endDate})\n${leave.leaveType} - Pending :hourglass_flowing_sand:`,
      }
    }
  ))
  return block;

}

function createHomeView(slackId: string, blocks: any[]) {
  return {
    type: 'home',
    callback_id: 'individual_view',
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `Welcome to your Home tab, <@${slackId}>!` } },
      { type: 'divider' },
      { type: 'section', text: { type: 'mrkdwn', text: 'check below to know what you can do with Avkash!!' } },
      ...blocks
    ]
  };
}
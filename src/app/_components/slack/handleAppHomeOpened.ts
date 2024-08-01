
import { NextResponse } from "next/server";
import { avkashUserInfoProps } from "../../api/slack/route";
import { WebClient } from "@slack/web-api";
import { getLeavesHistory } from "@/app/_components/header/_components/actions";

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

interface appHomeOpenedProps {
    avkashUserInfo: avkashUserInfoProps;
    yourDashboard?: boolean;
}
export default async function handleAppHomeOpened({avkashUserInfo,yourDashboard}: appHomeOpenedProps){
    let formattedLeavesHistory: any = [];
    let pendingLeaves: any = [];
    let req_btn_text: string = '';
    let team_your_leave: string = '';
    let actionId: string = '';
    const isManager = avkashUserInfo?.isOwner;

    const userId = avkashUserInfo?.userId;
    const teamId = avkashUserInfo?.teamId;
    const orgId = avkashUserInfo?.orgId;
  
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
  
    const view: any = createHomeView(userId, blocks);
  
    await slackClient.views.publish({ user_id: avkashUserInfo.slackId, view });
    return new NextResponse('App home opened', { status: 200 });
  }
  
  export async function fetchLeavesHistory(userId?: any, teamId?: any) {
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
        console.log('this is home leaves' , leave)
        return {
          leaveId: leave.leaveId,
          leaveType: leave.leaveType,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          duration: leave.duration,
          isApproved: leave.isApproved,
          userName: leave.User.name,
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
  
  function createHomeView(userId: string, blocks: any[]) {
    return {
      type: 'home',
      callback_id: 'individual_view',
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: `Welcome to your Home tab, <@${userId}>!` } },
        { type: 'divider' },
        { type: 'section', text: { type: 'mrkdwn', text: 'Here you can add various interactive blocks, buttons, and more.' } },
        ...blocks
      ]
    };
  }
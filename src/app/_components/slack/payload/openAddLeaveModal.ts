import { avkashUserInfoProps } from "@/app/api/slack/route";
import { getTeamsList, getUsersList } from "../../header/_components/actions";
import { createCommonModalBlocks } from "../createCommonModalBlocks";
import { NextResponse } from "next/server";
import { openView, updateViews } from "../sendMessages";

interface openAddLeaveProps {
  userId?: any,
  viewId?: any,
  trigger_id?: any,
  selectedTeamId?: any,
  action_id?: any,
  leaveId?: any,
  avkashUserInfo: avkashUserInfoProps,
  checkLeaveType?: boolean,
  payload?: any
}

export async function openAddLeaveModal({ avkashUserInfo, userId, viewId, trigger_id, selectedTeamId, action_id, leaveId, checkLeaveType = false, payload }: openAddLeaveProps) {
  let teamsInfo = await getTeamsList(avkashUserInfo.orgId);
  const teamsList = teamsInfo?.map((team) => ({
    "text": {
      "type": "plain_text",
      "text": team.name,
      "emoji": true
    },
    "value": team.teamId
  }));

  let usersList: any = [];
  if (selectedTeamId) {
    const usersInfo = await getUsersList(selectedTeamId);
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

  const commonBlocks = await createCommonModalBlocks({avkashUserInfo, checkLeaveType, payload});

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
          "options": selectedTeamId && usersList.length ? usersList : noUserView,
          "action_id": "select_user"
        },
        label: { type: 'plain_text', text: 'User' }
      },
      ...commonBlocks
    ]
  };

  if (selectedTeamId || checkLeaveType) {
    updateViews(avkashUserInfo,viewId, view)
  } else {
    openView(avkashUserInfo,trigger_id, view);
  }
  return new NextResponse('modal opened', { status: 200 });
}

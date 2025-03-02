import { avkashUserInfoProps } from '@/app/api/slack/route';
import { NextResponse } from 'next/server';
import { getTeamsList, getUsersList } from '../../header/_components/actions';
import { createCommonModalBlocks } from '../createCommonModalBlocks';
import { openView, updateViews } from '../sendMessages';

interface openAddLeaveProps {
  userId?: any;
  viewId?: any;
  trigger_id?: any;
  selectedTeamId?: any;
  action_id?: any;
  leaveId?: any;
  avkashUserInfo: avkashUserInfoProps;
  checkLeaveType?: boolean;
  payload?: any;
}

const loadingView = {
  type: 'modal',
  callback_id: 'home-req-leave',
  title: { type: 'plain_text', text: 'Add Leave' },
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '⏳ Please wait while we load you request...',
      },
    },
  ],
};

export async function openAddLeaveModal({
  avkashUserInfo,
  userId,
  viewId,
  trigger_id,
  selectedTeamId,
  action_id,
  leaveId,
  checkLeaveType = false,
  payload,
}: openAddLeaveProps) {
  const selectedTeam =
    payload?.view?.state?.values?.select_team_block?.select_team
      ?.selected_option?.value;
  const dynamicUserBlockId = `select_user_block_${selectedTeam}`;
  const selectedUserIdBlock =
    checkLeaveType && dynamicUserBlockId in payload?.view?.state?.values
      ? dynamicUserBlockId
      : 'select_user_block';
  const selectedUserId =
    payload?.view?.state?.values?.[selectedUserIdBlock]?.select_user
      ?.selected_option?.value;

  const openedModalViewId = await openView(
    avkashUserInfo,
    trigger_id,
    loadingView
  );

  const teamsInfo = await getTeamsList(avkashUserInfo.orgId);
  const teamsList = teamsInfo?.map((team) => ({
    text: {
      type: 'plain_text',
      text: team.name,
      emoji: true,
    },
    value: team.teamId,
  }));

  const ownTeam = teamsList?.filter(
    (team) => team.value === avkashUserInfo.teamId
  );
  const userBlockId = selectedTeamId
    ? `select_user_block_${selectedTeamId}`
    : 'select_user_block';
  let usersList: any = [];
  let initialUserOption: any;
  let initialUserOptionForTeamChange: any;

  if (selectedTeamId) {
    const usersInfo = await getUsersList(selectedTeamId);
    usersList = usersInfo?.map((user) => ({
      text: {
        type: 'plain_text',
        text: user.name,
        emoji: true,
      },
      value: user.userId,
    }));
    initialUserOptionForTeamChange = usersList[0];
  } else if (checkLeaveType) {
    const usersInfo = await getUsersList(selectedTeam);
    usersList = usersInfo?.map((user) => ({
      text: {
        type: 'plain_text',
        text: user.name,
        emoji: true,
      },
      value: user.userId,
    }));
    initialUserOptionForTeamChange = usersList.find(
      (u: { value: string }) => u.value === selectedUserId
    );
  } else {
    const initailTeamUsers = await getUsersList(avkashUserInfo.teamId);
    usersList = initailTeamUsers?.map((user) => ({
      text: {
        type: 'plain_text',
        text: user.name,
        emoji: true,
      },
      value: user.userId,
    }));
    initialUserOption = usersList.find(
      (user: { value: string }) => user.value === avkashUserInfo.userId
    );
  }

  const noUserView = [
    {
      text: {
        type: 'plain_text',
        text: 'No users available',
        emoji: true,
      },
      value: 'no_users',
    },
  ];

  const commonBlocks = await createCommonModalBlocks({
    avkashUserInfo,
    checkLeaveType,
    payload,
  });
  const view: any = {
    type: 'modal',
    callback_id: 'add-leave',
    title: { type: 'plain_text', text: 'Add Leave' },
    submit: { type: 'plain_text', text: 'add leave', emoji: true },
    blocks: [
      {
        type: 'input',
        dispatch_action: true,
        block_id: 'select_team_block',
        element: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select an item',
            emoji: true,
          },
          options: teamsList,
          initial_option: ownTeam && ownTeam[0],
          action_id: 'select_team',
        },
        label: { type: 'plain_text', text: 'Team' },
      },
      {
        type: 'input',
        block_id: userBlockId,
        element: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select an item',
            emoji: true,
          },
          options: usersList.length ? usersList : noUserView,
          initial_option:
            selectedTeamId || checkLeaveType
              ? initialUserOptionForTeamChange
              : initialUserOption,
          action_id: 'select_user',
        },
        label: { type: 'plain_text', text: 'User' },
      },
      ...commonBlocks,
    ],
  };

  if (selectedTeamId || checkLeaveType) {
    updateViews(avkashUserInfo, viewId, view);
  } else {
    updateViews(avkashUserInfo, openedModalViewId, view);
  }
  return new NextResponse('modal opened', { status: 200 });
}

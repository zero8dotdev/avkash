import { avkashUserInfoProps } from '@/app/api/slack/route';
import { NextResponse } from 'next/server';
import { createCommonModalBlocks } from '../createCommonModalBlocks';
import { openView, updateViews } from '../sendMessages';

export async function openRequestLeaveModal(
  avkashUserInfo: avkashUserInfoProps,
  trigger_id: string,
  user_id: string,
  checkLeaveType: boolean,
  payload?: any
) {
  const viewId: string = payload && payload.view.id;
  let updatingViewId;

  const loadingView = {
    type: 'modal',
    callback_id: 'home-req-leave',
    title: { type: 'plain_text', text: 'Request Leave' },
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: 'Loading...' },
      },
    ],
  };
  if (!checkLeaveType) {
    updatingViewId = await openView(avkashUserInfo, trigger_id, loadingView);
  }
  const commonBlocks = await createCommonModalBlocks({
    avkashUserInfo,
    checkLeaveType,
    payload,
  });

  const fullView = {
    type: 'modal',
    callback_id: 'home-req-leave',
    title: { type: 'plain_text', text: 'Request Leave' },
    submit: { type: 'plain_text', text: 'Submit', emoji: true },
    blocks: commonBlocks,
  };
  if (checkLeaveType) {
    await updateViews(avkashUserInfo, viewId, fullView);
    return new NextResponse('Modal opened and updated', { status: 200 });
  }
  await updateViews(avkashUserInfo, updatingViewId, fullView);
  return new NextResponse('Modal opened and updated', { status: 200 });
}

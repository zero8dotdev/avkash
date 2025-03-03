import { NextResponse } from 'next/server';
import { avkashUserInfoProps } from '@/app/api/slack/route';
import { handleViewSubmission } from './handleViewSubmission';
import handleBlockActions from '../handleBlockActions/handleBlockActions';

export default async function handlePayload(
  avkashUserInfo: avkashUserInfoProps,
  payload: any
) {
  const { type, view } = payload;
  switch (type) {
    case 'view_submission':
      return handleViewSubmission(view, avkashUserInfo);

    case 'block_actions':
      return handleBlockActions(avkashUserInfo, payload);

    default:
      return new NextResponse('Unrecognized payload type', { status: 400 });
  }
}

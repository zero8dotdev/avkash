import { NextResponse } from "next/server";
import { handleViewSubmission } from "./handleViewSubmission";
import { avkashUserInfoProps } from "@/app/api/slack/route";
import handleBlockActions from "../handleBlockActions/handleBlockActions";

export default async function handlePayload(avkashUserInfo: avkashUserInfoProps, payload: any) {
  const { type, view} = payload;
  // console.log('konda',payload);
  switch (type) {
    case 'view_submission':
      return handleViewSubmission(view, avkashUserInfo);

    case 'block_actions':
      return handleBlockActions(avkashUserInfo, payload);

    default:
      return new NextResponse('Unrecognized payload type', { status: 400 });
  }
}
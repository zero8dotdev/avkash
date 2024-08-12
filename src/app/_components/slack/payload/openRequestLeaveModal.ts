import { avkashUserInfoProps } from "@/app/api/slack/route";
import { createCommonModalBlocks } from "../createCommonModalBlocks";
import { NextResponse } from "next/server";
import { openView, updateViews } from "../sendMessages";

export async function openRequestLeaveModal(avkashUserInfo: avkashUserInfoProps, trigger_id: string, user_id: string, checkLeaveType: boolean, payload?: any) {
    let viewId: string = '';
    if (payload) {
        const { view } = payload;
        viewId = view?.id;

    }
    const commonBlocks = await createCommonModalBlocks({ avkashUserInfo, checkLeaveType, payload });
    const view = {
        type: 'modal',
        callback_id: 'home-req-leave',
        title: { type: 'plain_text', text: 'Request Leave' },
        submit: { type: 'plain_text', text: 'Submit', emoji: true },
        blocks: commonBlocks
    }

    if (checkLeaveType) {
        updateViews(avkashUserInfo,viewId, view)
    } else {
        openView(avkashUserInfo,
            trigger_id,
            view
        );
    }
    console.timeEnd('ended processing');
    return new NextResponse('Modal opened', { status: 200 });
}
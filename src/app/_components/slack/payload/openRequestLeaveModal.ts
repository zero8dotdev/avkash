// import { avkashUserInfoProps } from "@/app/api/slack/route";
// import { createCommonModalBlocks } from "../createCommonModalBlocks";
// import { NextResponse } from "next/server";
// import { openView, updateViews } from "../sendMessages";

// export async function openRequestLeaveModal(avkashUserInfo: avkashUserInfoProps, trigger_id: string, user_id: string, checkLeaveType: boolean, payload?: any) {
//     let viewId: string = '';
//     if (payload) {
//         const { view } = payload;
//         viewId = view?.id;

//     }
//     const commonBlocks = await createCommonModalBlocks({ avkashUserInfo, checkLeaveType, payload });
//     const view = {
//         type: 'modal',
//         callback_id: 'home-req-leave',
//         title: { type: 'plain_text', text: 'Request Leave' },
//         submit: { type: 'plain_text', text: 'Submit', emoji: true },
//         blocks: commonBlocks
//     }

//     if (checkLeaveType) {
//         updateViews(avkashUserInfo,viewId, view)
//     } else {
//         openView(avkashUserInfo,
//             trigger_id,
//             view
//         );
//     }

//     return new NextResponse('Modal opened', { status: 200 });
// }



import { avkashUserInfoProps } from "@/app/api/slack/route";
import { createCommonModalBlocks } from "../createCommonModalBlocks";
import { NextResponse } from "next/server";
import { openView, updateViews } from "../sendMessages";

export async function openRequestLeaveModal(avkashUserInfo: avkashUserInfoProps, trigger_id: string, user_id: string, checkLeaveType: boolean, payload?: any) {
    let viewId: string = '';

    const loadingView = {
        type: 'modal',
        callback_id: 'home-req-leave',
        title: { type: 'plain_text', text: 'Request Leave' },
        blocks: [
            {
                type: 'section',
                text: { type: 'mrkdwn', text: 'Loading...' }
            }
        ]
    };


    const view_id = await openView(avkashUserInfo, trigger_id, loadingView);


    const commonBlocks = await createCommonModalBlocks({ avkashUserInfo, checkLeaveType, payload });

    const fullView = {
        type: 'modal',
        callback_id: 'home-req-leave',
        title: { type: 'plain_text', text: 'Request Leave' },
        submit: { type: 'plain_text', text: 'Submit', emoji: true },
        blocks: commonBlocks
    };

    if (checkLeaveType) {
        await updateViews(avkashUserInfo, viewId || view_id, fullView);

    } else {
        await updateViews(avkashUserInfo, view_id, fullView);
    }

    return new NextResponse('Modal opened and updated', { status: 200 });
}

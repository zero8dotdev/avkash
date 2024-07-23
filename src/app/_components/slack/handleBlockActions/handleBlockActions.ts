import { avkashUserInfoProps } from "@/app/api/slack/route";
import { openAddLeaveModal } from "../payload/openAddLeaveModal";
import { openRequestLeaveModal } from "../payload/openRequestLeaveModal";
import { NextResponse } from "next/server";
import handleAppHomeOpened from "../handleAppHomeOpened";
import reviewLeave from "../payload/reviewLeave";
import handleYourLeaves from "../payload/handleYourLeaves";

export default async function handleBlockActions(avkashUserInfo: avkashUserInfoProps, payload: any) {
    const { view, trigger_id, actions ,callback_id} = payload;
    const triggerId = trigger_id;
    const viewId = view?.id;
    const userId = avkashUserInfo.userId;
    const actionId = actions?.[0]?.action_id;
    const selectedTeamId = actions?.[0]?.selected_option?.value;

    if (actionId.startsWith('review_')) {
        const leaveId = actionId.split('review_')[1];
        return reviewLeave(avkashUserInfo, actionId, leaveId, triggerId);
    }
    if(actionId === 'leave_type' && view.callback_id === 'add-leave'){
        return openAddLeaveModal({ avkashUserInfo, userId, viewId, trigger_id,checkLeaveType: true, payload });
 
    }
    if(actionId === 'leave_type' && view.callback_id === 'home-req-leave'){
        return openRequestLeaveModal( avkashUserInfo, trigger_id,userId,true, payload );
 
    }

    switch (actionId) {
        case 'msg-req-leave':
        case 'home-req-leave':
            return openRequestLeaveModal(avkashUserInfo, triggerId, userId,false);

        case 'msg-your-leaves':
            return handleYourLeaves();
            // return new NextResponse('User leaves sent', { status: 200 });

        case 'msg-leave-reports':
            return new NextResponse('User leaves reports', { status: 200 });

        case 'add-leave':
            return openAddLeaveModal({ avkashUserInfo, userId, viewId, trigger_id });

        case 'select_team':
            return openAddLeaveModal({ avkashUserInfo, userId, viewId, trigger_id, selectedTeamId });

        case 'team-dashboard':
            return handleAppHomeOpened({ avkashUserInfo, yourDashboard: false });

        case 'your-dashboard':
            return handleAppHomeOpened({ avkashUserInfo, yourDashboard: true });

        default:
            return new NextResponse('Unrecognized action', { status: 400 });
    }

}
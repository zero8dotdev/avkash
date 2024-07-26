import { avkashUserInfoProps } from "@/app/api/slack/route";
import { NextResponse } from "next/server";
import { fetchLeavesHistory } from "../handleAppHomeOpened";
import { sendPostMessages } from "../sendMessages";
import { Divider } from "antd";
import { calculateWorkingDays } from "../createCommonModalBlocks";

export default async function handleYourLeaves(avkashUserInfo: avkashUserInfoProps, channelId: string) {
    const userId = avkashUserInfo.userId;
    const [allLeavesHistory, pendingHistory] = await fetchLeavesHistory({ days:30,userId });
    const leavesHistory = await Promise.all(allLeavesHistory.map(async (leave) => {
        const workingDays = await calculateWorkingDays(leave.orgId, leave.startDate, leave.endDate, leave.leaveType);
        return {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `${leave.leaveType} (${workingDays} working days) \n ${leave.startDate} - ${leave.endDate} - ${leave.isApproved} ${leave.isApproved === 'APPROVED' ? ':thumbsup:' : (leave.isApproved === 'PENDING' ? ':wink:' : ':laughing:')}`
            // text: `\`${leave.leaveType}\` \`${leave.startDate}\` - \`${leave.endDate}\` (\`${workingDays}\` working days)`

            }
        };
    }));


    const blocks: any = [
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Approve Leaves:*"
            }
        },
        ...leavesHistory
    ]


    const responseText = 'Bleow are you Last 7 days leaves History';

    sendPostMessages(channelId, responseText, blocks);

    return new NextResponse('User leaves sent', { status: 200 });

}
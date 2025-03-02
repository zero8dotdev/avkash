import { avkashUserInfoProps } from '@/app/api/slack/route';
import { NextResponse } from "next/server";
import { sendPostMessages } from "./sendMessages";

export default async function handleBotIgnoreMessages(avkashUserInfo: avkashUserInfoProps,event: any) {
    const { user, text, channel, bot_id } = event;
    const isSlash = text[0] === '/';
    const channel_type = event.channel_type;

    if (bot_id || isSlash) {
        return new NextResponse('Ignoring bot or slash command message', { status: 200 });
    }

    const responseText = `Hey <@${user}>, see what you can do with the avkash!!!`;

    const blocks = [
        { type: 'section', text: { type: 'mrkdwn', text: responseText } },
        { type: 'divider' },
        {
            type: 'actions',
            elements: [
                { type: 'button', text: { type: 'plain_text', text: 'Request Leave', emoji: true }, value: 'req_leave', action_id: 'msg-req-leave' },
                { type: 'button', text: { type: 'plain_text', text: 'Your Leaves', emoji: true }, value: 'your_leaves', action_id: 'msg-your-leaves' },
                { type: 'button', text: { type: 'plain_text', text: 'Leave Report', emoji: true }, value: 'leave_report', action_id: 'msg-leave-reports' }
            ]
        }
    ];

    if (channel_type === 'im') {
        sendPostMessages(avkashUserInfo,channel, responseText, blocks);
    }

    return new NextResponse('Message processed', { status: 200 });
}
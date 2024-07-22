import { WebClient } from '@slack/web-api';


const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);


export async function sendPostMessages(channel?: any, text?: any, blocks?: any) {
  await slackClient.chat.postMessage({ channel: channel, text: text, blocks: blocks });

}
export async function updateViews(viewId: any, view: any) {
  await slackClient.views.update({ view_id: viewId, view })

}
export async function openView(triggerId: any, view: any) {
  await slackClient.views.open({ trigger_id: triggerId, view })

}
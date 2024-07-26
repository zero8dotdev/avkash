import { getAccessToken } from '@/app/api/slack/route';
import { WebClient } from '@slack/web-api';



export async function sendPostMessages(channel?: any, text?: any, blocks?: any) {
  const accessToken = getAccessToken();
  const slackClient = new WebClient(accessToken);
  await slackClient.chat.postMessage({ channel: channel, text: text, blocks: blocks });

}
export async function updateViews(viewId: any, view: any) {
  const accessToken = getAccessToken();
  const slackClient = new WebClient(accessToken);
  await slackClient.views.update({ view_id: viewId, view })

}
export async function openView(triggerId: any, view: any) {
  const accessToken = getAccessToken();
  const slackClient = new WebClient(accessToken);
  await slackClient.views.open({ trigger_id: triggerId, view })

}
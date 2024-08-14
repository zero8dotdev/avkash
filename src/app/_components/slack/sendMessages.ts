import { WebClient } from '@slack/web-api';

export async function sendPostMessages(avkashUserInfo: any,channel?: any, text?: any, blocks?: any) {
  const slackClient = new WebClient(process.env.DEV_SLACK_BOT_ID);
  // const slackClient = new WebClient(avkashUserInfo.accessToken);
  await slackClient.chat.postMessage({ channel: channel, text: text, blocks: blocks });

}
export async function updateViews(avkashUserInfo: any,viewId: any, view: any,) {
  const slackClient = new WebClient(process.env.DEV_SLACK_BOT_ID);
  // const slackClient = new WebClient(avkashUserInfo.accessToken);
  await slackClient.views.update({ view_id: viewId, view })

}
export async function openView(avkashUserInfo: any,triggerId: any, view: any,) {
  const slackClient = new WebClient(process.env.DEV_SLACK_BOT_ID);
  // const slackClient = new WebClient(avkashUserInfo.accessToken);
  const response = await slackClient.views.open({ trigger_id: triggerId, view })
const view_id  = response.view?.id; 
return view_id

}
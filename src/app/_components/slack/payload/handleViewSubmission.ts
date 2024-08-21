import { applyLeave, getLeaveDetails, getNotifiedUser, getUserDataBasedOnUUID, updateLeaveStatus } from "../../header/_components/actions";
import { avkashUserInfoProps } from "../../../api/slack/route"
import { NextResponse } from "next/server";
import { sendPostMessages } from "../sendMessages";

export async function handleViewSubmission(view: any, avkashUserInfo: avkashUserInfoProps) {
  const whoGetNotified = await getNotifiedUser(avkashUserInfo.teamId, avkashUserInfo.orgId);
  // const updates_channel_Id = 'C06GP1QCS0Y';
  // const managerSlackId = await getManagerIds(avkashUserInfo.orgId);
  const managerSlackId = avkashUserInfo.slackId;
  const startDate = view?.state?.values?.start_date_block?.start_date?.selected_date;
  const endDate = view?.state?.values?.end_date_block?.end_date?.selected_date;
  const duration_temp = view?.state?.values?.day_type_block?.day_type?.selected_option?.value;
  const shift_temp = view?.state?.values?.shift_type_block.shift_type.selected_option.value;
  let duration = '';
  let shift = '';
  if (duration_temp == 'full_day') {
    duration = 'FULL_DAY';
  } else if (duration_temp == 'half_day') {
    duration = 'HALF_DAY';
  }
  const leaveType = view?.state?.values?.type_block?.leave_type?.selected_option?.value;
  const leaveReason = view?.state?.values?.notes_block?.notes?.value;
  const isApproved = 'PENDING';
  let text = '';
  let appliedUserId = '';
  let applyiedUserName = '';
  let applylingTeam = '';
  let channelId = '';
  const callback_id = view?.callback_id;

  if (callback_id == 'add-leave') {
    appliedUserId = view?.state?.values?.select_user_block?.select_user?.selected_option?.value;
    const appliedUserSlackId = await getUserDataBasedOnUUID(appliedUserId);
    applyiedUserName = view?.state?.values?.select_user_block?.select_user?.selected_option?.text?.text;
    applylingTeam = view?.state?.values?.select_team_block?.select_team?.selected_option?.value;
    channelId = managerSlackId;
    text = `Leave apply for <@${appliedUserSlackId.slackId}> from ${startDate} to ${endDate} has been successfully`;
  } else if (callback_id.startsWith('review_leave_')) {
    const leaveId = callback_id.split("review_leave_")[1];
    const leaveDetails: any = await getLeaveDetails(leaveId);
    const appliedUserSlackId = leaveDetails[0].User.slackId;
    const isReviewApproved = view?.state?.values?.approve_reject_block?.approve_reject_type.selected_option?.value;
    const mngrNotes = view?.state?.values?.mngr_notes_block?.mngr_notes?.value;
    const msgForUser = `Hey <@${avkashUserInfo.slackId}>! your leave from ${startDate} to ${endDate} has been ${isReviewApproved == 'approve' ? `Approved` : 'Rejected'}\n\nChek comments: ${mngrNotes}`;

    const allFields = { leaveType, startDate, endDate, duration, shift: 'NONE', isApproved: `${isReviewApproved === "approve" ? "APPROVED" : "REJECTED"}`, reason: leaveReason, managerComment: mngrNotes };

    await updateLeaveStatus(leaveId, allFields);
    sendPostMessages(avkashUserInfo, appliedUserSlackId, msgForUser);
    sendPostMessages(avkashUserInfo, managerSlackId, `Leaves applied for <@${appliedUserSlackId}> from ${leaveDetails[0].Team.name} from ${startDate} to ${endDate} has been ${isReviewApproved == 'approve' ? "Approved" : "Rejected"}`);
    // if (isReviewApproved == 'approve') {
    //   sendPostMessages(updates_channel_Id, `Hello Everyone!!!!\n\n<@${appliedUserSlackId}> is going on ${leaveType} leave from ${startDate} to ${endDate}`);

    // }
    return new NextResponse(null, { status: 200 })
  }
  else {
    appliedUserId = avkashUserInfo.userId;
    applylingTeam = avkashUserInfo.teamId;
    text = `Your Leave apply from ${startDate} to ${endDate} has been submitted successfully`;
    channelId = avkashUserInfo.slackId;
  }

  if (startDate === endDate) {
    shift = shift_temp;
  } else {
    shift = "NONE";
    duration = 'FULL_DAY';
  }
  const leaveDetails: any = await applyLeave(leaveType, startDate, endDate, duration, shift, isApproved, appliedUserId, applylingTeam, leaveReason, avkashUserInfo.orgId);
  const leaveId = leaveDetails[0].leaveId;
  const appliedLeaveDetailsList: any = await getLeaveDetails(leaveId);

  const appliedLeaveDetails = appliedLeaveDetailsList[0];

  const blocks: any = [
    {
      type: "rich_text",
      elements: [
        {
          "type": "rich_text_preformatted",
          "elements": [
            {
              "type": "text",
              "text": `Leave Request\n\nTeam:  ${appliedLeaveDetails.Team.name} \nUser:  ${appliedLeaveDetails.User.name}Email: ${appliedLeaveDetails.User.email}\nFrom: ${appliedLeaveDetails.startDate}\nTo: ${appliedLeaveDetails.endDate}\nType: ${leaveType}\nReason: ${leaveReason}`,
            }
          ]
        },
      ]
    },

    {
      type: 'actions',
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Review",
            emoji: true
          },
          action_id: `review_${leaveId}`
        }
      ]
    }
  ];

  sendPostMessages(avkashUserInfo, avkashUserInfo.slackId, text);

  whoGetNotified.map((manager: any) => {
    sendPostMessages(avkashUserInfo, manager, `Leave Request`, blocks);
    return null
  })
  return new NextResponse(null, { status: 200 });
}




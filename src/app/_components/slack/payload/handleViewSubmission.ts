import { applyLeave, fetchIsHalfDay, fetchOrgWorkWeek, getLeaveDetails, getNotifiedUser, getUserDataBasedOnUUID, updateLeaveStatus } from "../../header/_components/actions";
import { avkashUserInfoProps } from "../../../api/slack/route"
import { NextResponse } from "next/server";
import { sendPostMessages } from "../sendMessages";
import { log } from "node:console";
import { calculateWorkingDays } from "../createCommonModalBlocks";

export async function handleViewSubmission(view: any, avkashUserInfo: avkashUserInfoProps) {
  const whoGetNotified = await getNotifiedUser(avkashUserInfo.teamId, avkashUserInfo.orgId);
  // const updates_channel_Id = 'C06GP1QCS0Y';
  // const managerSlackId = await getManagerIds(avkashUserInfo.orgId);
  const managerSlackId = avkashUserInfo.slackId;
  const startDate = view?.state?.values?.start_date_block?.start_date?.selected_date;
  const endDate = view?.state?.values?.end_date_block?.end_date?.selected_date;
  const duration_temp = view?.state?.values?.day_type_block?.day_type?.selected_option?.value;
  const shift_temp = view?.state?.values?.shift_type_block?.shift_type?.selected_option?.value;
  let duration = '';
  let shift = '';
  if (duration_temp == 'full_day') {
    duration = 'FULL_DAY';
  } else if (duration_temp == 'half_day') {
    duration = 'HALF_DAY';
  }
  const leaveType = view?.state?.values?.type_block?.leave_type?.selected_option?.value;
  const leaveTypeName = view?.state?.values?.type_block?.leave_type?.selected_option?.text.text;
  const leaveReason = view?.state?.values?.notes_block?.notes?.value;
  const isApproved = 'PENDING';
  let text = '';
  let appliedUserId = '';
  let applyiedUserName = '';
  let applylingTeam = '';
  let channelId = '';
  const callback_id = view?.callback_id;

  if (callback_id == 'add-leave') {
    applylingTeam = view?.state?.values?.select_team_block?.select_team?.selected_option?.value;
    const dynamicUserBlockId = `select_user_block_${applylingTeam}`;
    const userBlockId = dynamicUserBlockId in view.state.values ? dynamicUserBlockId : 'select_user_block';
    appliedUserId = view?.state?.values?.[userBlockId]?.select_user?.selected_option?.value;
    const appliedUserSlackId = await getUserDataBasedOnUUID(appliedUserId);
    applyiedUserName = view?.state?.values?.select_user_block?.select_user?.selected_option?.text?.text;
    channelId = managerSlackId;
    text = `Leave apply for <@${appliedUserSlackId.slackId}> from ${startDate} to ${endDate} has been successfully`;
  }
  // it will when manager is reviewing and approving/reject leave request
  else if (callback_id.startsWith('review_leave_')) {
    const leaveId = callback_id.split("review_leave_")[1];
    const leaveDetailsList: any = await getLeaveDetails(leaveId);
    const leaveDetails = leaveDetailsList[0]
    const appliedUserSlackId = leaveDetails.User.slackId;
    const isReviewApproved = view?.state?.values?.approve_reject_block?.approve_reject_type.selected_option?.value;
    const mngrNotes = view?.state?.values?.mngr_notes_block?.mngr_notes?.value;
    const msgForUser = `Hey <@${avkashUserInfo.slackId}>! your leave from ${startDate} to ${endDate} has been ${isReviewApproved == 'approve' ? `Approved` : 'Rejected'}\n\nChek comments: ${mngrNotes}`;
    shift = shift_temp ? shift_temp : 'NONE';
    const allFields = { leaveType, startDate, endDate, duration, shift: shift, isApproved: `${isReviewApproved === "approve" ? "APPROVED" : "REJECTED"}`, reason: leaveReason, managerComment: mngrNotes };
    const workWeekData: any = await fetchOrgWorkWeek(avkashUserInfo.orgId)
    const leaveCalculate: any = await calculateWorkingDays(avkashUserInfo.orgId, startDate, endDate, leaveType, workWeekData, leaveDetails.User.accruedLeave, leaveDetails.User.usedLeave);
    const leaveCount: number = leaveCalculate[0];
    const newAccuredBalance: number = Number(leaveDetails.User.accruedLeave[leaveType]?.balance) - leaveCount;
    const newUsedBalance: number = Number(leaveDetails.User.usedLeave[leaveType]?.balance) + Number(leaveCount);
    const newAccruedLeaveObj = {
      ...leaveDetails.User.accruedLeave,
      [leaveType]: {
        balance: newAccuredBalance
      }
    };
    const newUsedLeaveObj = {
      ...leaveDetails.User.usedLeave,
      [leaveType]: {
        balance: newUsedBalance
      }
    };
    await updateLeaveStatus(leaveId, allFields, newAccruedLeaveObj, newUsedLeaveObj, leaveDetails.userId);
    sendPostMessages(avkashUserInfo, appliedUserSlackId, msgForUser);
    sendPostMessages(avkashUserInfo, managerSlackId, `Leaves applied for <@${appliedUserSlackId}> from ${leaveDetails[0].Team.name} from ${startDate} to ${endDate} has been ${isReviewApproved == 'approve' ? "Approved" : "Rejected"}`);
    return new NextResponse(null, { status: 200 })
  }
  else {
    appliedUserId = avkashUserInfo.userId;
    applylingTeam = avkashUserInfo.teamId;
    text = `Your Leave apply from ${startDate} to ${endDate} has been submitted successfully`;
    channelId = avkashUserInfo.slackId;
  }

  if (startDate === endDate) {
    shift = shift_temp ? shift_temp : 'NONE';
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
              "text": `Leave Request\n\nTeam:  ${appliedLeaveDetails.Team.name}\nUser:  ${appliedLeaveDetails.User.name}\nEmail: ${appliedLeaveDetails.User.email}\nFrom: ${appliedLeaveDetails.startDate}\nTo: ${appliedLeaveDetails.endDate}\nType: ${leaveTypeName}\nReason: ${leaveReason ? leaveReason : ""}`,
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




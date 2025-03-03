import { NextResponse } from 'next/server';
import {
  applyLeave,
  fetchIsHalfDay,
  fetchOrgWorkWeek,
  getLeaveDetails,
  getNotifiedUser,
  getUserDataBasedOnUUID,
  updateLeaveStatus,
} from '../../../../_components/header/_components/actions';
import { sendPostMessages } from '../sendMessages';
import { calculateWorkingDays } from '../createCommonModalBlocks';
import { avkashUserInfoProps } from '../../route';

export async function handleViewSubmission(
  view: any,
  avkashUserInfo: avkashUserInfoProps
) {
  let whoGetNotified;
  // const updates_channel_Id = 'C06GP1QCS0Y';
  // const managerSlackId = await getManagerIds(avkashUserInfo.orgId);
  const managerSlackId = avkashUserInfo.slackId;
  const startDate =
    view?.state?.values?.start_date_block?.start_date?.selected_date;
  const endDate = view?.state?.values?.end_date_block?.end_date?.selected_date;
  const duration_temp =
    view?.state?.values?.day_type_block?.day_type?.selected_option?.value;
  const shift_temp =
    view?.state?.values?.shift_type_block?.shift_type?.selected_option?.value;
  let duration = '';
  let shift = '';
  if (duration_temp == 'full_day') {
    duration = 'FULL_DAY';
  } else if (duration_temp == 'half_day') {
    duration = 'HALF_DAY';
  }
  const leaveType =
    view?.state?.values?.type_block?.leave_type?.selected_option?.value;
  const leaveTypeName =
    view?.state?.values?.type_block?.leave_type?.selected_option?.text.text;
  const leaveReason = view?.state?.values?.notes_block?.notes?.value;
  const isApproved = 'PENDING';
  let text = '';
  let appliedUserId = '';
  let applyiedUserName = '';
  let applylingTeam = '';
  let channelId = '';
  const callback_id = view?.callback_id;

  if (callback_id == 'add-leave') {
    applylingTeam =
      view?.state?.values?.select_team_block?.select_team?.selected_option
        ?.value;
    const dynamicUserBlockId = `select_user_block_${applylingTeam}`;
    const userBlockId =
      dynamicUserBlockId in view.state.values
        ? dynamicUserBlockId
        : 'select_user_block';
    appliedUserId =
      view?.state?.values?.[userBlockId]?.select_user?.selected_option?.value;

    const [appliedUserSlackId, whoGetNotified_temp] = await Promise.all([
      getUserDataBasedOnUUID(appliedUserId),
      getNotifiedUser(
        avkashUserInfo.Organisation.notificationToWhom,
        avkashUserInfo.teamId,
        avkashUserInfo.orgId
      ),
    ]);
    whoGetNotified = whoGetNotified_temp;
    applyiedUserName =
      view?.state?.values?.select_user_block?.select_user?.selected_option?.text
        ?.text;
    channelId = managerSlackId;
    text = `Leave apply for <@${appliedUserSlackId.slackId}> from ${startDate} to ${endDate} has been successfully`;
  }
  // it will when manager is reviewing and approving/reject leave request
  else if (callback_id.startsWith('review_leave_')) {
    const leaveId = callback_id.split('review_leave_')[1];

    const [leaveDetailsList, whoGetNotified_temp, workWeekData]: [
      any,
      any,
      any,
    ] = await Promise.all([
      getLeaveDetails(leaveId),
      getNotifiedUser(
        avkashUserInfo.Organisation.notificationToWhom,
        avkashUserInfo.teamId,
        avkashUserInfo.orgId
      ),
      fetchOrgWorkWeek(avkashUserInfo.orgId),
    ]);
    whoGetNotified = whoGetNotified_temp;
    const leaveDetails = leaveDetailsList[0];
    const appliedUserSlackId = leaveDetails.User.slackId;
    const isReviewApproved =
      view?.state?.values?.approve_reject_block?.approve_reject_type
        .selected_option?.value;
    const mngrNotes = view?.state?.values?.mngr_notes_block?.mngr_notes?.value;
    const msgForUser = `Hey <@${appliedUserSlackId}>! your leave from ${startDate} to ${endDate} has been ${isReviewApproved == 'approve' ? `Approved` : 'Rejected'}\n\nChek comments: ${mngrNotes}`;
    shift = shift_temp || 'NONE';
    const allFields = {
      leaveType,
      startDate,
      endDate,
      duration,
      shift,
      isApproved: `${isReviewApproved === 'approve' ? 'APPROVED' : 'REJECTED'}`,
      reason: leaveReason,
      managerComment: mngrNotes,
    };
    const [res, count, isLeaveInAccured]: [string, number, boolean] =
      await calculateWorkingDays(
        avkashUserInfo.orgId,
        startDate,
        endDate,
        leaveType,
        workWeekData,
        leaveDetails.User.accruedLeave,
        leaveDetails.User.usedLeave
      );
    // const leaveCalculate: any = await calculateWorkingDays(avkashUserInfo.orgId, startDate, endDate, leaveType, workWeekData, leaveDetails.User.accruedLeave, leaveDetails.User.usedLeave);
    const leaveCount: number = count;
    const newAccuredBalance: number =
      Number(leaveDetails.User.accruedLeave[leaveType]?.balance) - leaveCount;
    const newUsedBalance: number =
      Number(leaveDetails.User.usedLeave[leaveType]?.balance) +
      Number(leaveCount);
    const newAccruedLeaveObj = {
      ...leaveDetails.User.accruedLeave,
      [leaveType]: {
        balance: newAccuredBalance,
      },
    };
    const newUsedLeaveObj = {
      ...leaveDetails.User.usedLeave,
      [leaveType]: {
        balance: newUsedBalance,
      },
    };
    await updateLeaveStatus(
      leaveId,
      allFields,
      isLeaveInAccured ? newAccruedLeaveObj : leaveDetails.User.accruedLeave,
      isLeaveInAccured
        ? newUsedLeaveObj
        : leaveDetails.User.usedLeave[leaveType],
      leaveDetails.userId
    );
    sendPostMessages(avkashUserInfo, appliedUserSlackId, msgForUser);
    sendPostMessages(
      avkashUserInfo,
      managerSlackId,
      `Leaves applied for <@${appliedUserSlackId}> from ${leaveDetails.Team.name} from ${startDate} to ${endDate} has been ${isReviewApproved == 'approve' ? 'Approved' : 'Rejected'}`
    );
    return new NextResponse(null, { status: 200 });
  } else {
    const [whoGetNotified_temp] = await Promise.all([
      getNotifiedUser(
        avkashUserInfo.Organisation.notificationToWhom,
        avkashUserInfo.teamId,
        avkashUserInfo.orgId
      ),
    ]);
    whoGetNotified = whoGetNotified_temp;
    appliedUserId = avkashUserInfo.userId;
    applylingTeam = avkashUserInfo.teamId;
    text = `Your Leave apply from ${startDate} to ${endDate} has been submitted successfully`;
    channelId = avkashUserInfo.slackId;
  }

  if (startDate === endDate) {
    shift = shift_temp || 'NONE';
  } else {
    shift = 'NONE';
    duration = 'FULL_DAY';
  }
  const leaveDetails: any = await applyLeave(
    leaveType,
    startDate,
    endDate,
    duration,
    shift,
    isApproved,
    appliedUserId,
    applylingTeam,
    leaveReason,
    avkashUserInfo.orgId
  );
  const leaveId = leaveDetails[0].leaveId;
  const appliedLeaveDetailsList: any = await getLeaveDetails(leaveId);
  const appliedLeaveDetails = appliedLeaveDetailsList[0];

  const blocks: any = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'New Leave Request',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Name*: ${appliedLeaveDetails.User.name} (${appliedLeaveDetails.Team.name})\n*Email*: ${appliedLeaveDetails.User.email}\n\n*Date*: ${appliedLeaveDetails.startDate} - ${appliedLeaveDetails.endDate}\n*Type*: ${leaveTypeName}\n*Reason*: ${leaveReason || ''}`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Review',
            emoji: true,
          },
          action_id: `review_${leaveId}`,
          style: 'primary',
        },
      ],
    },
    {
      type: 'divider',
    },
  ];

  sendPostMessages(avkashUserInfo, avkashUserInfo.slackId, text);

  whoGetNotified.map((manager: any) => {
    sendPostMessages(avkashUserInfo, manager, `Leave Request`, blocks);
    return null;
  });
  return new NextResponse(null, { status: 200 });
}

import { avkashUserInfoProps } from '@/app/api/slack/route';
import { NextResponse } from 'next/server';
import {
  getLeaveDetails,
  updateLeaveStatus,
} from '@/app/_components/header/_components/actions';
import { sendPostMessages } from '../sendMessages';

export async function handleApproveReviewLeave(
  avkashUserInfo: avkashUserInfoProps,
  action_id: any,
  view: any
) {
  const leaveId = action_id.split('approve_leave_')[1];
  const startDate =
    view?.state?.values?.start_date_block?.start_date?.selected_date;
  const endDate = view?.state?.values?.end_date_block?.end_date?.selected_date;
  const duration_temp =
    view?.state?.values?.day_type_block?.day_type?.selected_option?.value;

  let duration = '';
  if (duration_temp == 'full_day') {
    duration = 'FULL_DAY';
  } else if (duration_temp == 'half_day') {
    duration = 'HALF_DAY';
  }
  const leaveType =
    view?.state?.values?.type_block?.type?.selected_option?.value;
  const leaveReason = view?.state?.values?.leave_reason_block?.notes?.value;
  const mngrNotes = view?.state?.values?.manager_reason_block?.notes?.value;
  const isApproved = 'APPROVED';

  const allFields: any = {
    leaveType,
    startDate,
    endDate,
    duration,
    shift: 'NONE',
    isApproved,
    reason: leaveReason,
  };

  const fetchLeaev: any = await getLeaveDetails(leaveId);
  const user_slack_id = fetchLeaev[0].User.slackId;
  const user_name = fetchLeaev[0].User.name;

  // await updateLeaveStatus(leaveId, allFields);
  await updateLeaveStatus(leaveId, allFields, 'world', 'hello', 'hi');
  sendPostMessages(
    avkashUserInfo,
    user_slack_id,
    `Hey <@${user_name}> your leave from ${startDate} to ${endDate} is Approved`
  );

  return new NextResponse('leave approved', { status: 200 });
}

import { avkashUserInfoProps } from "@/app/api/slack/route";
import { fetchOrgWorkWeek, getLeaveDetails } from "../../header/_components/actions";
import { createCommonModalBlocks } from "../createCommonModalBlocks";
import { NextResponse } from "next/server";
import { openView } from "../sendMessages";
import { act } from "react";

export default async function reviewLeave(avkashUserInfo: avkashUserInfoProps, action_id: string, leaveId: string, trigger_id: any) {




  const leavesList: any = await getLeaveDetails(leaveId);
  const leaveDetails = leavesList[0];
  const start_dateFormat = new Date(leaveDetails.startDate);
  const end_dateFormat = new Date(leaveDetails.endDate);
  const start_date = start_dateFormat.toISOString().slice(0, 10)
  const end_date = end_dateFormat.toISOString().slice(0, 10);
  let durationText: string = '';
  let durationValue: string = '';

  // const leaveTypeOptions = [
  //   { text: { type: 'plain_text', text: 'Sick Leave' }, value: 'sick' },
  //   { text: { type: 'plain_text', text: 'Paid Leave' }, value: 'paid' },
  //   { text: { type: 'plain_text', text: 'Test Leave' }, value: 'test' },
  // ];

  // let initial_leaveType: any = ''

  // if (leaveDetails.leaveType == 'sick') {
  //   initial_leaveType = leaveTypeOptions[0]
  // } else if (leaveDetails.leaveType == 'paid') {
  //   initial_leaveType = leaveTypeOptions[1]
  // } else {
  //   initial_leaveType = leaveTypeOptions[2]
  // }

  if (leaveDetails.duration == 'FULL_DAY') {
    durationText = "Full Day";
    durationValue = 'full_day';
  } else {
    durationText = "Half Day";
    durationValue = 'half_day';
  }
  const initial_radio_option = {
    text: { type: 'plain_text', text: durationText },
    value: durationValue
  }

  // const totalAvailableLeaves = await calculateWorkingDays(start_dateFormat, end_dateFormat, leaveDetails.leaveType, leaveDetails.User.accruedLeave, leaveDetails.User.usedLeave);
  // const commonBlocks = await createCommonModalBlocks(avkashUserInfo, start_date, end_date, initial_radio_option, leaveDetails.leaveType, leaveDetails.reason,leaveId);
  const commonBlocks = await createCommonModalBlocks({avkashUserInfo,checkLeaveType:false,leaveId});

  const review_model_view: any = {
    type: 'modal',
    callback_id: `review_leave_${leaveId}`,
    title: { type: 'plain_text', text: 'Edit Leave' },
    submit: { type: 'plain_text', text: 'Submit', emoji: true },
    blocks: [
      {
        "type": "rich_text",
        "elements": [
          {
            "type": "rich_text_quote",
            "elements": [
              {
                "type": "text",
                "text": `Team:  ${leaveDetails.Team.name} \n\nUser:  ${leaveDetails.User.name} \n\nEmail: ${leaveDetails.User.email}`,
              },
            ]
          },
        ]
      },
      // can use commonmodel
      ...commonBlocks,
      {
        type: 'input',
        block_id: 'mngr_notes_block',
        element: {
          type: 'plain_text_input',
          action_id: 'mngr_notes',
          placeholder: { type: 'plain_text', text: 'your review comments' }
        },
        label: { type: 'plain_text', text: 'Manager notes' }
      },
      {
        type: 'input',
        block_id: 'approve_reject_block',
        element: {
          type: 'radio_buttons',
          action_id: 'approve_reject_type',
          options: [
            {
              text: { type: 'plain_text', text: 'approve' },
              value: 'approve'
            },
            {
              text: { type: 'plain_text', text: 'reject' },
              value: 'reject'
            },

          ],
        },
        label: { type: 'plain_text', text: 'Approve/Reject' }
      },

    ],
  };
  openView(trigger_id, review_model_view)
  return new NextResponse("opened leave review modal", { status: 200 });

}
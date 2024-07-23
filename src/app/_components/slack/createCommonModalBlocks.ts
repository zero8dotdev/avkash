import { avkashUserInfoProps } from "@/app/api/slack/route";
import { fetchOrgWorkWeek, getLeaveDetails, getLeaveTypes, getUserDataBasedOnUUID } from "../header/_components/actions";

interface commonModelProps {
  avkashUserInfo: avkashUserInfoProps,
  checkLeaveType: boolean,
  leaveId?: string,
  payload?: any
}


export async function createCommonModalBlocks({ avkashUserInfo, checkLeaveType, leaveId, payload }: commonModelProps) {
  let startDate: string = '';
  let endDate: string = '';
  let leaveType: string = '';
  let userDetails: any;
  let durationText: string = '';
  let durationValue: string = '';

  if (payload) {


  }
  // this one for review leave
  const leavesList: any = leaveId && await getLeaveDetails(leaveId);
  const leaveDetails = leavesList && leavesList[0];
  if (leaveId) {
    const startDateFormat = new Date(leaveDetails.startDate);
    const end_dateFormat = new Date(leaveDetails.endDate);
    startDate = startDateFormat.toISOString().slice(0, 10)
    endDate = end_dateFormat.toISOString().slice(0, 10);
    if (leaveDetails.duration == 'FULL_DAY') {
      durationText = "Full Day";
      durationValue = 'full_day';
    } else {
      durationText = "Half Day";
      durationValue = 'half_day';
    }

  }

  const initial_radio_option = {
    text: { type: 'plain_text', text: durationText },
    value: durationValue
  }

  const leaveTypesList: any = await getLeaveTypes(avkashUserInfo.orgId);
  let initialLeaveType: any;
  const leaveTypes = leaveTypesList.map((leave: { leaveTypeId: String, name: string }) => {

    const res = {
      "text": {
        "type": "plain_text",
        "text": leave.name,
        "emoji": true
      },
      "value": leave.name
    };
    if (leaveId) {
      if (leaveDetails.leaveType === leave.name) {
        initialLeaveType = res
      }
    }
    return res
  })

  const blocks: any[] = [

    {
      type: 'input',
      block_id: 'start_date_block',
      element: {
        type: 'datepicker',
        initial_date: leaveId && startDate,
        action_id: 'start_date',
        placeholder: { type: 'plain_text', text: 'Select a start date' }
      },
      label: { type: 'plain_text', text: 'Start Date' }
    },
    {
      type: 'input',
      block_id: 'end_date_block',
      element: {
        type: 'datepicker',
        initial_date: leaveId && endDate,
        action_id: `end_date`,
        placeholder: { type: 'plain_text', text: 'Select an end date' },
      },
      label: { type: 'plain_text', text: 'End Date' }
    },
    {
      type: 'input',
      block_id: 'day_type_block',
      element: {
        type: 'radio_buttons',
        action_id: 'day_type',
        options: [
          {
            text: { type: 'plain_text', text: 'Full Day' },
            value: 'full_day'
          },
          {
            text: { type: 'plain_text', text: 'Half Day' },
            value: 'half_day'
          },

        ],
        initial_option: leaveId && initial_radio_option,
      },
      label: { type: 'plain_text', text: 'Day Type' }
    },
    {
      type: 'input',
      dispatch_action: true,
      block_id: 'type_block',
      element: {
        type: 'static_select',
        action_id: 'leave_type',
        placeholder: { type: 'plain_text', text: 'Select leave type' },
        options: leaveTypes,
        initial_option: leaveId && initialLeaveType,
      },
      label: { type: 'plain_text', text: 'Leave Type' }
    },
    {
      type: 'input',
      block_id: 'notes_block',
      optional: true,
      element: {
        type: 'plain_text_input',
        initial_value: leaveId ? leaveDetails.reason : '',
        action_id: 'notes',
        placeholder: { type: 'plain_text', text: 'Enter any notes' }
      },
      label: { type: 'plain_text', text: 'Notes' }
    }
  ]

  if (checkLeaveType && payload) {
    const values = payload?.view?.state?.values;
    const selectedUserId = values.select_user_block ? values.select_user_block.select_user.selected_option.value: avkashUserInfo.userId;
    startDate = values.start_date_block.start_date.selected_date;
    endDate = values.end_date_block.end_date.selected_date;
    leaveType = values.type_block.leave_type.selected_option.value;
    userDetails = await getUserDataBasedOnUUID(selectedUserId);
    
    const res = await calculateWorkingDays(avkashUserInfo.orgId, startDate, endDate, leaveType, userDetails.accruedLeave, userDetails.usedLeave);
    blocks.splice(4, 0, {
      "type": "context",
      "elements": [
        {
          type: "mrkdwn",
          text: `:warning: *${res}*`,
        }
      ]
    },)
  }

  return blocks
}

export async function calculateWorkingDays(orgId: string, startDate: string, endDate: string, leaveType: string, accruedLeave: { [key: string]: number }, usedLeave: { [key: string]: number }) {
  let availableLeaves;
  const workWeek = await fetchOrgWorkWeek(orgId);
  const daysMap: { [key: string]: number } = {
    "SUNDAY": 0,
    "MONDAY": 1,
    "TUESDAY": 2,
    "WEDNESDAY": 3,
    "THURSDAY": 4,
    "FRIDAY": 5,
    "SATURDAY": 6,
  };

  const workWeekNumbers = workWeek.map((day: string) => daysMap[day]);
  let count = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= new Date(endDate)) {
    const dayOfWeek = currentDate.getDay();
    if (workWeekNumbers.includes(dayOfWeek)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  if (leaveType === 'sick' || leaveType === 'Sick') {
    availableLeaves = 'you have unlimited sick leaves';
  }
  else {
    if (count > accruedLeave['Paid time off']) {
      availableLeaves = `applied leaves are exceeding the avaliable accrued leave count \n you have ${accruedLeave["Paid time off"]} available leaves`;
    } else {
      availableLeaves = `${count} applied leaves will be deducted from ${accruedLeave['Paid time off']} avaliable accrued leaves\n you have ${accruedLeave["Paid time off"]} available leaves`;
    }
  }
  return availableLeaves;

}









































// import { avkashUserInfoProps } from "@/app/api/slack/route";
// import { fetchOrgWorkWeek, getLeaveDetails, getLeaveTypes, getUserDataBasedOnUUID } from "../header/_components/actions";

// interface commonModelProps {
//   avkashUserInfo: avkashUserInfoProps,
//   isEndBlock: boolean,
//   leaveId?: string,
//   payload?: any
// }


// export async function createCommonModalBlocks({ avkashUserInfo, isEndBlock, leaveId, payload }: commonModelProps) {

//   let startDate: string = '';
//   let endDate: string = '';
//   let durationText: string = '';
//   let durationValue: string = '';
//   const leavesList: any = leaveId && await getLeaveDetails(leaveId);
//   const leaveDetails = leavesList && leavesList[0];
//   if (leaveId) {

//     const startDateFormat = new Date(leaveDetails.startDate);
//     const end_dateFormat = new Date(leaveDetails.endDate);
//     startDate = startDateFormat.toISOString().slice(0, 10)
//     endDate = end_dateFormat.toISOString().slice(0, 10);
//     if (leaveDetails.duration == 'FULL_DAY') {
//       durationText = "Full Day";
//       durationValue = 'full_day';
//     } else {
//       durationText = "Half Day";
//       durationValue = 'half_day';
//     }

//   }

//   const initial_radio_option = {
//     text: { type: 'plain_text', text: durationText },
//     value: durationValue
//   }

//   const leaveTypesList: any = await getLeaveTypes(avkashUserInfo.orgId);
//   let initialLeaveType: any;
//   const leaveTypes = leaveTypesList.map((leave: { leaveTypeId: String, name: string }) => {

//     const res = {
//       "text": {
//         "type": "plain_text",
//         "text": leave.name,
//         "emoji": true
//       },
//       "value": leave.name
//     };
//     if (leaveId) {
//       if (leaveDetails.leaveType === leave.name) {
//         initialLeaveType = res
//       }
//     }
//     return res
//   })

//   const blocks: any[] = [
//     {
//       type: 'input',
//       block_id: 'day_type_block',
//       element: {
//         type: 'radio_buttons',
//         action_id: 'day_type',
//         options: [
//           {
//             text: { type: 'plain_text', text: 'Full Day' },
//             value: 'full_day'
//           },
//           {
//             text: { type: 'plain_text', text: 'Half Day' },
//             value: 'half_day'
//           },

//         ],
//         initial_option: leaveId && initial_radio_option,
//       },
//       label: { type: 'plain_text', text: 'Day Type' }
//     },
//     {
//       type: 'input',
//       block_id: 'type_block',
//       element: {
//         type: 'static_select',
//         action_id: 'type',
//         placeholder: { type: 'plain_text', text: 'Select leave type' },
//         options: leaveTypes,
//         initial_option: leaveId && initialLeaveType,
//       },
//       label: { type: 'plain_text', text: 'Leave Type' }
//     },
//     {
//       type: 'input',
//       block_id: 'start_date_block',
//       element: {
//         type: 'datepicker',
//         initial_date: leaveId && startDate,
//         action_id: 'start_date',
//         placeholder: { type: 'plain_text', text: 'Select a start date' }
//       },
//       label: { type: 'plain_text', text: 'Start Date' }
//     },
//     {
//       type: 'input',
//       dispatch_action: true,
//       block_id: 'end_date_block',
//       element: {
//         type: 'datepicker',
//         initial_date: leaveId && endDate,
//         action_id: `end_date`,
//         placeholder: { type: 'plain_text', text: 'Select an end date' },
//       },
//       label: { type: 'plain_text', text: 'End Date' }
//     },
//     {
//       type: 'input',
//       block_id: 'notes_block',
//       optional: true,
//       element: {
//         type: 'plain_text_input',
//         initial_value: leaveId ? leaveDetails.reason : '',
//         action_id: 'notes',
//         placeholder: { type: 'plain_text', text: 'Enter any notes' }
//       },
//       label: { type: 'plain_text', text: 'Notes' }
//     }
//   ]

//   if (isEndBlock) {
//     const selectedUserId = payload?.view?.state?.values.select_user_block.select_user.selected_option.value;
//     const startDate = payload?.view?.state?.values.start_date_block.start_date.selected_date;
//     const endDate = payload?.view?.state?.values.end_date_block.end_date.selected_date;
//     const leaveType = payload?.view?.state?.values.type_block.type.selected_option.value;

//     const userDetails = await getUserDataBasedOnUUID(selectedUserId);

//     const res = await calculateWorkingDays(avkashUserInfo.orgId, startDate, endDate, leaveType, userDetails.accruedLeave, userDetails.usedLeave);
//     blocks.splice(4, 0, {
//       "type": "context",
//       "elements": [
//         {
//           type: "mrkdwn",
//           text: `:warning: *${res}*`,
//         }
//       ]
//     },)
//   }

//   return blocks
// }

// export async function calculateWorkingDays(orgId: string, startDate: string, endDate: string, leaveType: string, accruedLeave: { [key: string]: number }, usedLeave: { [key: string]: number }) {
//   let availableLeaves;
//   const workWeek = await fetchOrgWorkWeek(orgId);
//   const daysMap: { [key: string]: number } = {
//     "SUNDAY": 0,
//     "MONDAY": 1,
//     "TUESDAY": 2,
//     "WEDNESDAY": 3,
//     "THURSDAY": 4,
//     "FRIDAY": 5,
//     "SATURDAY": 6,
//   };

//   const workWeekNumbers = workWeek.map((day: string) => daysMap[day]);
//   let count = 0;
//   const currentDate = new Date(startDate);

//   while (currentDate <= new Date(endDate)) {
//     const dayOfWeek = currentDate.getDay();
//     if (workWeekNumbers.includes(dayOfWeek)) {
//       count++;
//     }
//     currentDate.setDate(currentDate.getDate() + 1);
//   }
//   if (leaveType === 'sick' || leaveType === 'Sick') {
//     availableLeaves = 'unlimited';
//   }
//   else {
//     if (count > accruedLeave['Paid time off']) {
//       availableLeaves = `applied leaves are exceeding the avaliable accrued leave count \n you have ${accruedLeave["Paid time off"]} available leaves`;
//     } else {
//       availableLeaves = `${count} applied leaves will be deducted from ${accruedLeave['Paid time off']} avaliable accrued leaves\n you have ${accruedLeave["Paid time off"]} available leaves`;
//     }
//   }
//   return availableLeaves;

// }
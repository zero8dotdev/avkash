import { avkashUserInfoProps } from "@/app/api/slack/route";
import { fetchOrgWorkWeek, getLeaveDetails, getLeaveTypes, fetchHolidays, getUserDataBasedOnUUID, getLeaveTypeDetails, fetchIsHalfDay } from "../../../_components/header/_components/actions";

interface commonModelProps {
  avkashUserInfo: avkashUserInfoProps,
  checkLeaveType: boolean,
  leaveId?: string,
  payload?: any,
  callbackId?: string,
  values?: any
}

export interface WorkWeekDataProps {
  location: string;
  workweek: string[];
}

export async function createCommonModalBlocks({ avkashUserInfo, checkLeaveType, leaveId, payload, callbackId, values }: commonModelProps) {
  let startDate: string = '';
  let endDate: string = '';
  let leaveType: string = '';
  let userDetails: any;
  let durationText: string = '';
  let durationValue: string = '';
  let shift: string = '';
    const [leavesList, leaveTypesList, workWeekData, isHalfDayAllowed]: [any, any, WorkWeekDataProps | null, boolean] = await Promise.all([
    leaveId ? getLeaveDetails(leaveId) : null,
    getLeaveTypes(avkashUserInfo.orgId),
    fetchOrgWorkWeek(avkashUserInfo.orgId),
    fetchIsHalfDay(avkashUserInfo.orgId),
  ]);
  // this one for review leave
  const leaveDetails = leavesList && leavesList[0];
  if (leaveId) {
    shift = leaveDetails.shift;
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

  const initial_shift_value = {
    text: { type: 'plain_text', text: shift.charAt(0).toUpperCase() + shift.slice(1) },
    value: shift
  };
  let initialLeaveType: any;
  const leaveTypes = leaveTypesList && leaveTypesList.map((leave: { leaveTypeId: String, name: string }) => {
    const res = {
      "text": {
        "type": "plain_text",
        "text": leave.name,
        "emoji": true
      },
      "value": leave.leaveTypeId
    };
    if (leaveId) {
      if (leaveDetails.leaveType === leave.leaveTypeId) {
        initialLeaveType = res
      }
    }
    return res
  })

  const dayAndShiftTypeBlocks = () => {
    return [
      {
        type: 'input',
        block_id: 'day_type_block',
        element: {
          type: 'radio_buttons',
          action_id: 'day_type',
          options: [
            {
              text: { type: 'plain_text', text: 'Full Day' },
              value: 'full_day',
            },
            ...(isHalfDayAllowed
              ? [
                  {
                    text: { type: 'plain_text', text: 'Half Day' },
                    value: 'half_day',
                  },
                ]
              : []),
          ],
          initial_option: leaveId && initial_radio_option,
        },
        label: { type: 'plain_text', text: 'Day Type' },
      },
      ...(isHalfDayAllowed
        ? [
            {
              type: 'input',
              block_id: 'shift_type_block',
              element: {
                type: 'radio_buttons',
                action_id: 'shift_type',
                options: [
                  {
                    text: { type: 'plain_text', text: 'NONE' },
                    value: 'NONE',
                  },
                  {
                    text: { type: 'plain_text', text: 'Morning' },
                    value: 'MORNING',
                  },
                  {
                    text: { type: 'plain_text', text: 'Afternoon' },
                    value: 'AFTERNOON',
                  },
                ],
                initial_option: leaveId && initial_shift_value,
              },
              label: { type: 'plain_text', text: 'Shift' },
            },
          ]
        : []),
    ];
  };

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
    // day type block

    ...dayAndShiftTypeBlocks(),
    // below block is for leave Type
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
      element: {
        type: 'plain_text_input',
        initial_value: leaveId ? leaveDetails.reason ? leaveDetails.reason : '' : '',
        action_id: 'notes',
        placeholder: { type: 'plain_text', text: 'Enter any notes' }
      },
      label: { type: 'plain_text', text: 'Notes' },
      optional: true
    }
  ]

  if (checkLeaveType && payload) {
  const values = payload?.view?.state?.values;
    const selectedUserId = values.select_user_block ? values.select_user_block.select_user.selected_option.value : avkashUserInfo.userId;
    startDate = values.start_date_block.start_date.selected_date;
    endDate = values.end_date_block.end_date.selected_date;
    leaveType = values.type_block.leave_type.selected_option.value;
    userDetails = await getUserDataBasedOnUUID(selectedUserId);
    const [res,count,isLeaveInAccured]:[string,number,boolean] = await calculateWorkingDays(avkashUserInfo.orgId, startDate, endDate, leaveType, workWeekData, userDetails.accruedLeave, userDetails.usedLeave);
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

  if (leaveId) {
    // this wil get trigger when manager changes leaveType after opened review modal
    if (callbackId?.startsWith('review_leave_')) {
      const [res,count,isLeaveInAccured]:[string,number,boolean] = await calculateWorkingDays(avkashUserInfo.orgId, startDate, endDate, values, workWeekData, leaveDetails.User.accruedLeave, leaveDetails.User.usedLeave);
    blocks.splice(5, 0, {
        "type": "context",
        "elements": [
          {
            type: "mrkdwn",
            text: `:warning: *${res}*`,
          }
        ]
      },)
    } else {
      // this is for review when manager clicks on review card
      const [res,count,isLeaveInAccured]:[string,number,boolean] = await calculateWorkingDays(avkashUserInfo.orgId, startDate, endDate, leaveDetails.leaveType, workWeekData, leaveDetails.User.accruedLeave, leaveDetails.User.usedLeave);
      blocks.splice(5, 0, {
        "type": "context",
        "elements": [
          {
            type: "mrkdwn",
            text: `:warning: *${res}*`,
          }
        ]
      },)
    }
  }
  return blocks
}



export async function calculateWorkingDays(orgId: string, startDate: string, endDate: string, leaveType: string, workWeekData: WorkWeekDataProps | null, accruedLeave?: any, usedLeave?: any): Promise<[string,number,boolean]> {

  let availableLeaves: string;
  if (!workWeekData) {
    throw new Error(`No work week data found for organization ID: ${orgId}`);
  }
  const { location, workweek } = workWeekData;
  const daysMap: { [key: string]: number } = {
    "SUNDAY": 0,
    "MONDAY": 1,
    "TUESDAY": 2,
    "WEDNESDAY": 3,
    "THURSDAY": 4,
    "FRIDAY": 5,
    "SATURDAY": 6,
  };

  const [holidays, fetchLeaveTypes]: [any, any] = await Promise.all([fetchHolidays(startDate, endDate, location), getLeaveTypeDetails(leaveType, orgId)])
  const holidaysCount = holidays.length > 0 ? holidays.length : 0;

  const workWeekNumbers = workweek.map((day: string) => daysMap[day]);
  let count: number = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= new Date(endDate)) {
    const dayOfWeek = currentDate.getDay();
    if (workWeekNumbers.includes(dayOfWeek)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  count = count - holidaysCount;
  const isUnlimited = fetchLeaveTypes?.LeavePolicy[0]?.unlimited;
let showAccruedLeaves;
  if(accruedLeave[leaveType]){
    showAccruedLeaves = accruedLeave[leaveType].balance;
  }
  if (!usedLeave) {
    return ['',count,false]
  }
  else if (isUnlimited) {
    availableLeaves = 'you have unlimited leaves';
  }
  else if(Object.keys(accruedLeave).includes(leaveType)) {
    if (count > accruedLeave[fetchLeaveTypes.name]) {
      availableLeaves = `applied leaves are exceeding the avaliable accrued leave count \n you have ${accruedLeave[fetchLeaveTypes.name]} available leaves`;
    } else {
      availableLeaves = `${count} applied leaves will be deducted from ${showAccruedLeaves} avaliable accrued leaves\n you have ${showAccruedLeaves} available leaves`;
    }
  }else{
    availableLeaves = `No accrued leaves found for leave type "${fetchLeaveTypes.name}".`;
  }

  const isLeaveInAccured = Object.keys(accruedLeave).includes(leaveType);

  return [availableLeaves,count,isLeaveInAccured];

}


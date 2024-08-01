import { duration } from "moment-timezone";
import { applyLeave, getManagerIds, getLeaveDetails } from "../../header/_components/actions"
import { dateExtract } from "../dateExtract"
import { successLeaveCard } from "./successLeaveCard";
export async function submitLeave(inputData: any, googleUserInfo:any){
    const {dayType, note, leaveType, endDate ,startDate ,selectShift} = inputData
    const start_date = startDate.dateInput.msSinceEpoch;
    const end_date = endDate.dateInput.msSinceEpoch;
    console.log('inputdata startdate', dayType)
    console.log('inputdata startdate', note)
    console.log('inputdata startdate', leaveType)
    console.log('inputdata startdate', startDate)
    console.log('inputdata startdate', endDate)
    console.log('inputdata startdate', selectShift)
    console.log("yede this is the main body", googleUserInfo)

    // const leaveDetails = []
    const numberStartDate = parseInt(start_date);
    const numberEndDate= parseInt(end_date);

// delaring variables
    const updates_channel_Id = 'C06GP1QCS0Y';
    let shiftType = 'FULL_DAY'
    let isApproved= 'PENDING'
    let text= '';
    let appliedUserId = googleUserInfo.userId;
    let applyiedUserName='';
    let applylingTeam=googleUserInfo.teamId;
    let channelId=''
// fetchning data from supabase
const trial = new Date(numberStartDate)

const startFDate= dateExtract(numberStartDate)
const endFDate = dateExtract(numberEndDate)
console.log(`check date bro ${startFDate} and end ${endFDate}`)
const managerId = await getManagerIds(googleUserInfo.orgId)
const shift = selectShift.stringInputs.value[0]
const finalDayType = dayType.stringInputs.value[0]
const leaveFType = leaveType.stringInputs.value[0]
const reason = note.stringInputs.value[0]
if (shift ==='afternoon'){
    shiftType= 'HALF_DAY'
}
// fetching data from input
    if(finalDayType == 'halfDay'){
        shiftType = 'HALF_DAY'
    }
// console.log(`Hello this is the leave type${leaveFType} startDate is like${startFDate} and end date is ${endFDate} and its shift is ${shift} manager is approved ?? --> ${isApproved} with the userId is ${appliedUserId} and its team is ${applylingTeam} due to reson ${reason} with organization is ${googleUserInfo.orgId}`);

const leaveDetails: any =  await applyLeave(leaveFType , startFDate , endFDate , shiftType , isApproved , appliedUserId , applylingTeam, reason ,  googleUserInfo.orgId);
// console.log('these are the current details',leaveDetails)
const leaveId = leaveDetails[0].leaveId;    

// console.log('leave id is here rohit', leaveId)

const appliedLeaveDetailsList: any = await getLeaveDetails(leaveId);
const appliedLeaveDetails = appliedLeaveDetailsList[0];

console.log(`Leave Request\n\nTeam:  ${appliedLeaveDetails.Team.name} \nUser:  ${appliedLeaveDetails.User.name}Email: ${appliedLeaveDetails.User.email}\nFrom: ${appliedLeaveDetails.startDate}\nTo: ${appliedLeaveDetails.endDate}\nType: ${leaveFType}\nReason: ${reason}`)
const managerSlackId = await getManagerIds(googleUserInfo.orgId)
return  appliedLeaveDetails
}

import { googleUserInfoProps } from "@/app/api/home/route";
import { NextResponse } from "next/server";
import {fetchLeavesHistory} from '@/app/_components/slack/handleAppHomeOpened'
import { leaveCard } from "./requestLeaveCard";

interface appHomeOpenedProps {
  googleUserInfo: googleUserInfoProps
}

export async function homeCard( googleUserInfo: googleUserInfoProps){
    let formattedLeavesHistory: any=[]
    let pendingLeaves : any=[];
  // Home buttons 
    let req_button_text : string=''
    let your_team_leave: string =''
    let actionId : string=''
  // user info
    const userName = googleUserInfo.name
    const isManager = googleUserInfo?.isOwner;
    const userId = googleUserInfo.userId
    const teamId = googleUserInfo.teamId
    const googleId = googleUserInfo.googleId

  // Logic for home
    if (!isManager){
        req_button_text = 'Request Leave'
        actionId = 'home_req_leave'
        your_team_leave = 'Your past 7 days leaves magnet';
        const [allLeavesHistory] = await fetchLeavesHistory({userId})
        formattedLeavesHistory = allLeavesHistory
        // console.log("gnani leave History", formattedLeavesHistory)
    }else{
      req_button_text = 'Add Leave';
      actionId = 'add-leave';
      your_team_leave='See your teams past 7 days leavess';
      const [allLeavesHistory , pendingHistory] = await (fetchLeavesHistory({teamId}));
      formattedLeavesHistory = allLeavesHistory
      pendingLeaves = pendingHistory;
    }

    // im skipping the action id and common button block thing 
    // creaeting the leave history page
    const leaveHistoryBlocks = createLeaveHistoryBlock(formattedLeavesHistory);
    const pendingLeavesBlocks = createPendingLeaveBlocks(pendingLeaves)

    const response = new NextResponse(JSON.stringify({
        action: {
            navigations: [
                {
                    pushCard:
                    {  header: {
                        title: `Hello ${userName} Welcome to Avkash.io Chat Bot`,
                        subtitle: "Hello there, welcome to avkash you can make your leaves and leave history",
                      },
                        sections: [
                            
                            {
                                header: "Avkash.io",
                              widgets: [
                                {
                                    decoratedText: {
                                      icon: {
                                        knownIcon: "STAR"
                                      },
                                      text: 'You can manage your leaves from avkash.io. In the chat bot say "hello" to it, it will show you the main functionality of the Avkash '
                                    }
                                },
                                {
                                decoratedText: {
                                    icon: {
                                    knownIcon: "STAR"
                                    },
                                    text: 'You can Apply leave, see the last 7 days data and your leave report also.'
                                }
                                },
                                {
                                    decoratedText: {
                                        icon: {
                                        knownIcon: "STAR"
                                        },
                                        text: 'By clicking on the respective buttons, the form will pop out and you can make changes with respected to it.'
                                    }
                                },
                                  {
                                    "divider": {}
                                },
                                {
                                  textParagraph: {
                                    text: `<b>${your_team_leave}</b>`
                                  }
                                },
                                  ...leaveHistoryBlocks,
                                {
                                  textParagraph : {
                                    text: "<b>Pending Leaves</b>"
                                  }
                                },

                                  ...pendingLeavesBlocks
                                  
                              ]
                            }
                          ]
                    }
                }
            ]
        }
    }), {
        headers: {
            'Content-Type': 'application/json',
            "ngrok-skip-browser-warning": 'konda'
        },
        status: 200
    });

    console.log('Home Tab Response:', response);
    return response; 
}


function createLeaveHistoryBlock(leaves: {leaveId: string , leaveType: any, startDate: any ,endDate: any, duration: string, isApproved: any, userName: string, teamName: any}[]){
  console.log('leaves',leaves[0])
  const resp = leaves.flatMap(leave => (   
      [{
        "decoratedText": {
            icon: {
                knownIcon: "EMAIL"
            },
            topLabel: `<font size="4">${leave.userName} from ${leave.teamName}</font>`,
            text: `${leave.leaveType} from ${leave.startDate} to ${leave.endDate}`,
            bottomLabel: leave.isApproved ? `<font size="9" color=\"#80e27e\">Approved</font>` : `<font size="9" color=\"#FFFF00\">Pending</font>`
        }
    },
    {
        "divider": {}
    }]
    ))
    return resp
}

function createPendingLeaveBlocks(pendingLeaves: {leaveId: string, startDate: string, endDate: string, leaveType: string, userName: string, teamName: string } []){
      if(pendingLeaves.length === 0){
        return [
          {
            "textParagraph": {
              "text": "<font color=\"#0E86D4\"><b>There are no pending leave requests at the moment.</b></font>"
            }
          }
        ]
      }

      return pendingLeaves.flatMap(leave => ([
        {
          "textParagraph": {
            "text": `<font color=\"#0E86D4\"><b>${leave.userName} from ${leave.teamName} has applied leave from ${leave.startDate} - ${leave.endDate} ${leave.leaveType}</b></font>`
          }
        },
        {
          "buttonList": {
            "buttons": [
              {
                "text": "Review",
                "icon": {
                  "knownIcon": "INVITE",
                  "altText": `review_${leave.leaveId}`
                },
                "onClick": {
                  "openLink": {
                    "url": "https://developers.google.com/chat/ui/widgets/button-list"
                  }
                }
              }
            ]
          }
        },
        {
          divider: {}
        }
        // {
        //   "textParagraph": {
        //     "text": "<font color=\"#0E86D4\"><b>bold text gnani</b></font>"
        //   }
        // }
      ]))
}
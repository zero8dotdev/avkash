import { NextRequest, NextResponse } from "next/server";
import { headers } from 'next/headers';
import { getApplyLeaveCard } from "@/app/_components/googlechat/cards/applyLeave";
import { trialCard } from "@/app/_components/googlechat/cards/trialCard";
import { submitLeave } from "@/app/_components/googlechat/cards/submitLeave";
import { googleUserInfoProps } from "@/app/api/home/route";
import {getUserData} from '@/app/_components/header/_components/actions'
import { successLeaveCard } from "@/app/_components/googlechat/cards/successLeaveCard";

interface appHomeOpenedProps {
  googleUserInfo: googleUserInfoProps
}

export async function POST(request: NextRequest) {
  let body: { [key: string]: any } = {};
  const headersList = headers();
  const contentType = headersList.get('content-type');
  const getDate = new Date().getTime()
  
  try {
    if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
      // Parse form data
      const params = new URLSearchParams(await request.text());
      body = Object.fromEntries(params.entries());
      if (body.payload) {
        body = JSON.parse(body.payload); // Assuming the actual JSON is inside the 'payload' field
      }
    } else if (contentType && contentType.includes('application/json')) {
      // Parse JSON data
      body = await request.json();
    } else {
      throw new Error('Unsupported content type');
    }
    // console.log('this is body', body)
    // let userIdNormal = body.message.sender.name
    let trialOne= body.user.name
    let userIdNormal = body.message.sender.name
    // const userId = userIdNormal.replace('users/','')
    const userId = trialOne.match(/\d+/)?.[0];
    const googleUserInfo = await getUserData({id: userId, googleId: 'googleId'})
    const userName = body.user.displayName

    
    let responseCard;

    if (body.type === "MESSAGE") {
      const command = body.message.text;

      switch(command) {
        case "/hello_world":
          responseCard = getHelloWorldCard();
          break;

        case "/apply_paid_leave":
          responseCard = getApplyLeaveCard(getDate, body);
          break;

        case "/applyLeave":
          responseCard = getApplyLeaveCard(getDate, body);
          break;

        case "/virtual_meet_support":
          responseCard = getVirtualMeetSupportCard();
          break;

        default:
          responseCard = getDefaultCard(userName);
          break;
      }

      const response = new NextResponse(JSON.stringify(responseCard), {
        headers: {
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": 'konda'
        },
        status: 200
      });

      console.log('Response:', response);
      return response;

    } else if (body.type === "CARD_CLICKED" && body.action.actionMethodName === "getApplyLeaveCard") {
      // console.log("this is triggered rohit")
      responseCard = getApplyLeaveCard(getDate, body);
      
      const response = new NextResponse(JSON.stringify(responseCard), {
        headers: {
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": 'konda'
        },
        status: 200
      });

      console.log('Response:', response);
      return response;
    }
    else if (body.type === "CARD_CLICKED" && body.action.actionMethodName === 'getApplyLeaveCard'){
      responseCard = getApplyLeaveCard(getDate, body)
      const response = new NextResponse(JSON.stringify(responseCard) , {
        headers : {
          'Content-Type' : 'application/json',
          "ngrok-skip-browser-warning": 'konda is here'
        },
        status: 200
      });
      console.log("Response" , response)
      return response
    } else if(body.type === "CARD_CLICKED" && body.action.actionMethodName === 'applyLeave'){
      const inputData = body.common.formInputs;
      const appTime = body.common.formInputs.appointment_time
      const appliedLeave = await  submitLeave(inputData, googleUserInfo)
      
      responseCard = trialCard()
      if (appliedLeave){
        responseCard = await successLeaveCard(appliedLeave)
      }
      const response = new NextResponse(JSON.stringify(responseCard) , {
        headers: {
          'Content-Type' : 'application/json',
          "ngrok-skip-browser-warning": 'konda is here'
        },
        status: 200
      })
      console.log('Response apply leave card', response)
      return response
    }
    
    else {
      console.log("Not a type of message or unhandled action.");
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return new NextResponse(JSON.stringify({
      error: 'Internal Server Error'
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
}

function getHelloWorldCard() {
  return {
    cardsV2: [{
      cardId: 'helloWorldCard',
      card: {
        name: 'Hello World Card',
        sections: [
          {
            header: 'Apply For Leaves',
            collapsible: false,
            uncollapsibleWidgetsCount: 1,
            widgets: [
              {
                divider: {}
              },
              {
                selectionInput: {
                  name: 'size',
                  label: 'Select Leave Type',
                  type: 'DROPDOWN',
                  items: [
                    {
                      text: 'Paid Leave',
                      value: 'small',
                      selected: false
                    },
                    {
                      text: 'Sick Leave',
                      value: 'medium',
                      selected: true
                    },
                    {
                      text: 'Leave A',
                      value: 'large',
                      selected: false
                    }
                  ]
                }
              },
              {
                dateTimePicker: {
                  name: 'appointment_time',
                  label: 'Book your appointment at:',
                  type: 'DATE_ONLY',
                  valueMsEpoch: 796435200000
                }
              },
              {
                dateTimePicker: {
                  name: 'appointment_time',
                  label: 'Book your appointment at:',
                  type: 'DATE_ONLY',
                  valueMsEpoch: 796435200000
                }
              },
              {
                textInput: {
                  name: 'email_address',
                  label: 'Note',
                  validation: {
                    inputType: 'TEXT'
                  }
                }
              },
              {
                buttonList: {
                  buttons: [
                    {
                      text: "Submit Your Leave",
                      icon: {
                        knownIcon: "INVITE",
                        altText: "check calendar"
                      },
                      onClick: {
                        action: {
                          function: 'applyLeave'
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    }]
  };
}

// function getApplyPaidLeaveCard() {
//   return {
//     cardsV2: [{
//       cardId: 'applyPaidLeaveCard',
//       card: {
//         name: 'Apply Paid Leave Card',
//         header: {
//           title: 'Apply Paid Leave'
//         },
//         sections: [
//           {
//             header: 'Apply For Leaves',
//             collapsible: false,
//             uncollapsibleWidgetsCount: 1,
//             widgets: [
//               {
//                 divider: {}
//               },
//               {
//                 selectionInput: {
//                   name: 'size',
//                   label: 'Select Leave Type',
//                   type: 'DROPDOWN',
//                   items: [
//                     {
//                       text: 'Paid Leave',
//                       value: 'small',
//                       selected: false
//                     },
//                     {
//                       text: 'Sick Leave',
//                       value: 'medium',
//                       selected: true
//                     },
//                     {
//                       text: 'Leave A',
//                       value: 'large',
//                       selected: false
//                     }
//                   ]
//                 }
//               },
//               {
//                 dateTimePicker: {
//                   name: 'appointment_time',
//                   label: 'Book your appointment at:',
//                   type: 'DATE_ONLY',
//                   valueMsEpoch: 796435200000
//                 }
//               },
//               {
//                 dateTimePicker: {
//                   name: 'appointment_time',
//                   label: 'Book your appointment at:',
//                   type: 'DATE_ONLY',
//                   valueMsEpoch: 796435200000
//                 }
//               },
//               {
//                 textInput: {
//                   name: 'email_address',
//                   label: 'Note',
//                   validation: {
//                     inputType: 'TEXT'
//                   }
//                 }
//               },
//               {
//                 buttonList: {
//                   buttons: [
//                     {
//                       text: "Submit Your Leave",
//                       icon: {
//                         knownIcon: "INVITE",
//                         altText: "check calendar"
//                       },
//                       onClick: {
//                         openLink: {
//                           url: "https://developers.google.com/chat/ui/widgets/button-list"
//                         }
//                       }
//                     }
//                   ]
//                 }
//               }
//             ]
//           }
//         ]
//       }
//     }]
//   };
// }

// export function getApplyLeaveCard(getDate: any) {
//   return {
//     cardsV2: [{
//       cardId: 'applyLeaveCard',
//       card: {
//         name: 'Apply Leave Card',
//         header: {
//           title: 'Apply Leave'
//         },
//         sections: [
//           {
//             collapsible: false,
//             uncollapsibleWidgetsCount: 1,
//             widgets: [
//               {
//                 divider: {}
//               },
//               {
//                 selectionInput: {
//                   name: 'selectLeaveType',
//                   label: 'Select Leave Type',
//                   type: 'DROPDOWN',
//                   items: [
//                     {
//                       text: 'Paid Leave',
//                       value: 'paidLeave',
//                       selected: false
//                     },
//                     {
//                       text: 'Sick Leave',
//                       value: 'sickLeave',
//                       selected: true
//                     },
//                     {
//                       text: 'Leave A',
//                       value: 'leaveA',
//                       selected: false
//                     }
//                   ]
//                 }
//               },
//               {
//                 dateTimePicker: {
//                   name: 'startDate',
//                   label: 'Book your appointment at:',
//                   type: 'DATE_ONLY',
//                   valueMsEpoch: `${getDate}`
//                 }
//               },
//               {
//                 dateTimePicker: {
//                   name: 'endDate',
//                   label: 'Book your appointment at:',
//                   type: 'DATE_ONLY',
//                   valueMsEpoch: `${getDate}`
//                 }
//               },
              // {
              //   "selectionInput": {
              //     "name": "selectDayType",
              //     "label": "Select Day Type",
              //     "type": "RADIO_BUTTON",
              //     "items": [
              //       {
              //         "text": "Full Day",
              //         "value": "small",
              //         "selected": true
              //       },
              //       {
              //         "text": "Half DAy",
              //         "value": "medium",
              //         "selected": true
              //       }
              //     ]
              //   }
              // },
              // {
              //   "selectionInput": {
              //     "name": "selectShift",
              //     "label": "Select Shift",
              //     "type": "RADIO_BUTTON",
              //     "items": [
              //       {
              //         "text": "NONE",
              //         "value": "small",
              //         "selected": true
              //       },
              //       {
              //         "text": "Morning",
              //         "value": "medium",
              //         "selected": false
              //       },
              //       {
              //         "text": "Afternoon",
              //         "value": "large",
              //         "selected": false
              //       }
              //     ]
              //   }
              // },
//               {
//                 textInput: {
//                   name: 'note',
//                   label: 'Note',
//                   validation: {
//                     inputType: 'TEXT'
//                   }
//                 }
//               },
//               {
//                 buttonList: {
//                   buttons: [
//                     {
//                       text: "Submit Your Leave",
//                       icon: {
//                         knownIcon: "INVITE",
//                         altText: "check calendar"
//                       },
//                       onClick: {
//                         action: {
//                           function: 'applyLeave'
//                         }
//                       }
//                     }
//                   ]
//                 }
//               }
//             ]
//           }
//         ]
//       }
//     }]
//   };
// }

function getVirtualMeetSupportCard() {
  return {
    cardsV2: [{
      cardId: 'virtualMeetSupportCard',
      card: {
        name: 'Virtual Meet Support Card',
        header: {
          title: 'Virtual Meet Support'
        },
        sections: [
          {
            widgets: [
              {
                dateTimePicker: {
                  name: "appointment_time",
                  label: "Book your appointment at:",
                  type: "DATE_AND_TIME",
                  valueMsEpoch: 796435200000
                }
              },
              {
                textInput: {
                  name: "note",
                  label: "Enter your problem",
                  validation: {
                    inputType: "TEXT"
                  }
                }
              },
              {
                buttonList: {
                  buttons: [
                    {
                      text: "Submit",
                      icon: {
                        knownIcon: "INVITE",
                        altText: "check calendar"
                      },
                      onClick: {
                        openLink: {
                          url: "https://developers.google.com/chat/ui/widgets/button-list"
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    }]
  };
}

function getDefaultCard(userName: string) {
  return {
    cardsV2: [{
      cardId: 'defaultCard',
      card: {
        name: 'Default Card',
        header: {
          title: `Welcome to Avkash Chat Bot ${userName}`
        },
        sections: [
          {
            widgets: [
              {
                buttonList: {
                  buttons: [
                    {
                      text: "Request Leave",
                      icon: {
                        knownIcon: "CLOCK",
                        altText: "check calendar"
                      },
                      onClick: {
                        action: {
                          function: "getApplyLeaveCard"
                        }
                      }
                    },
                    {
                      text: "Your Leaves",
                      icon: {
                        knownIcon: "DESCRIPTION",
                        altText: "check calendar"
                      },
                      onClick: {
                        openLink: {
                          url: "https://developers.google.com/chat/ui/widgets/button-list"
                        }
                      }
                    },
                    {
                      text: "Leave Report",
                      icon: {
                        knownIcon: "INVITE",
                        altText: "check calendar"
                      },
                      onClick: {
                        action: {
                          function: "getApplyLeaveCard"
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    }]
  };
}

function getSecondaryCard() {
  return {
    cardsV2: [{
      cardId: 'secondaryCard',
      card: {
        name: 'Secondary Card',
        header: {
          title: 'Secondary Card'
        },
        sections: [
          {
            header: 'Secondary Actions',
            widgets: [
              {
                textParagraph: {
                  text: 'This is the secondary card content.'
                }
              },
              {
                buttonList: {
                  buttons: [
                    {
                      text: "Go Back",
                      icon: {
                        knownIcon: "ARROW_BACK",
                        altText: "go back"
                      },
                      onClick: {
                        action: {
                          function: "onClickGoBackButton"
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    }]
  };
}

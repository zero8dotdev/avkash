import { NextRequest, NextResponse } from "next/server";
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  let body: { [key: string]: any } = {};
  const headersList = headers();
  const contentType = headersList.get('content-type');

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
    const userName = body.user.displayName

    let responseCard;

    if (body.type === "MESSAGE") {
      const command = body.message.text;

      switch(command) {
        case "/hello_world":
          responseCard = getHelloWorldCard();
          break;

        case "/apply_paid_leave":
          responseCard = getApplyPaidLeaveCard();
          break;

        case "/applyLeave":
          responseCard = getApplyLeaveCard();
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

      return response;

    } else if (body.type === "CARD_CLICKED" && body.action.actionMethodName === "getApplyLeaveCard") {
      responseCard = getApplyLeaveCard();
      
      const response = new NextResponse(JSON.stringify(responseCard), {
        headers: {
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": 'konda'
        },
        status: 200
      });

      return response;
    }
    else if (body.type === "CARD_CLICKED" && body.action.actionMethodName === 'getApplyLeaveCard'){
      responseCard = getApplyLeaveCard()
      const response = new NextResponse(JSON.stringify(responseCard) , {
        headers : {
          'Content-Type' : 'application/json',
          "ngrok-skip-browser-warning": 'konda is here'
        },
        status: 200
      });
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

function getApplyPaidLeaveCard() {
  return {
    cardsV2: [{
      cardId: 'applyPaidLeaveCard',
      card: {
        name: 'Apply Paid Leave Card',
        header: {
          title: 'Apply Paid Leave'
        },
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

export function getApplyLeaveCard() {
  return {
    cardsV2: [{
      cardId: 'applyLeaveCard',
      card: {
        name: 'Apply Leave Card',
        header: {
          title: 'Apply Leave'
        },
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

import { NextRequest, NextResponse } from "next/server";
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  let body: { [key: string]: any } = {};
  const headersList = headers();
  const contentType = headersList.get('content-type');
  console.log('Content-Type:', contentType); 

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

    console.log('Parsed Body:', body);

    if (body.type === "MESSAGE") {
      const command = body.message.text;
      let responseCard;

      switch(command) {
        case "/hello_world":
          responseCard = {
            cardsV2: [{
              cardId: 'homeCard',
              card: {
                name: 'Home Card',
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
                              text: "Text With Icon Button",
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
          break;

        case "/apply_paid_leave":
          responseCard = {
            cardsV2: [{
              cardId: 'applyPaidLeaveCard',
              card: {
                name: 'Apply Paid Leave Card',
                header: {
                  title: 'Apply Paid Leave'
                },
                sections: [
                  {
                    widgets: [
                      {
                        textParagraph: {
                          text: 'Use this form to apply for paid leave.'
                        }
                      }
                    ]
                  }
                ]
              }
            }]
          };
          break;

        case "/applyLeave":
          responseCard = {
            cardsV2: [{
              cardId: 'applyLeaveCard',
              card: {
                name: 'Apply Leave Card',
                header: {
                  title: 'Apply Leave'
                },
                sections: [
                  {
                    widgets: [
                      {
                        textParagraph: {
                          text: 'Use this form to apply for leave.'
                        }
                      }
                    ]
                  }
                ]
              }
            }]
          };
          break;

        case "/virtual_meet_support":
          responseCard = {
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
                        textParagraph: {
                          text: 'Use this link to join the virtual support meeting.'
                        }
                      }
                    ]
                  }
                ]
              }
            }]
          };
          break;

        default:
          responseCard = {
            cardsV2: [{
              cardId: 'defaultCard',
              card: {
                name: 'Default Card',
                header: {
                  title: 'Command Not Recognized'
                },
                sections: [
                  {
                    widgets: [
                      {
                        textParagraph: {
                          text: 'Please use a valid command.'
                        }
                      }
                    ]
                  }
                ]
              }
            }]
          };
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
    } else {
      console.log("Not a type of message");
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

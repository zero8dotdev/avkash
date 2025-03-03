import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserData } from '@/app/_components/header/_components/actions';
import { getApplyLeaveCard } from '../chat/route';

export async function POST(request: NextRequest) {
  let body: { [key: string]: any } = {};
  const headersList = await headers();
  const contentType = headersList.get('content-type');

  try {
    if (contentType && contentType.includes('application/json')) {
      body = await request.json();
    } else {
      throw new Error('Unsupported Content Type');
    }
    // Check if the event is onAppHome
    const userId = body.chat?.user?.name;

    const googleUserInfo = await getUserData(userId);

    if (
      body.commonEventObject &&
      body.commonEventObject.invokedFunction === 'onAppHome'
    ) {
      const response = new NextResponse(
        JSON.stringify({
          action: {
            navigations: [
              {
                pushCard: {
                  header: {
                    title: 'Welcome to Avkash.io Chat Bot',
                    subtitle:
                      'Hello there, welcome to avkash you can make your leaves and leave history',
                  },
                  sections: [
                    {
                      header: 'Avkash.io',
                      widgets: [
                        {
                          decoratedText: {
                            icon: {
                              knownIcon: 'STAR',
                            },
                            text: 'You can manage your leaves from avkash.io. In the chat bot say "hello" to it, it will show you the main functionality of the Avkash ',
                          },
                        },
                        {
                          decoratedText: {
                            icon: {
                              knownIcon: 'STAR',
                            },
                            text: 'You can Apply leave, see the last 7 days data and your leave report also.',
                          },
                        },
                        {
                          decoratedText: {
                            icon: {
                              knownIcon: 'STAR',
                            },
                            text: 'By clicking on the respective buttons, the form will pop out and you can make changes with respected to it.',
                          },
                        },
                        {
                          buttonList: {
                            buttons: [
                              {
                                text: 'Request Leave',
                                icon: {
                                  knownIcon: 'CLOCK',
                                  altText: 'check calendar',
                                },
                                onClick: {
                                  action: {
                                    function: 'getApplyLeaveCard',
                                  },
                                },
                              },
                              {
                                text: 'Your Leaves',
                                icon: {
                                  knownIcon: 'DESCRIPTION',
                                  altText: 'check calendar',
                                },
                                onClick: {
                                  openLink: {
                                    url: 'https://developers.google.com/chat/ui/widgets/button-list',
                                  },
                                },
                              },
                              {
                                text: 'Leave Report',
                                icon: {
                                  knownIcon: 'INVITE',
                                  altText: 'check calendar',
                                },
                                onClick: {
                                  action: {
                                    function: 'getVirtualMeetSupportCard',
                                  },
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'konda',
          },
          status: 200,
        }
      );

      return response;
    }
    if (
      body.commonEventObject &&
      body.commonEventObject.invokedFunction === 'getApplyLeaveCard'
    ) {
      const response = getApplyLeaveCard();
      return new NextResponse(JSON.stringify(response), {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'konda',
        },
        status: 200,
      });
    }

    // Default response for other events or messages
    const defaultResponse = new NextResponse(
      JSON.stringify({
        action: {
          navigations: [
            {
              pushCard: {
                sections: [
                  {
                    widgets: [
                      {
                        textParagraph: {
                          text: 'Please use a valid command.',
                        },
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'konda',
        },
        status: 200,
      }
    );

    return defaultResponse;
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Internal Server Error',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    let body: { [key: string]: any } = {};
    const headersList = headers();
    const contentType = headersList.get("content-type");
    console.log('Content Type:', contentType);

    try {
        if (contentType && contentType.includes("application/json")) {
            body = await request.json();
        } else {
            throw new Error("Unsupported Content Type");
        }

        console.log('Parsed Home body:', body);

        // Check if the event is onAppHome
        if (body.commonEventObject && body.commonEventObject.invokedFunction === 'onAppHome') {
            console.log('Home tab event detected');
            const response = new NextResponse(JSON.stringify({
                cardsV2: [{
                    cardId: 'homeCard',
                    card: {
                        name: 'Home Card',
                        sections: [
                            {
                                collapsible: false,
                                uncollapsibleWidgetsCount: 1,
                                widgets: [
                                    {
                                        textParagraph: {
                                            text: "See hello there for rich text formatting"
                                        }
                                    },
                                    {
                                        divider: {}
                                    },
                                    {
                                        textParagraph: {
                                            text: "See <a href=https://developers.google.com/apps-script/add-ons/concepts/widgets#text_formatting>this doc</a> for rich text formatting"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }]
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

        // Default response for other events or messages
        const defaultResponse = new NextResponse(JSON.stringify({
            cardsV2: [{
                cardId: 'defaultCard',
                card: {
                    name: 'Default Card',
                    header: {
                        title: 'Test Header'
                    },
                    sections: [
                        {
                            widgets: [
                                {
                                    textParagraph: {
                                        text: 'This is a test card'
                                    }
                                }
                            ]
                        }
                    ]
                }
            }]
        }), {
            headers: {
                'Content-Type': 'application/json',
                "ngrok-skip-browser-warning": 'konda'
            },
            status: 200
        });

        console.log('Default Response:', defaultResponse);
        return defaultResponse;
    } catch (error) {
        console.error('Error:', error);
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


// import {NextRequest , NextResponse} from "next/server"
// import {headers} from "next/headers"

// export async function POST(request: NextRequest){
//     let body: {[key: string]: any}= {};
//     const headersList = headers();
//     const contentType = headersList.get("content-type");
//     console.log('Rohit this is content Type', contentType)

//     try {
//         if(contentType && contentType.includes("application/x-www-form-urlencoded")){
//             const params = new URLSearchParams(await request.text());
//             body = Object.fromEntries(params.entries());
//             if(body.payload){
//                 body = JSON.parse(body.payload);
//             }else if (contentType && contentType.includes("application/json")){
//                 body = await request.json();
//             }else {
//                 throw new Error("Unsupported Content Type")
//             }
//         }

//         console.log('Parsede Home body', body)

//         // checking the event is at home
//     } catch (error) {
//         console.log('rohit this is catch error', error)
//     }
//     const response = new NextResponse(JSON.stringify({
//         cardsV2: [{
//           cardId: 'homeCard',
//           card: {
//             name: 'Home Card',
//             header: {
//               title: 'Welcome to the Invoices Bot'
//             },
//             sections: [
//               {
//                 widgets: [
//                   {
//                     textParagraph: {
//                       text: 'This is the home tab of the Invoices bot. Here you can manage your invoices and get updates.'
//                     }
//                   },
//                   {
//                     textParagraph: {
//                       text: 'Use the commands in the Chat tab to interact with the bot.'
//                     }
//                   }
//                 ]
//               }
//             ]
//           }
//         }]
//       }), {
//         headers: {
//           'Content-Type': 'application/json',
//           "ngrok-skip-browser-warning": 'konda'
//         },
//         status: 200
//       });

//       console.log('Home Tab Response:', response);
//       return response;
// }




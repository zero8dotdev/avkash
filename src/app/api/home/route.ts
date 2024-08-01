import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
// import {getApplyLeaveCard} from '../chat/route'
import {getUserData} from '@/app/_components/header/_components/actions'
import  {homeCard}  from "@/app/_components/googlechat/cards/homebuttons";
import { leaveCard } from "@/app/_components/googlechat/cards/requestLeaveCard";
import { getApplyLeaveCard } from "@/app/_components/googlechat/cards/applyLeave";


export interface googleUserInfoProps {
  userId: string,
  name: string,
  email: string,
  teamId: string,
  role: string,
  accruedLeave: { 'Paid time off': string, sick: string },
  usedLeave: { 'Paid time off': string, sick: string },
  keyword: string,
  orgId: string,
  isOwner?: boolean,
  googleId: string
}
/* TODO for me 
  1. Get the name from the database
  2. get the role 
  3. it the role is there then depending on that fetch the previous data
  4. first fetch the owner data
  5. design the data of owner 
  6. fetch the normal user data 
  7. design the data
  8. move to the buttons 
  9. leave request first and then other 
  10. make all pages today itself


*/
let googleUserInfo : googleUserInfoProps;

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
        // Check if the event is onAppHome
        // console.log("rohit input body", body)
        const userId = body.chat?.user?.name
        googleUserInfo = await getUserData({id: userId, googleId: 'googleId'})
        // console.log("google user info", googleUserInfo)
        // console.log("user id ", userId)
        googleUserInfo['isOwner'] = googleUserInfo.role === "OWNER" ? true : false
        // console.log("goole role info", googleUserInfo)
        const userName= googleUserInfo.name
        

        if (body.commonEventObject && body.commonEventObject.invokedFunction === 'onAppHome') {
            console.log('Home tab event detected');
            return homeCard(googleUserInfo)
            
        }
        // if (body.commonEventObject && body.commonEventObject.invokedFunction === 'getApplyLeaveCard'){
        //     const response = getApplyLeaveCard(getDate)
        //     return response
        // }
        if (body.commonEventObject && body.commonEventObject.invokedFunction === 'leaveCard'){
        //   console.log("benchod is clicked")
          const response = leaveCard()
          return response;
        }

        // Default response for other events or messages
        const defaultResponse = new NextResponse(JSON.stringify({
            action: {
                navigations: [
                    {
                        pushCard:
                        {
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


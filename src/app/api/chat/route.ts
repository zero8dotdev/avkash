import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  console.log('this is from slack chat app')

    console.log("consoling request",request.method);
    // const bodyText = await request.text();
    // console.log('Received request body text:', bodyText);

    // const body = JSON.parse(bodyText);
    // console.log('Parsed request body:', body);

    return new NextResponse(JSON.stringify({text:'Welcome from chat!!!!'}),{
      headers:{
        'Content-Type': 'application/json',
      },
      status: 200,
    });

  // try {
  //   const body = await request.json();
  // console.log('this is from try block')
    
   
  //   if (body.type === 'url_verification') {
  //     return new NextResponse(
  //       JSON.stringify({ challenge: body.challenge }),
  //       {
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         status: 200,
  //       }
  //     );
  //   }

  //   console.log('trying to log body',body.event.user);

  //   return new NextResponse(
  //     JSON.stringify({
  //       text: `Here's your avatar`,
  //     }),
  //     {
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       status: 200,
  //     }
  //   );
  // } catch (error) {
  //   console.error(error);
  //   return NextResponse.json(
  //     {
  //       text: 'An error occurred while processing your request.',
  //     },
  //     { status: 500 }
  //   );
  // }
}

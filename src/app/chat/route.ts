import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const body = await request.json();
  console.log(body);
  try {
    return new NextResponse(JSON.stringify({
      text: `Here's your avatar`,
      cardsV2: [{
        cardId: 'avatarCard',
        card: {
          name: 'Avatar Card',
          header: 'Test Header',
        }
      }]
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return NextResponse.json({
      text: "An error occurred while processing your request."
    }, { status: 500 });
  }
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log(body);
  // return new NextResponse(JSON.stringify({ name: 'Ashtuosh' }));
  try {
    return new NextResponse(JSON.stringify({
      "text": `Here's your avatar ${body.user.displayName}`,
      
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return NextResponse.json({
      text: "An error occurred while processing your request."
    }, { status: 500 });
  }
};
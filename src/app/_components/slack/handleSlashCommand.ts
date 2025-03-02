import { NextResponse } from 'next/server';

export default function handleSlashCommand(command: string) {
  let responseText;
  switch (command) {
    case '/hi':
      responseText = 'Welcome to ZERO8.DEV !!!';
      break;
    default:
      responseText = 'You entered an unregistered slash command';
  }

  return new NextResponse(
    JSON.stringify({ response_type: 'in_channel', text: responseText }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

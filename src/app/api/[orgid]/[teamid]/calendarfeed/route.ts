import { NextRequest, NextResponse } from 'next/server';
import {
  getLeaves,
  getUserRole,
  getUserVisibility,
} from '../../../../_actions/index';

async function fetchLeaves(
  orgId: any,
  teamId: any,
  userId: any,
  role: any,
  visibility: any
) {
  try {
    const targetId =
      role === 'OWNER' ||
      (role === 'MANAGER' && visibility === 'ORG') ||
      (role === 'USER' && visibility === 'ORG')
        ? orgId
        : (role === 'MANAGER' &&
              (visibility === 'TEAM' || visibility === 'SELF')) ||
            (role === 'MANAGER' && role === 'USER') ||
            visibility === 'TEAM'
          ? teamId
          : visibility === 'SELF' && role === 'USER'
            ? userId
            : null;
    if (targetId !== null) {
      const leaves = await getLeaves(
        targetId === orgId
          ? 'orgId'
          : targetId === teamId
            ? 'teamId'
            : 'userId',
        targetId
      );
      return leaves;
    } else {
      throw new Error('Invalid credentials passed');
    }
  } catch (error) {
    console.error('Error fetching leaves:', error);
    throw error;
  }
}

function generateICS(leaves: any) {
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Avkash//EN`,
    'CALSCALE:GREGORIAN',
    'NAME:yasw bonu',
    'X-WR-CALNAME:Avkash',
  ];

  leaves.forEach((leave: any) => {
    icsLines.push(
      'BEGIN:VEVENT',
      `UID:${leave.leaveId}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:${leave.User?.name}-${leave.leaveType}`,
      `DESCRIPTION:${leave.reason || leave.leaveType}`,
      `DTSTART;VALUE=DATE:${
        new Date(leave.startDate)
          .toISOString()
          .replace(/[-:]/g, '')
          .split('.')[0]
          .split('T')[0]
      }`,
      `DTEND;VALUE=DATE:${
        new Date(leave.endDate)
          .toISOString()
          .replace(/[-:]/g, '')
          .split('.')[0]
          .split('T')[0]
      }`,
      'TRANSP:TRANSPARENT',
      'X-MICROSOFT-CDO-ALLDAYEVENT:TRUE',
      'END:VEVENT'
    );
  });

  icsLines.push('END:VCALENDAR');
  return icsLines.join('\r\n');
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    const params = req.nextUrl.pathname.split('/');
    const orgId = params[2];
    const teamId = params[3];
    const userId = searchParams.get('userId');
    const role = await getUserRole(userId);
    const visibility = await getUserVisibility(orgId);
    const leaves = await fetchLeaves(orgId, teamId, userId, role, visibility);
    const icsContent = generateICS(leaves);
    const filename = 'leaves.ics';
    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.log(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

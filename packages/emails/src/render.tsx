import type { ReactElement } from 'react';
import { render } from '@react-email/components';
import LeaveBalanceCredited from '../emails/LeaveBalanceCredited';
import Invitation from '../emails/Invitation';
import LeaveRequested from '../emails/LeaveRequested';
import LeaveApproved from '../emails/LeaveApproved';
import LeaveRejected from '../emails/LeaveRejected';
import LeaveEscalated from '../emails/LeaveEscalated';

// Maps a notification event + payload to a rendered email. The notifications
// dispatcher calls renderEmail for the EMAIL channel; the same components power the
// `email dev` preview server. payload is loosely typed (it arrives as JSON), so each
// builder pulls the fields it needs.
type Payload = Record<string, unknown>;
interface Built {
  subject: string;
  element: ReactElement;
}

const str = (v: unknown, fallback = '') => (v == null ? fallback : String(v));
const num = (v: unknown) => Number(v ?? 0);
const humanPeriod = (v: unknown) => str(v).replace(/^accrual:/, '');

const REGISTRY: Record<string, (p: Payload) => Built> = {
  'leave.balance.credited': (p) => ({
    subject: `${num(p.amount)} day(s) of ${str(p.leaveType, 'leave')} leave credited`,
    element: (
      <LeaveBalanceCredited
        name={str(p.name, 'there')}
        amount={num(p.amount)}
        leaveType={str(p.leaveType, 'leave')}
        period={humanPeriod(p.period)}
      />
    ),
  }),
  'org.invitation.sent': (p) => ({
    subject: `You're invited to ${str(p.orgName)} on Avkash`,
    element: (
      <Invitation
        orgName={str(p.orgName)}
        inviterName={str(p.inviterName, 'A teammate')}
        role={str(p.role, 'USER')}
        acceptUrl={str(p.acceptUrl)}
        expiresOn={str(p.expiresOn)}
      />
    ),
  }),
  'leave.requested': (p) => ({
    subject: `Leave request from ${str(p.requester, 'a teammate')}`,
    element: (
      <LeaveRequested
        requester={str(p.requester, 'A teammate')}
        leaveType={str(p.leaveType, 'leave')}
        from={str(p.from)}
        to={str(p.to)}
        days={num(p.days)}
      />
    ),
  }),
  'leave.approved': (p) => ({
    subject: `Your ${str(p.leaveType, 'leave')} leave was approved`,
    element: (
      <LeaveApproved
        name={str(p.name, 'there')}
        leaveType={str(p.leaveType, 'leave')}
        from={str(p.from)}
        to={str(p.to)}
        days={num(p.days)}
      />
    ),
  }),
  'leave.rejected': (p) => ({
    subject: `Your ${str(p.leaveType, 'leave')} leave was declined`,
    element: (
      <LeaveRejected
        name={str(p.name, 'there')}
        leaveType={str(p.leaveType, 'leave')}
        from={str(p.from)}
        to={str(p.to)}
        days={num(p.days)}
      />
    ),
  }),
  'leave.escalated': (p) => ({
    subject: 'Leave needs HR review',
    element: (
      <LeaveEscalated
        requester={str(p.requester, 'A teammate')}
        reason={str(p.reason)}
        leaveType={str(p.leaveType, 'leave')}
        from={str(p.from)}
        to={str(p.to)}
        days={num(p.days)}
      />
    ),
  }),
};

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

// Returns null when no email template exists for the event (the dispatcher then
// skips the EMAIL channel for it).
export async function renderEmail(event: string, payload: Payload): Promise<RenderedEmail | null> {
  const build = REGISTRY[event];
  if (!build) return null;
  const { subject, element } = build(payload);
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { subject, html, text };
}

export const hasEmailTemplate = (event: string): boolean => event in REGISTRY;

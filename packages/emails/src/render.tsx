import type { ReactElement } from 'react';
import { render } from '@react-email/components';
import LeaveBalanceCredited from '../emails/LeaveBalanceCredited';
import Invitation from '../emails/Invitation';
import LeaveRequested from '../emails/LeaveRequested';
import LeaveApproved from '../emails/LeaveApproved';
import LeaveRejected from '../emails/LeaveRejected';
import LeaveEscalated from '../emails/LeaveEscalated';
import LeaveCancelled from '../emails/LeaveCancelled';
import DelegationAssigned from '../emails/DelegationAssigned';
import BalanceAdjusted from '../emails/BalanceAdjusted';
import CompOffApproved from '../emails/CompOffApproved';
import EncashmentPaid from '../emails/EncashmentPaid';
import RoleChanged from '../emails/RoleChanged';
import InvitationAccepted from '../emails/InvitationAccepted';
import OrgGraceExpiring from '../emails/OrgGraceExpiring';
import OrgRestricted from '../emails/OrgRestricted';
import RegularizationRequested from '../emails/RegularizationRequested';
import RegularizationResolved from '../emails/RegularizationResolved';

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
  'leave.cancelled': (p) => ({
    subject: `${str(p.requester, 'A teammate')} cancelled their leave`,
    element: (
      <LeaveCancelled
        requester={str(p.requester, 'A teammate')}
        leaveType={str(p.leaveType, 'leave')}
        from={str(p.from)}
        to={str(p.to)}
        days={num(p.days)}
      />
    ),
  }),
  'leave.delegation.assigned': (p) => ({
    subject: `${str(p.delegator, 'A manager')} delegated leave approvals to you`,
    element: (
      <DelegationAssigned
        delegator={str(p.delegator, 'A manager')}
        scope={str(p.scope, 'all their teams')}
        startsOn={str(p.startsOn)}
        endsOn={str(p.endsOn)}
      />
    ),
  }),
  'leave.balance.adjusted': (p) => ({
    subject: `Your ${str(p.leaveType, 'leave')} balance was adjusted`,
    element: (
      <BalanceAdjusted
        name={str(p.name, 'there')}
        leaveType={str(p.leaveType, 'leave')}
        amount={num(p.amount)}
        note={str(p.note)}
      />
    ),
  }),
  'leave.compoff.approved': (p) => ({
    subject: 'Your comp-off was approved',
    element: (
      <CompOffApproved
        name={str(p.name, 'there')}
        days={num(p.days)}
        workedOn={str(p.workedOn)}
        expiresOn={str(p.expiresOn)}
      />
    ),
  }),
  'leave.encashment.paid': (p) => ({
    subject: 'Your leave encashment has been paid',
    element: <EncashmentPaid name={str(p.name, 'there')} days={num(p.days)} />,
  }),
  'org.member.role_changed': (p) => ({
    subject: `Your role is now ${str(p.role)}`,
    element: (
      <RoleChanged
        name={str(p.name, 'there')}
        orgName={str(p.orgName, 'your organization')}
        role={str(p.role)}
        previousRole={str(p.previousRole)}
      />
    ),
  }),
  'org.invitation.accepted': (p) => ({
    subject: `${str(p.newMember, 'A new teammate')} joined ${str(p.orgName)}`,
    element: (
      <InvitationAccepted
        newMember={str(p.newMember, 'A new teammate')}
        email={str(p.email)}
        orgName={str(p.orgName, 'your organization')}
      />
    ),
  }),
  'org.grace.expiring': (p) => ({
    subject: 'Verify your organization on Avkash',
    element: (
      <OrgGraceExpiring
        orgName={str(p.orgName, 'your organization')}
        verifyBy={str(p.verifyBy)}
        appUrl={str(p.appUrl)}
      />
    ),
  }),
  'org.restricted': (p) => ({
    subject: 'Your Avkash organization is restricted',
    element: <OrgRestricted orgName={str(p.orgName, 'your organization')} appUrl={str(p.appUrl)} />,
  }),
  'attendance.regularization.requested': (p) => ({
    subject: `Attendance fix from ${str(p.requester, 'a teammate')}`,
    element: (
      <RegularizationRequested requester={str(p.requester, 'A teammate')} date={str(p.date)} reason={str(p.reason)} />
    ),
  }),
  'attendance.regularization.resolved': (p) => ({
    subject: `Your attendance fix was ${str(p.decision, 'reviewed')}`,
    element: (
      <RegularizationResolved
        name={str(p.name, 'there')}
        date={str(p.date)}
        decision={str(p.decision, 'reviewed')}
        note={str(p.note)}
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

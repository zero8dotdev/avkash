import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface LeaveRequestedProps {
  requester: string;
  leaveType: string;
  from: string;
  to: string;
  days: number;
}

export default function LeaveRequested({
  requester = 'A teammate',
  leaveType = 'Annual',
  from = '2026-12-15',
  to = '2026-12-16',
  days = 2,
}: LeaveRequestedProps) {
  return (
    <Layout preview={`Leave request from ${requester}`} heading='A leave request to review'>
      <Text style={para}>
        <strong>{requester}</strong> requested {leaveType} leave from {from} to {to} ({days} day(s)). Review and approve
        it in Avkash.
      </Text>
    </Layout>
  );
}

LeaveRequested.PreviewProps = {
  requester: 'Rahul',
  leaveType: 'Annual',
  from: '2026-12-15',
  to: '2026-12-18',
  days: 4,
} satisfies LeaveRequestedProps;

import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface LeaveRejectedProps {
  name?: string;
  leaveType: string;
  from: string;
  to: string;
  days: number;
}

export default function LeaveRejected({
  name = 'there',
  leaveType = 'Annual',
  from = '2026-12-15',
  to = '2026-12-16',
  days = 2,
}: LeaveRejectedProps) {
  return (
    <Layout preview={`Your ${leaveType} leave was declined`} heading='Leave declined'>
      <Text style={para}>
        Hi {name}, your <strong>{leaveType}</strong> leave from {from} to {to} ({days} day(s)) was declined. Reach out
        to your manager if you have questions.
      </Text>
    </Layout>
  );
}

LeaveRejected.PreviewProps = {
  name: 'Asha',
  leaveType: 'Annual',
  from: '2026-12-15',
  to: '2026-12-16',
  days: 2,
} satisfies LeaveRejectedProps;

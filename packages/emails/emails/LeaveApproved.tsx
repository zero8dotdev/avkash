import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface LeaveApprovedProps {
  name?: string;
  leaveType: string;
  from: string;
  to: string;
  days: number;
}

export default function LeaveApproved({
  name = 'there',
  leaveType = 'Annual',
  from = '2026-12-15',
  to = '2026-12-16',
  days = 2,
}: LeaveApprovedProps) {
  return (
    <Layout preview={`Your ${leaveType} leave was approved`} heading='Leave approved 🎉'>
      <Text style={para}>
        Hi {name}, your <strong>{leaveType}</strong> leave from {from} to {to} ({days} day(s)) has been approved. Enjoy
        your time off!
      </Text>
    </Layout>
  );
}

LeaveApproved.PreviewProps = {
  name: 'Asha',
  leaveType: 'Annual',
  from: '2026-12-15',
  to: '2026-12-16',
  days: 2,
} satisfies LeaveApprovedProps;

import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface LeaveCancelledProps {
  requester: string;
  leaveType: string;
  from: string;
  to: string;
  days: number;
}

export default function LeaveCancelled({
  requester = 'A teammate',
  leaveType = 'Annual',
  from = '2026-12-15',
  to = '2026-12-16',
  days = 2,
}: LeaveCancelledProps) {
  return (
    <Layout preview={`${requester} cancelled their leave`} heading='Leave cancelled'>
      <Text style={para}>
        <strong>{requester}</strong> cancelled their {leaveType} leave ({from} → {to}, {days} day(s)).
      </Text>
    </Layout>
  );
}

LeaveCancelled.PreviewProps = {
  requester: 'Rahul',
  leaveType: 'Annual',
  from: '2026-12-15',
  to: '2026-12-18',
  days: 4,
} satisfies LeaveCancelledProps;

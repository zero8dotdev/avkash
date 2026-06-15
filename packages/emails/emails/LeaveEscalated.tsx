import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface LeaveEscalatedProps {
  requester: string;
  reason: string;
  leaveType: string;
  from: string;
  to: string;
  days: number;
}

export default function LeaveEscalated({
  requester = 'A teammate',
  reason = 'Exceeds the approval threshold',
  leaveType = 'Annual',
  from = '2026-12-15',
  to = '2026-12-16',
  days = 2,
}: LeaveEscalatedProps) {
  return (
    <Layout preview='A leave needs HR review' heading='Leave needs HR review'>
      <Text style={para}>
        A {leaveType} leave for <strong>{requester}</strong> ({from} → {to}, {days} day(s)) needs HR attention.
      </Text>
      <Text style={para}>Reason: {reason}. Review it in Avkash.</Text>
    </Layout>
  );
}

LeaveEscalated.PreviewProps = {
  requester: 'Rahul',
  reason: '4 working days exceeds the 2-day threshold',
  leaveType: 'Annual',
  from: '2026-12-15',
  to: '2026-12-18',
  days: 4,
} satisfies LeaveEscalatedProps;

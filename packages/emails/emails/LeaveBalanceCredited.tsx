import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface LeaveBalanceCreditedProps {
  name?: string;
  amount: number;
  leaveType: string;
  period: string; // already humanized, e.g. "2026-08"
}

export default function LeaveBalanceCredited({
  name = 'there',
  amount = 2,
  leaveType = 'Annual',
  period = '2026-08',
}: LeaveBalanceCreditedProps) {
  return (
    <Layout preview={`${amount} day(s) of ${leaveType} leave credited`} heading='Leave balance credited'>
      <Text style={para}>
        Hi {name}, <strong>{amount} day(s)</strong> of {leaveType} leave have been credited to your balance for {period}
        .
      </Text>
    </Layout>
  );
}

LeaveBalanceCredited.PreviewProps = {
  name: 'Asha',
  amount: 2,
  leaveType: 'Annual',
  period: '2026-08',
} satisfies LeaveBalanceCreditedProps;

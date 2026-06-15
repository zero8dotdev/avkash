import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface RegularizationRequestedProps {
  requester: string;
  date: string;
  reason: string;
}

export default function RegularizationRequested({
  requester = 'A teammate',
  date = '2026-06-15',
  reason = 'Forgot to punch out',
}: RegularizationRequestedProps) {
  return (
    <Layout preview={`${requester} requested an attendance fix`} heading='Attendance fix to review'>
      <Text style={para}>
        <strong>{requester}</strong> requested a correction to their attendance for {date}. Reason: {reason}. Review and
        approve it in Avkash.
      </Text>
    </Layout>
  );
}

RegularizationRequested.PreviewProps = {
  requester: 'Ravi',
  date: '2026-06-15',
  reason: 'Biometric missed my punch-out',
} satisfies RegularizationRequestedProps;

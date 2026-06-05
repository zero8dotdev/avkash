import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface RegularizationResolvedProps {
  name?: string;
  date: string;
  decision: string; // 'approved' | 'declined'
  note?: string;
}

export default function RegularizationResolved({
  name = 'there',
  date = '2026-06-15',
  decision = 'approved',
  note = '',
}: RegularizationResolvedProps) {
  return (
    <Layout preview={`Your attendance fix was ${decision}`} heading={`Attendance fix ${decision}`}>
      <Text style={para}>
        Hi {name}, your attendance correction for <strong>{date}</strong> was {decision}.{note ? ` Note: ${note}.` : ''}
      </Text>
    </Layout>
  );
}

RegularizationResolved.PreviewProps = {
  name: 'Ravi',
  date: '2026-06-15',
  decision: 'approved',
  note: 'Confirmed with the gate log',
} satisfies RegularizationResolvedProps;

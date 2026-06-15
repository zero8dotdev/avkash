import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface EncashmentPaidProps {
  name?: string;
  days: number;
}

export default function EncashmentPaid({ name = 'there', days = 5 }: EncashmentPaidProps) {
  return (
    <Layout preview='Your leave encashment has been paid' heading='Leave encashment paid'>
      <Text style={para}>
        Hi {name}, your leave encashment for <strong>{days} day(s)</strong> has been processed and paid. It will reflect
        in your next payout.
      </Text>
    </Layout>
  );
}

EncashmentPaid.PreviewProps = {
  name: 'Asha',
  days: 5,
} satisfies EncashmentPaidProps;

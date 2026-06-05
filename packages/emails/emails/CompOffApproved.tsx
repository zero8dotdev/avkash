import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface CompOffApprovedProps {
  name?: string;
  days: number;
  workedOn: string;
  expiresOn?: string;
}

export default function CompOffApproved({
  name = 'there',
  days = 1,
  workedOn = '2026-12-06',
  expiresOn = '',
}: CompOffApprovedProps) {
  return (
    <Layout preview='Your comp-off was approved' heading='Comp-off approved'>
      <Text style={para}>
        Hi {name}, your comp-off for working on {workedOn} (<strong>{days} day(s)</strong>) has been approved and
        credited to your balance.{expiresOn ? ` Use it before ${expiresOn}.` : ''}
      </Text>
    </Layout>
  );
}

CompOffApproved.PreviewProps = {
  name: 'Asha',
  days: 1,
  workedOn: '2026-12-06',
  expiresOn: '2027-03-06',
} satisfies CompOffApprovedProps;

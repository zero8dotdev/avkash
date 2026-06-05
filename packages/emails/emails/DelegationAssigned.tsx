import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface DelegationAssignedProps {
  delegator: string;
  scope: string; // team name, or "all your teams"
  startsOn: string;
  endsOn: string;
}

export default function DelegationAssigned({
  delegator = 'A manager',
  scope = 'all their teams',
  startsOn = '2026-12-15',
  endsOn = '2026-12-22',
}: DelegationAssignedProps) {
  return (
    <Layout preview={`${delegator} delegated leave approvals to you`} heading="You're covering leave approvals">
      <Text style={para}>
        <strong>{delegator}</strong> has delegated leave approvals for {scope} to you, from {startsOn} to {endsOn}. You
        can approve requests for them in Avkash during this window.
      </Text>
    </Layout>
  );
}

DelegationAssigned.PreviewProps = {
  delegator: 'Priya',
  scope: 'Team B',
  startsOn: '2026-12-15',
  endsOn: '2026-12-22',
} satisfies DelegationAssignedProps;

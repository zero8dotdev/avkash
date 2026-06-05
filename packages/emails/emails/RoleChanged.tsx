import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface RoleChangedProps {
  name?: string;
  orgName: string;
  role: string;
  previousRole: string;
}

export default function RoleChanged({
  name = 'there',
  orgName = 'your organization',
  role = 'MANAGER',
  previousRole = 'USER',
}: RoleChangedProps) {
  return (
    <Layout preview={`Your role is now ${role}`} heading='Your role was updated'>
      <Text style={para}>
        Hi {name}, your role in <strong>{orgName}</strong> was changed from {previousRole} to <strong>{role}</strong>.
      </Text>
    </Layout>
  );
}

RoleChanged.PreviewProps = {
  name: 'Asha',
  orgName: 'Prorate Co',
  role: 'MANAGER',
  previousRole: 'USER',
} satisfies RoleChangedProps;

import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface InvitationAcceptedProps {
  newMember: string;
  email: string;
  orgName: string;
}

export default function InvitationAccepted({
  newMember = 'A new teammate',
  email = 'newhire@example.com',
  orgName = 'your organization',
}: InvitationAcceptedProps) {
  return (
    <Layout preview={`${newMember} joined ${orgName}`} heading='Your invite was accepted'>
      <Text style={para}>
        <strong>{newMember}</strong> ({email}) accepted your invitation and joined {orgName} on Avkash.
      </Text>
    </Layout>
  );
}

InvitationAccepted.PreviewProps = {
  newMember: 'Rahul',
  email: 'rahul@prorate.co',
  orgName: 'Prorate Co',
} satisfies InvitationAcceptedProps;

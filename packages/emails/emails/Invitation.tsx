import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface InvitationProps {
  orgName: string;
  inviterName?: string;
  role: string;
  acceptUrl: string;
  expiresOn: string;
}

export default function Invitation({
  orgName = 'Acme Inc',
  inviterName = 'A teammate',
  role = 'USER',
  acceptUrl = 'https://app.avkash.dev/invite/accept?token=demo',
  expiresOn = '2026-12-31',
}: InvitationProps) {
  return (
    <Layout
      preview={`You're invited to ${orgName} on Avkash`}
      heading={`Join ${orgName} on Avkash`}
      cta={{ label: 'Accept invitation', href: acceptUrl }}
    >
      <Text style={para}>
        {inviterName} invited you to join <strong>{orgName}</strong> as {role}.
      </Text>
      <Text style={para}>
        This invitation expires on {expiresOn}. If you didn't expect it, you can ignore this email.
      </Text>
    </Layout>
  );
}

Invitation.PreviewProps = {
  orgName: 'Prorate Co',
  inviterName: 'Priya (HR)',
  role: 'MANAGER',
  acceptUrl: 'https://app.avkash.dev/invite/accept?token=demo',
  expiresOn: '2026-12-31',
} satisfies InvitationProps;

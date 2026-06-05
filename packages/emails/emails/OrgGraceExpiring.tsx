import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface OrgGraceExpiringProps {
  orgName: string;
  verifyBy: string;
  appUrl: string;
}

export default function OrgGraceExpiring({
  orgName = 'your organization',
  verifyBy = '2026-12-31',
  appUrl = 'https://app.avkash.dev',
}: OrgGraceExpiringProps) {
  return (
    <Layout
      preview='Verify your organization before access is restricted'
      heading='Verify your organization'
      cta={{ label: 'Verify now', href: appUrl }}
    >
      <Text style={para}>
        <strong>{orgName}</strong>'s verification window ends on {verifyBy}. Verify your domain before then to keep full
        access — afterwards the organization is restricted.
      </Text>
    </Layout>
  );
}

OrgGraceExpiring.PreviewProps = {
  orgName: 'Prorate Co',
  verifyBy: '2026-12-31',
  appUrl: 'https://app.avkash.dev',
} satisfies OrgGraceExpiringProps;

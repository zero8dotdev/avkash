import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface OrgRestrictedProps {
  orgName: string;
  appUrl: string;
}

export default function OrgRestricted({
  orgName = 'your organization',
  appUrl = 'https://app.avkash.dev',
}: OrgRestrictedProps) {
  return (
    <Layout
      preview='Your Avkash organization is restricted'
      heading='Organization restricted'
      cta={{ label: 'Verify to restore', href: appUrl }}
    >
      <Text style={para}>
        <strong>{orgName}</strong>'s verification window has lapsed, so the organization is now restricted — inviting
        and some actions are paused. Verify your domain to restore full access.
      </Text>
    </Layout>
  );
}

OrgRestricted.PreviewProps = {
  orgName: 'Prorate Co',
  appUrl: 'https://app.avkash.dev',
} satisfies OrgRestrictedProps;

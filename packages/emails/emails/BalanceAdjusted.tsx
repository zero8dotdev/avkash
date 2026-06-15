import { Text } from '@react-email/components';
import { Layout, para } from '../src/components/Layout';

export interface BalanceAdjustedProps {
  name?: string;
  leaveType: string;
  amount: number; // signed
  note?: string;
}

export default function BalanceAdjusted({
  name = 'there',
  leaveType = 'Annual',
  amount = 2,
  note = '',
}: BalanceAdjustedProps) {
  const verb = amount >= 0 ? 'credited' : 'deducted';
  return (
    <Layout preview={`Your ${leaveType} balance was adjusted`} heading='Leave balance adjusted'>
      <Text style={para}>
        Hi {name}, your <strong>{leaveType}</strong> balance was {verb} by {Math.abs(amount)} day(s).
        {note ? ` Note: ${note}.` : ''}
      </Text>
    </Layout>
  );
}

BalanceAdjusted.PreviewProps = {
  name: 'Asha',
  leaveType: 'Annual',
  amount: 3,
  note: 'Goodwill grant',
} satisfies BalanceAdjustedProps;

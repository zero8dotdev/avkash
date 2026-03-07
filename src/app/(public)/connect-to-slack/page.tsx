'use client';

import { Flex, Button } from 'antd';
import { useEffect, useState } from 'react';
import uuid4 from 'uuid4';

export default function Page() {
  const [slackAuthUrl, setSlackAuthUrl] = useState<string>('');

  useEffect(() => {
    const baseUrl = 'https://slack.com/oauth/v2/authorize';
    const url = new URL(baseUrl);

    url.searchParams.append(
      'redirect_uri',
      'https://flounder-wise-completely.ngrok-free.app/auth/callback'
    );

    url.searchParams.append('scope', 'users:read,users:read.email');
    url.searchParams.append('client_id', '6356258938273.7279987270326');
    url.searchParams.append('state', uuid4());

    setSlackAuthUrl(url.toString());
  }, []);

  return (
    <Flex justify="center" align="center" style={{ minHeight: '100vh' }}>
      <Button type="link" href={slackAuthUrl}>
        Install to Slack
      </Button>
    </Flex>
  );
}

'use client';

import { Card } from 'antd';
import { useRouter } from 'next/navigation';

export default function AddToSlack() {
  const router = useRouter();

  const handlenext = () => {
    const redirectToNext = new URL(
      '/initialsetup/settings',
      window.location.origin
    ).toString();

    router.push(redirectToNext);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '85vh',
      }}
    >
      <a
        href={`https://slack.com/oauth/v2/authorize?client_id=6356258938273.7279987270326&scope=app_mentions:read,channels:history,channels:read,chat:write,chat:write.public,commands,groups:read,im:history,im:read,mpim:history,users:read,users:read.email&user_scope=channels:history,channels:read,groups:read,im:history,im:read,mpim:history,mpim:read&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URL}welcome/install-to-slack`}
      >
        <img
          alt="Add to Slack"
          height="70"
          width="160"
          src="https://platform.slack-edge.com/img/add_to_slack.png"
          srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
        />
      </a>
    </div>
  );
}

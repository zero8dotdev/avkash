'use client';

import { Tabs } from 'antd';
import { useRouter } from 'next/navigation';
import React from 'react';

const TeamSettingsTabs = ({ position }: { position: string }) => {
  const router = useRouter();
  return (
    <Tabs
      tabBarStyle={{ width: '90%' }}
      activeKey={position}
      onChange={(key) => router.push(`${key}`)}
      type="card"
      items={[
        {
          label: 'Settings',
          key: 'settings',
          children: '',
        },
        {
          label: 'Leave Policy',
          key: 'leave-policy',
          children: '',
        },
        {
          label: 'Notifications',
          key: 'notifications',
          children: '',
        },
        {
          label: 'Users',
          key: 'users',
          children: '',
        },
        {
          label: 'Managers',
          key: 'managers',
          children: '',
        },
      ]}
      tabPosition="left"
    />
  );
};

export default TeamSettingsTabs;

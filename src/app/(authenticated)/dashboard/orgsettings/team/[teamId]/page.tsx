import { Tabs } from 'antd';
import React from 'react';
import TeamSettings from './settings/page';
import LeavePolicyPage from './leavePolicy/page';
import NotificationPage from './notifications/page';

const items = [
  {
    key: '1',
    label: 'settings',
    children: <TeamSettings />,
  },
  {
    key: '2',
    label: 'leave policy',
    children: <LeavePolicyPage />,
  },
  {
    key: '3',
    label: 'notifications',
    children: <NotificationPage />,
  },
  {
    key: '4',
    label: 'users',
    chidren: 'users',
  },
  {
    key: '5',
    label: 'managers',
  },
];

const page = ({ children }: any) => {
  return (
    <div style={{ border: '1px solid red' }}>
      <Tabs items={items} />
      {children}
    </div>
  );
};

export default page;

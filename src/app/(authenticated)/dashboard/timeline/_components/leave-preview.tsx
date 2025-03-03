'use client';

import { Flex, Tabs, Card, List, type TabsProps, Tag } from 'antd';
import { useState } from 'react';

export default function LeavePreview() {
  const tabs: TabsProps['items'] = [
    {
      key: 'today',
      label: 'Today',
      children: (
        <Card>
          <Tag color="blue">Coming Soon!</Tag>
        </Card>
      ),
    },
    {
      key: 'pending',
      label: 'Pending',
      children: (
        <Card>
          <Tag color="magenta">Coming Soon!</Tag>
        </Card>
      ),
    },
    {
      key: 'planned',
      label: 'Planned',
      children: (
        <Card>
          <Tag color="green">Coming Soon!</Tag>
        </Card>
      ),
    },
  ];

  const [activeTab, setActiveTab] = useState<TabsProps['activeKey']>('today');

  return (
    <Flex style={{ minHeight: '100px' }}>
      <Tabs
        size="small"
        type="card"
        items={tabs}
        activeKey={activeTab}
        onChange={(activeKey: TabsProps['activeKey']) => {
          setActiveTab(activeKey);
        }}
      />
    </Flex>
  );
}

'use client';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Checkbox, Flex, Select, Typography } from 'antd';
import React from 'react';

const Settings = ({ user }: { user: any }) => {
  return (
    <Flex vertical gap={10}>
      <Typography.Text>Team</Typography.Text>
      <Select style={{ width: '20%' }}>
        <Select.Option value="teamname">Show all team names</Select.Option>
      </Select>
      <Typography.Text>User Role</Typography.Text>
      <Checkbox.Group
        style={{ display: 'flex', flexDirection: 'column', gap: 15 }}
      >
        <Checkbox value="manager">
          Manager <QuestionCircleOutlined />
        </Checkbox>
        <Checkbox value="owner">
          Owner <QuestionCircleOutlined />
        </Checkbox>
        <Checkbox value="admin">
          Admin <QuestionCircleOutlined />
        </Checkbox>
      </Checkbox.Group>
    </Flex>
  );
};

export default Settings;

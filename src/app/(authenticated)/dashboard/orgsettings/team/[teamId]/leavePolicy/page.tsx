'use client';

import { Button, Card, Flex, Form, Select, Switch } from 'antd';
import React from 'react';

const LeavePolicy = ({ name }: { name: string }) => {
  const onFinish = (values: any) => {};

  return (
    <Card
      title={
        <Flex>
          <div
            style={{
              height: '15px',
              width: '15px',
              margin: '6px 6px 0px 0px',
              backgroundColor: '#34cfeb',
              borderRadius: '50%',
            }}
          />
          {name}
        </Flex>
      }
    >
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="Unlimited"
          valuePropName="checked"
          help="Allow unlimited leave days"
        >
          <Switch className="bg-purple-500 mr-3" />
        </Form.Item>

        <Form.Item label="Maximum 14 leave days per year" name="maxleave">
          <Select
            style={{ width: '100px' }}
            placeholder="select how many days you want"
          >
            {Array.from(Array(14).keys()).map((i) => (
              <Select.Option key={i + 1} value={i + 1}>
                {i + 1}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="Accruals"
          valuePropName="checked"
          extra="if you enable accruals,leave will be earned continuously over the year"
          label="Accruels"
        >
          <Switch className="bg-purple-500 mr-3" />
        </Form.Item>
        <Form.Item
          name="rollOver"
          valuePropName="checked"
          initialValue={false}
          help=" Roll over will be enabled by default when using accruals."
          label="Roll over unused leave to next year"
        >
          <Switch className="bg-purple-500 mr-2" />
        </Form.Item>

        <Form.Item
          className="autoApproveLeave"
          name="autoApprove"
          label="Auto approve each leave request"
          initialValue={false}
        >
          <Switch className="bg-purple-500 mr-3" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

const leaveTypes: string[] = ['paidOf', 'sick'];

const LeavePolicyPage = () => {
  return (
    <Card title="Teamname-Leave-policy">
      <Flex gap={12}>
        {leaveTypes.map((name: any) => (
          <LeavePolicy key={name} name={name} />
        ))}
      </Flex>
    </Card>
  );
};

export default LeavePolicyPage;

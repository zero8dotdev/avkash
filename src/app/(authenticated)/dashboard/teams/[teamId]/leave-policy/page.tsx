'use client';

import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Flex,
  Form,
  InputNumber,
  List,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { fetchLeavePolicies, updatePolicyData } from '../_actions';
import TeamSettingsTabs from '../_components/team-settings-tabs';
import LeavePolicyModal from '../_components/leave-policy-modal';

const Page = () => {
  const [segmentValue, setSegmentValue] = useState<string | number>('active');
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const { teamId } = useParams() as { teamId: string };
  const [selectedLeaveType, setSelectedLeaveType] = useState<any>(null);
  // Fetch team data
  const {
    data: teamData,
    error,
    isValidating,
  } = useSWR(`teamsettings*${teamId}`);

  const fetcher = async (key: string) => {
    const team = key.split('*')[1];
    return await fetchLeavePolicies(team);
  };

  const {
    data: leavePolicies = [],
    error: leavePoliciesError,
    mutate,
    isValidating: leavePoliciesLoading,
  } = useSWR(`teampolicies*${teamId}`, fetcher);

  const activeLeavePolicies =
    leavePolicies?.filter((leaveType: any) => leaveType.isActive) || [];
  const inactiveLeavePolicies =
    leavePolicies?.filter((leaveType: any) => !leaveType.isActive) || [];

  const { Item } = Form;
  const [form] = Form.useForm();

  const openModal = (policy: any) => {
    setSelectedPolicy(policy);
    form.setFieldsValue({
      maxLeaves: policy.maxLeaves,
      unlimited: policy.unlimited,
      accruals: policy.accruals,
      accrualFrequency: policy.accrualFrequency,
      accrueOn: policy.accrueOn,
      rollOver: policy.rollOver,
      rollOverLimit: policy.rollOverLimit,
      rollOverExpiry: policy.rollOverExpiry
        ? dayjs(policy.rollOverExpiry, 'DD/MM') // Convert to Day.js object
        : null,
      autoApprove: policy.autoApprove,
    });
  };

  return (
    <Row>
      <Col span={3}>
        <TeamSettingsTabs position="leave-policy" />
      </Col>
      <Col span={16}>
        <Card
          title="Team Leave Policy"
          extra={
            <Button type="primary" onClick={() => setSelectedPolicy('create')}>
              Add New Policy
            </Button>
          }
        >
          <Segmented
            value={segmentValue}
            style={{ marginBottom: '20px' }}
            onChange={setSegmentValue}
            options={[
              {
                label: 'active',
                value: 'active',
                icon: <CheckCircleTwoTone />,
              },
              {
                label: 'inactive',
                value: 'inactive',
                icon: <CloseCircleTwoTone />,
              },
            ]}
          />
          <Flex vertical>
            {segmentValue === 'active' ? (
              <List
                bordered
                dataSource={activeLeavePolicies}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => openModal(item)}
                  >
                    <List.Item.Meta
                      title={item?.leaveType?.name}
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: `#${item?.leaveType?.color}`,
                          }}
                        />
                      }
                      description={`${item?.maxLeaves} days per year`}
                    />
                    <Button
                      type="text"
                      danger
                      onClick={async (e) => {
                        e.stopPropagation();
                        await updatePolicyData(
                          teamId,
                          { isActive: false },
                          item.leavePolicyId
                        ); // Update backend data
                        mutate();
                      }}
                    >
                      Disable
                    </Button>
                  </List.Item>
                )}
              />
            ) : (
              <List
                bordered
                dataSource={inactiveLeavePolicies}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => openModal(item)}
                  >
                    <List.Item.Meta
                      title={item?.leaveType?.name}
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: `#${item?.leaveType?.color}`,
                          }}
                        />
                      }
                      description={`${item?.maxLeaves} days per year`}
                    />
                    <Button
                      type="link"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await updatePolicyData(
                          teamId,
                          { isActive: true },
                          item.leavePolicyId
                        ); // Update backend data
                        mutate();
                      }}
                    >
                      Enable
                    </Button>
                  </List.Item>
                )}
              />
            )}
          </Flex>
        </Card>
        <LeavePolicyModal
          selectedPolicy={selectedPolicy}
          teamData={teamData}
          update={() => setSelectedPolicy(null)}
          teamId={teamId}
          callMutate={() => mutate()}
          form={form}
          onChangeLeaveType={(v: any) => setSelectedLeaveType(v)}
          selctedLeaveType={selectedLeaveType}
        />
      </Col>
    </Row>
  );
};

export default Page;

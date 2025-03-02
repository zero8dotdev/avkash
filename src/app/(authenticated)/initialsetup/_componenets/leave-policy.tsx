'use client';

import {
  Avatar,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  Popover,
  Row,
  Segmented,
  Select,
  Switch,
  Tag,
  Typography,
  Button,
  Checkbox,
  Steps,
  List,
  Spin,
} from 'antd';
import {
  LeftOutlined,
  LoadingOutlined,
  SmileOutlined,
  SolutionOutlined,
  UserOutlined,
} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApplicationContext } from '@/app/_context/appContext';
import useSWR from 'swr';
import dayjs from 'dayjs';
import TopSteps from './steps';
import {
  fetchTeamGeneralData,
  insertLeavePolicies,
  updateInitialsetupState,
} from '../_actions';
import { fetchLeavePolicies } from '../../dashboard/teams/[teamId]/_actions';
import RenderLeavePolicy from '../../dashboard/teams/[teamId]/leave-policy/page';
import LeavePolicyModal from '../../dashboard/teams/[teamId]/_components/leave-policy-modal';

const Leavepolicy = () => {
  const [leaveTypes, setLeaveTypes] = React.useState<any[]>([
    { name: 'Paid Time Off', color: '#85a7de', active: true },
    { name: 'Sick', color: '#d7a4ed', active: true },
    { name: 'Unpaid', color: '#dbd1ce', active: false },
  ]);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const {
    state: { orgId, userId, teamId },
    dispatch,
  } = useApplicationContext();

  const fetcherteam = async (teamId: string) => {
    const team = teamId.split('*')[1];
    const data = await fetchTeamGeneralData(team);
    return data;
  };

  const {
    data: teamData,
    error,
    isValidating,
  } = useSWR(`teamsettings*${teamId}`, fetcherteam);

  const fetcher = async (key: string) => {
    const team = key.split('*')[1];
    return await fetchLeavePolicies(team);
  };

  const {
    data: leavePolicies,
    error: leavePoliciesError,
    mutate,
    isValidating: leavePoliciesLoading,
  } = useSWR(`teampolicies*${teamId}`, fetcher);

  const handlenext = async (values: any) => {
    try {
      // Update team settings
      setLoading(true);
      const data = await insertLeavePolicies(orgId, userId, teamId, {
        ...values,
      });
      if (!data) {
        // Handle failure to update team settings
        throw new Error('Failed to update team leave policies');
      }

      // Update initial setup state
      const status = await updateInitialsetupState(orgId, '3');
      if (status) {
        // Navigate to the next page if update is successful
        router.push(
          new URL('/initialsetup/locations', window?.location.origin).toString()
        );
      } else {
        // Handle failure to update initial setup state
        throw new Error('Failed to update initial setup state');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 10000);
    }
  };

  const handlePrevious = () => {
    router.push(
      new URL('/initialsetup/settings', window?.location.origin).toString()
    );
  };

  const handleLeaveTypes = (type: string) => {
    setLeaveTypes((prevLeaveTypes) =>
      prevLeaveTypes.map((leaveType) =>
        leaveType.name === type
          ? { ...leaveType, active: !leaveType.active }
          : leaveType
      )
    );
  };

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
        ? dayjs(policy.rollOverExpiry, 'DD/MM')
        : null,
      autoApprove: policy.autoApprove,
    });
  };

  return (
    <Row
      style={{
        padding: '50px 50px 180px 20px',
        height: '100%',
      }}
    >
      <TopSteps position={2} />
      {leavePolicies && leavePolicies?.length >= 1 ? (
        <Col span={16} push={4}>
          <Card
            style={{ minHeight: '300px' }}
            title={`${teamData?.name} Leave Policies`}
          >
            <List
              bordered
              dataSource={leavePolicies}
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
                </List.Item>
              )}
            />

            <LeavePolicyModal
              selectedPolicy={selectedPolicy}
              teamData={teamData}
              update={() => setSelectedPolicy(null)}
              teamId={teamId}
              callMutate={() => mutate()}
              form={form}
              onChangeLeaveType={() => {}}
              selctedLeaveType={null}
            />
          </Card>
          <Flex justify="space-between" style={{ marginTop: '20px' }}>
            <Button
              danger
              icon={<LeftOutlined />}
              onClick={handlePrevious}
              size="middle"
            >
              Previous
            </Button>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="middle"
                onClick={() =>
                  router.push(
                    new URL(
                      '/initialsetup/locations',
                      window?.location.origin
                    ).toString()
                  )
                }
              >
                Next
              </Button>
            </Form.Item>
            {/* <Button type="primary">Done</Button> */}
          </Flex>
        </Col>
      ) : (
        <Col span={16} push={4}>
          <List loading={loading}>
            <Form
              size="small"
              form={form}
              style={{ width: '90%' }}
              onFinish={handlenext}
            >
              <Card
                style={{
                  margin: '25px 0px 25px 0px',
                  minHeight: '300px',
                  overflow: 'auto',
                }}
              >
                <>
                  {leaveTypes.every((e) => !e.active) && (
                    <Typography.Title level={3} type="danger">
                      Atleast select one leave type
                    </Typography.Title>
                  )}
                  <Row gutter={12}>
                    {leaveTypes.map((e: any, i) => (
                      <Col
                        key={i}
                        // span={activeLeaveTypesCount === 1 ? 24 : 12}
                        span={24}
                        style={{ marginBottom: '8px' }}
                      >
                        {e.active ? (
                          <Card
                            styles={{
                              header: {
                                border: 'none',
                                padding: '0px 12px 0px 20px',
                              },
                              body: { padding: '0px 20px 0px 20px' },
                            }}
                            style={{
                              width: '100%',
                            }}
                            title={
                              <>
                                <Avatar
                                  size={20}
                                  style={{ backgroundColor: e.color }}
                                />
                                <Typography.Text
                                  style={{ marginLeft: '8px', padding: '0px' }}
                                >
                                  {e.name}
                                </Typography.Text>
                              </>
                            }
                            extra={
                              <Tag
                                color="warning"
                                onClick={() => handleLeaveTypes(e.name)}
                              >
                                Disable
                              </Tag>
                            }
                          >
                            <Flex gap={12} justify="space-between">
                              <Typography.Text>
                                unlimited leaves
                              </Typography.Text>
                              <Popover
                                content={
                                  form.getFieldValue([e.name, 'unlimited'])
                                    ? 'Unlimited days per year'
                                    : 'Allow unlimited leaves days'
                                }
                              >
                                <Form.Item
                                  name={[e.name, 'unlimited']}
                                  style={{ margin: '0px 0px 10px 0px' }}
                                  initialValue={false}
                                  rules={[
                                    {
                                      required: true,
                                      message:
                                        'Please specify if unlimited leave is allowed.',
                                    },
                                  ]}
                                >
                                  <Switch />
                                </Form.Item>
                              </Popover>
                            </Flex>
                            <Form.Item
                              style={{ margin: '0px 0px 0px 0px' }}
                              shouldUpdate={(prevValues, currentValues) => {
                                return (
                                  prevValues[e.name].unlimited !==
                                  currentValues[e.name].unlimited
                                );
                              }}
                            >
                              {({ getFieldValue }) => {
                                return !getFieldValue([e.name, 'unlimited']) ? (
                                  <>
                                    <Flex gap={12} vertical>
                                      <Typography.Text>
                                        Maximum leaves
                                      </Typography.Text>
                                      <Popover content="maximum 365 leave days per year">
                                        <Form.Item
                                          name={[e.name, 'maxLeaves']}
                                          style={{ margin: '0px 0px 10px 0px' }}
                                          initialValue={14}
                                          rules={[
                                            {
                                              required: true,
                                              message:
                                                'Please specify the maximum number of leaves.',
                                            },
                                            {
                                              type: 'number',
                                              min: 1,
                                              max: 365,
                                              message:
                                                'The number of leaves must be between 1 and 365.',
                                            },
                                          ]}
                                          getValueFromEvent={(e) => {
                                            const { value } = e.target;
                                            return value
                                              ? Number(value)
                                              : undefined; // Convert string to number
                                          }}
                                        >
                                          <Input
                                            type="number"
                                            min={1}
                                            max={365}
                                          />
                                        </Form.Item>
                                      </Popover>
                                    </Flex>

                                    <Flex gap={12} justify="space-between">
                                      <Typography.Text>
                                        Accruals leaves
                                      </Typography.Text>
                                      <Popover content="If you enable accruals, leave will be earned continuously over the year">
                                        <Form.Item
                                          name={[e.name, 'accruals']}
                                          style={{ margin: '0px 0px 10px 0px' }}
                                          initialValue={false}
                                        >
                                          <Switch />
                                        </Form.Item>
                                      </Popover>
                                    </Flex>

                                    <Form.Item
                                      style={{ margin: '0px' }}
                                      shouldUpdate={(
                                        prevValues,
                                        currentValues
                                      ) =>
                                        prevValues[e.name].accruals !==
                                        currentValues[e.name].accruals
                                      }
                                    >
                                      {({ getFieldValue }) => {
                                        return getFieldValue([
                                          e.name,
                                          'accruals',
                                        ]) ? (
                                          <Flex justify="space-between">
                                            <Flex vertical gap={5}>
                                              <Typography.Text>
                                                Accrual Frequency
                                              </Typography.Text>
                                              <Popover content="You can set accrual frequency only once.">
                                                <Form.Item
                                                  name={[
                                                    e.name,
                                                    'accrualFrequency',
                                                  ]}
                                                  style={{ margin: '0px' }}
                                                  rules={[
                                                    {
                                                      required: true,
                                                      message:
                                                        'Please select an accrual frequency.',
                                                    },
                                                  ]}
                                                >
                                                  <Select
                                                    options={[
                                                      {
                                                        value: 'MONTHLY',
                                                        label: 'Monthly',
                                                      },
                                                      {
                                                        value: 'QUARTERLY',
                                                        label: 'Quarterly',
                                                      },
                                                    ]}
                                                  />
                                                </Form.Item>
                                              </Popover>
                                            </Flex>
                                            <Flex vertical gap={5}>
                                              <Typography.Text>
                                                Accrual On
                                              </Typography.Text>
                                              <Form.Item
                                                style={{
                                                  margin: '0px 0px 0px 0px',
                                                }}
                                                name={[e.name, 'accrueOn']}
                                                initialValue="BEGINNING"
                                              >
                                                <Segmented
                                                  options={['BEGINNING', 'END']}
                                                />
                                              </Form.Item>
                                            </Flex>
                                          </Flex>
                                        ) : null;
                                      }}
                                    </Form.Item>
                                    <Flex gap={12} justify="space-between">
                                      <Typography.Text>
                                        Roll over
                                      </Typography.Text>
                                      <Popover content="Roll over unused leave to next year">
                                        <Form.Item
                                          name={[e.name, 'rollOver']}
                                          style={{ margin: '0px 0px 10px 0px' }}
                                          initialValue={false}
                                        >
                                          <Switch />
                                        </Form.Item>
                                      </Popover>
                                    </Flex>
                                    <Form.Item
                                      style={{ margin: '0px' }}
                                      shouldUpdate={(
                                        prevValues,
                                        currentValues
                                      ) =>
                                        prevValues[e.name].rollOver !==
                                        currentValues[e.name].rollOver
                                      }
                                    >
                                      {({ getFieldValue }) => {
                                        return getFieldValue([
                                          e.name,
                                          'rollOver',
                                        ]) ? (
                                          <Flex justify="space-between">
                                            <Flex vertical gap={5}>
                                              <Typography.Text>
                                                Limit roll over unused leave to
                                                next year
                                              </Typography.Text>
                                              <Popover content="Instead of rolling over all unused days, this allows you to set a maximum number of days.">
                                                {/* <Form.Item
                                                  name={[
                                                    e.name,
                                                    "rollOverLimit",
                                                  ]}
                                                  rules={[
                                                    {
                                                      required: true,
                                                      message: "Please specify a roll-over limit.",
                                                    },
                                                    ({ getFieldValue }) => ({
                                                      validator(_, value) {
                                                        const maxLeaves = getFieldValue([e.name, "maxLeaves"]);
                                                        if (!value || (value >= 1 && value <= maxLeaves)) {
                                                          return Promise.resolve();
                                                        }
                                                        return Promise.reject(
                                                          new Error(`Roll-over limit must be between 1 and ${maxLeaves} days.`)
                                                        );
                                                      },
                                                    }),
                                                  ]}
                                                >
                                                  <Input
                                                    type="number"
                                                    min={1}
                                                    max={form.getFieldValue([
                                                      e.name,
                                                      "maxLeaves",
                                                    ])}
                                                    suffix={
                                                      <span
                                                        style={{
                                                          marginRight: "15px",
                                                        }}
                                                      >
                                                        days
                                                      </span>
                                                    }
                                                  />
                                                </Form.Item> */}
                                                <Form.Item
                                                  name={[
                                                    e.name,
                                                    'rollOverLimit',
                                                  ]}
                                                  dependencies={[
                                                    [e.name, 'maxLeaves'],
                                                  ]}
                                                  rules={[
                                                    {
                                                      required: true,
                                                      message:
                                                        'Please specify a roll-over limit.',
                                                    },
                                                    ({ getFieldValue }) => ({
                                                      validator(_, value) {
                                                        const maxLeaves =
                                                          getFieldValue([
                                                            e.name,
                                                            'maxLeaves',
                                                          ]);
                                                        if (
                                                          value === undefined ||
                                                          value === null ||
                                                          (value >= 1 &&
                                                            value <= maxLeaves)
                                                        ) {
                                                          return Promise.resolve();
                                                        }
                                                        return Promise.reject(
                                                          new Error(
                                                            `Roll-over limit must be between 1 and ${maxLeaves} days.`
                                                          )
                                                        );
                                                      },
                                                    }),
                                                  ]}
                                                >
                                                  <Input
                                                    type="number"
                                                    min={1}
                                                    max={form.getFieldValue([
                                                      e.name,
                                                      'maxLeaves',
                                                    ])}
                                                    suffix={
                                                      <span
                                                        style={{
                                                          marginRight: '15px',
                                                        }}
                                                      >
                                                        days
                                                      </span>
                                                    }
                                                  />
                                                </Form.Item>
                                              </Popover>
                                            </Flex>
                                            <Flex vertical gap={5}>
                                              <Typography.Text>
                                                Roll Over Expiry
                                              </Typography.Text>
                                              <Popover content="Instead of keeping  roll over days indefinitely, you  can set an expiration date here.">
                                                <Form.Item
                                                  name={[
                                                    e.name,
                                                    'rollOverExpiry',
                                                  ]}
                                                  rules={[
                                                    {
                                                      required: true,
                                                      message:
                                                        'Please select a roll-over expiry date.',
                                                    },
                                                  ]}
                                                >
                                                  <DatePicker
                                                    format=""
                                                    onChange={(date) => {
                                                      form.setFieldsValue({
                                                        rollOverExpiry: date
                                                          ? date.format('DD/MM')
                                                          : null,
                                                      });
                                                    }}
                                                  />
                                                </Form.Item>
                                              </Popover>
                                            </Flex>
                                          </Flex>
                                        ) : null;
                                      }}
                                    </Form.Item>
                                  </>
                                ) : null;
                              }}
                            </Form.Item>

                            <Flex gap={12} justify="space-between">
                              <Typography.Text>Auto approve</Typography.Text>
                              <Popover content="Auto approve each leave request">
                                <Form.Item
                                  name={[e.name, 'autoApprove']}
                                  style={{ margin: '0px 0px 10px 0px' }}
                                  initialValue={false}
                                >
                                  <Switch />
                                </Form.Item>
                              </Popover>
                            </Flex>
                          </Card>
                        ) : (
                          <Card
                            title={
                              <>
                                <Avatar
                                  size={15}
                                  style={{
                                    backgroundColor: e.color,
                                    marginRight: '10px',
                                  }}
                                />
                                {e.name}
                              </>
                            }
                            style={{
                              width: '100%',
                            }}
                            styles={{
                              header: { border: 'none', padding: '8px' },
                              body: { padding: '0px' },
                            }}
                            extra={
                              <Tag
                                color="success"
                                onClick={() => handleLeaveTypes(e.name)}
                              >
                                Enable
                              </Tag>
                            }
                          />
                        )}
                      </Col>
                    ))}
                  </Row>
                </>
              </Card>
              <Flex justify="space-between">
                <Button
                  danger
                  icon={<LeftOutlined />}
                  onClick={handlePrevious}
                  size="middle"
                >
                  Previous
                </Button>
                <Form.Item>
                  <Button type="primary" htmlType="submit" size="middle">
                    Next
                  </Button>
                </Form.Item>
                {/* <Button type="primary">Done</Button> */}
              </Flex>
            </Form>
          </List>
        </Col>
      )}
    </Row>
  );
};

export default Leavepolicy;

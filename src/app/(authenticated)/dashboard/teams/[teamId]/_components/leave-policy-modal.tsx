import {
  Button,
  DatePicker,
  Divider,
  Flex,
  Form,
  FormInstance,
  InputNumber,
  message,
  Modal,
  Segmented,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useApplicationContext } from '@/app/_context/appContext';
import {
  createPolicyData,
  fetchOrgleaveTypes,
  updatePolicyData,
} from '../_actions';

const LeavePolicyModal = ({
  selectedPolicy,
  teamData,
  update,
  teamId,
  callMutate,
  form,
  onChangeLeaveType,
  selctedLeaveType,
}: {
  selectedPolicy: any;
  teamData: any;
  update: () => void;
  teamId: any;
  callMutate: () => void;
  form: FormInstance;
  onChangeLeaveType: Function;
  selctedLeaveType: any;
}) => {
  const {
    state: { orgId },
    dispatch,
  } = useApplicationContext();

  const [messageApi, contextHolder] = message.useMessage();

  const [isUnlimitedLeave, setIsUnlimitedLeave] = useState(false);
  const [isAccruals, setIsAccruals] = useState(false);
  const [isRollOver, setIsRollOver] = useState(false);

  const [leaveTypes, setLeaveTypes] = useState<
    { leaveTypeId: any; name: any }[]
  >([]);

  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const orgLeaveTypes = await fetchOrgleaveTypes(orgId);
      setLeaveTypes(orgLeaveTypes);
      if (orgLeaveTypes.length > 0) {
        setSelectedLeaveId(orgLeaveTypes[0].leaveTypeId); // ✅ set default id
        onChangeLeaveType(orgLeaveTypes[0].leaveTypeId); // optional
      }
    };

    fetchData();
  }, [orgId]);

  // const fetchLeaveTypes = async () => {
  //   const orgLeaveTypes = await fetchOrgleaveTypes(orgId);
  //   return orgLeaveTypes;
  // };
  const { Item } = Form;

  useEffect(() => {
    if (selectedPolicy && selectedPolicy !== 'create') {
      const isUnlimited = selectedPolicy?.unlimited || false;
      const isAccruals = selectedPolicy?.accruals || false;
      const isRollOver = selectedPolicy?.rollOver || false;
      setIsAccruals(isAccruals);
      setIsRollOver(isRollOver);
      setIsUnlimitedLeave(isUnlimited);
    }
  }, [selectedPolicy]);

  return (
    <Modal
      footer={null}
      open={selectedPolicy !== null}
      width={700}
      title={
        selectedPolicy === 'create' ? (
          <Typography.Title>Create New Policy</Typography.Title>
        ) : (
          <Flex vertical>
            <Typography.Title level={3}>
              {selectedPolicy?.leaveType?.name}
            </Typography.Title>
            <Typography.Paragraph
              type="secondary"
              style={{ fontSize: '20px', marginTop: '0px' }}
            >
              For {teamData?.name} Team
            </Typography.Paragraph>
          </Flex>
        )
      }
      onCancel={() => update()}
    >
      {selectedPolicy === 'create' ? (
        <Flex vertical gap={10}>
          <Typography.Text strong>Select Leave Type</Typography.Text>
          <Select
            style={{ width: '50%' }}
            value={selectedLeaveId}
            onChange={(id) => {
              setSelectedLeaveId(id); // ✅ stores selected leaveTypeId
              onChangeLeaveType(id); // ✅ pass it back if needed
            }}
          >
            {leaveTypes.map((e) => (
              <Select.Option key={e.leaveTypeId} value={e.leaveTypeId}>
                {e.name}
              </Select.Option>
            ))}
          </Select>

          {contextHolder}
          {selctedLeaveType && (
            <Form
              form={form}
              onFinish={async (values) => {
                if (values.rollOverExpiry) {
                  values.rollOverExpiry = values.rollOverExpiry.format('DD/MM');
                }

                try {
                  const result = await createPolicyData(
                    teamId,
                    values,
                    selectedLeaveId
                  );

                  if (result?.message === 'LeavePolicy Already Exists') {
                    messageApi.warning(
                      'A policy with this Leave Type already exists for this team.'
                    );
                    form.resetFields();
                  }
                  if (result?.message === 'LeavePolicy Added Successfully') {
                    messageApi.success('Policy created successfully!');
                    form.resetFields();
                  }
                  callMutate();
                  update();
                } catch (err) {
                  console.error(err);
                  messageApi.error(
                    'Failed to create policy. Please try again.'
                  );
                }
              }}
            >
              {!isUnlimitedLeave && (
                <Flex gap={50}>
                  <Item
                    name="maxLeaves"
                    style={{ padding: '0px', margin: '0px' }}
                  >
                    <InputNumber />
                  </Item>
                  <Typography.Text strong>Days per year</Typography.Text>
                </Flex>
              )}
              <Flex
                gap={95}
                style={{ padding: '0px', margin: '12px 0px 0px 0px' }}
              >
                <Item
                  name="unlimited"
                  style={{ padding: '0px', margin: '0px' }}
                >
                  <Switch
                    onChange={(checked) => {
                      if (checked) {
                        setIsUnlimitedLeave(true);
                      } else {
                        setIsUnlimitedLeave(false);
                      }
                    }}
                  />
                </Item>
                <Typography.Text strong>
                  Allow unlimited leave days
                </Typography.Text>
              </Flex>
              <Flex
                gap={95}
                style={{ padding: '0px', margin: '12px 0px 0px 0px' }}
              >
                <Item name="accruals">
                  <Switch
                    onChange={(checked) => {
                      if (checked) {
                        setIsAccruals(true);
                      } else {
                        setIsAccruals(false);
                      }
                    }}
                  />
                </Item>
                <Flex vertical gap={5}>
                  <Typography.Text strong>Accruals</Typography.Text>

                  <Typography.Text type="secondary">
                    If you enable accruals, leave will be earned continuously
                    over the year.
                  </Typography.Text>
                  {isAccruals && (
                    <>
                      <Flex gap={10}>
                        <Typography.Text type="secondary">
                          Accrual Frequency
                        </Typography.Text>
                        <Item
                          name="accrualFrequency"
                          style={{
                            padding: '0px',
                            margin: '0px',
                            width: '100px',
                          }}
                        >
                          <Select
                            options={[
                              { value: 'BIWEEKLY', label: 'Biweekly' },
                              { value: 'WEEKLY', label: 'Weekly' },
                              { value: 'MONTHLY', label: 'Monthly' },
                              { value: 'QUARTERLY', label: 'Quarterly' },
                              { value: 'HALF_YEARLY', label: 'Half Yearly' },
                            ]}
                          />
                        </Item>
                      </Flex>
                      <Flex gap={10} style={{ marginTop: '15px' }}>
                        <Typography.Text type="secondary">
                          Accrual On
                        </Typography.Text>
                        <Item
                          name="accrueOn"
                          initialValue="BEGINNING"
                          style={{
                            padding: '0px',
                            margin: '0px',
                            width: '100px',
                          }}
                        >
                          <Segmented options={['BEGINNING', 'END']} />
                        </Item>
                      </Flex>
                    </>
                  )}
                </Flex>
              </Flex>
              <Divider />
              <Flex gap={95}>
                <Item name="rollOver">
                  <Switch
                    onChange={(checked) => {
                      if (checked) {
                        setIsRollOver(true);
                      } else {
                        setIsRollOver(false);
                      }
                    }}
                  />
                </Item>
                <Space direction="vertical">
                  <Typography.Text strong>
                    Roll over unused leave to next year
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    Roll over will be enabled by default when using accruals.
                  </Typography.Text>
                </Space>
              </Flex>
              {isRollOver && (
                <>
                  {' '}
                  <Flex gap={95}>
                    <Space direction="vertical">
                      <Typography.Text strong>
                        Limit roll over days
                      </Typography.Text>
                      <Flex gap={8}>
                        <Typography.Text type="secondary">
                          Limit roll over days each year to
                        </Typography.Text>
                        <Item
                          name="rollOverLimit"
                          rules={[
                            {
                              validator: (_, value) => {
                                const maxLeaves =
                                  form.getFieldValue('maxLeaves'); // Get the maxLeaves value
                                if (value === undefined || value <= maxLeaves) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(
                                  new Error(
                                    `Roll over limit cannot exceed ${maxLeaves} days.`
                                  )
                                );
                              },
                            },
                          ]}
                          style={{ margin: '0px 0px 2px 2px', padding: '0px' }}
                        >
                          <InputNumber />
                        </Item>
                        <Typography.Text type="secondary">days</Typography.Text>
                      </Flex>
                    </Space>
                  </Flex>
                  <Flex gap={95}>
                    <Space direction="vertical">
                      <Typography.Text strong>Roll over expiry</Typography.Text>
                      <Space>
                        <Typography.Text type="secondary">
                          Roll over days expire each year on
                        </Typography.Text>
                        <Item
                          name="rollOverExpiry"
                          style={{ margin: '0px 0px 2px 2px', padding: '0px' }}
                        >
                          <DatePicker format="DD/MM" />
                        </Item>
                      </Space>
                    </Space>
                  </Flex>
                </>
              )}
              <Divider />
              <Flex gap={95}>
                <Item name="autoApprove">
                  <Switch />
                </Item>
                <Typography.Text strong>
                  Auto approve each leave request
                </Typography.Text>
              </Flex>
              <Flex justify="space-between">
                <Button
                  onClick={() => {
                    update();
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Item>
                  <Button type="primary" htmlType="submit">
                    Save
                  </Button>
                </Item>
              </Flex>
            </Form>
          )}
        </Flex>
      ) : (
        <Form
          form={form}
          onFinish={async (values) => {
            if (values.rollOverExpiry) {
              values.rollOverExpiry = values.rollOverExpiry.format('DD/MM'); // or use "DD/MM" depending on your requirement
            }
            await updatePolicyData(
              teamId,
              values,
              selectedPolicy.leavePolicyId
            ); // Update backend data
            callMutate();
            update();
          }}
        >
          {!isUnlimitedLeave && (
            <Flex gap={50}>
              <Item name="maxLeaves" style={{ padding: '0px', margin: '0px' }}>
                <InputNumber />
              </Item>
              <Typography.Text strong>Days per year</Typography.Text>
            </Flex>
          )}
          <Flex gap={95} style={{ padding: '0px', margin: '12px 0px 0px 0px' }}>
            <Item name="unlimited" style={{ padding: '0px', margin: '0px' }}>
              <Switch
                onChange={(checked) => {
                  if (checked) {
                    setIsUnlimitedLeave(true);
                  } else {
                    setIsUnlimitedLeave(false);
                  }
                }}
              />
            </Item>
            <Typography.Text strong>Allow unlimited leave days</Typography.Text>
          </Flex>
          <Flex gap={95} style={{ padding: '0px', margin: '12px 0px 0px 0px' }}>
            <Item name="accruals">
              <Switch
                onChange={(checked) => {
                  if (checked) {
                    setIsAccruals(true);
                  } else {
                    setIsAccruals(false);
                  }
                }}
              />
            </Item>
            <Flex vertical gap={5}>
              <Typography.Text strong>Accruals</Typography.Text>

              <Typography.Text type="secondary">
                If you enable accruals, leave will be earned continuously over
                the year.
              </Typography.Text>
              {isAccruals && (
                <>
                  <Flex gap={10}>
                    <Typography.Text type="secondary">
                      Accrual Frequency
                    </Typography.Text>
                    <Item
                      name="accrualFrequency"
                      style={{ padding: '0px', margin: '0px', width: '100px' }}
                    >
                      <Select
                        options={[
                          { value: 'BIWEEKLY', label: 'Biweekly' },
                          { value: 'WEEKLY', label: 'Weekly' },
                          { value: 'MONTHLY', label: 'Monthly' },
                          { value: 'QUARTERLY', label: 'Quarterly' },
                          { value: 'HALF_YEARLY', label: 'Half Yearly' },
                        ]}
                      />
                    </Item>
                  </Flex>
                  <Flex gap={10} style={{ marginTop: '15px' }}>
                    <Typography.Text type="secondary">
                      Accrual On
                    </Typography.Text>
                    <Item
                      name="accrueOn"
                      initialValue="BEGINNING"
                      style={{ padding: '0px', margin: '0px', width: '100px' }}
                    >
                      <Segmented options={['BEGINNING', 'END']} />
                    </Item>
                  </Flex>
                </>
              )}
            </Flex>
          </Flex>
          <Divider />
          <Flex gap={95}>
            <Item name="rollOver">
              <Switch
                onChange={(checked) => {
                  if (checked) {
                    setIsRollOver(true);
                  } else {
                    setIsRollOver(false);
                  }
                }}
              />
            </Item>
            <Space direction="vertical">
              <Typography.Text strong>
                Roll over unused leave to next year
              </Typography.Text>

              <Typography.Text type="secondary">
                Roll over will be enabled by default when using accruals.
              </Typography.Text>
            </Space>
          </Flex>
          {isRollOver && (
            <>
              <Flex gap={95}>
                <Space direction="vertical">
                  <Typography.Text strong>Limit roll over days</Typography.Text>
                  <Flex gap={8}>
                    <Typography.Text type="secondary">
                      Limit roll over days each year to
                    </Typography.Text>
                    <Item
                      name="rollOverLimit"
                      rules={[
                        {
                          validator: (_, value) => {
                            const maxLeaves = form.getFieldValue('maxLeaves'); // Get the maxLeaves value
                            if (value === undefined || value <= maxLeaves) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error(
                                `Roll over limit cannot exceed ${maxLeaves} days.`
                              )
                            );
                          },
                        },
                      ]}
                      style={{ margin: '0px 0px 2px 2px', padding: '0px' }}
                    >
                      <InputNumber />
                    </Item>
                    <Typography.Text type="secondary">days</Typography.Text>
                  </Flex>
                </Space>
              </Flex>
              <Flex gap={95}>
                <Space direction="vertical">
                  <Typography.Text strong>Roll over expiry</Typography.Text>
                  <Space>
                    <Typography.Text type="secondary">
                      Roll over days expire each year on
                    </Typography.Text>
                    <Item
                      name="rollOverExpiry"
                      style={{ margin: '0px 0px 2px 2px', padding: '0px' }}
                    >
                      <DatePicker format="DD/MM" />
                    </Item>
                  </Space>
                </Space>
              </Flex>{' '}
            </>
          )}
          <Divider />
          <Flex gap={95}>
            <Item name="autoApprove">
              <Switch />
            </Item>
            <Typography.Text strong>
              Auto approve each leave request
            </Typography.Text>
          </Flex>
          <Flex justify="space-between">
            <Button
              onClick={() => {
                update();
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Item>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Item>
          </Flex>
        </Form>
      )}
    </Modal>
  );
};

export default LeavePolicyModal;

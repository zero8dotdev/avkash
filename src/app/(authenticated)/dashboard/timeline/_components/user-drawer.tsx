'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Drawer,
  Flex,
  Form,
  List,
  Radio,
  Space,
  Switch,
  Typography,
  message,
} from 'antd';
import type { DatePickerProps } from 'antd';
import type { Dayjs } from 'dayjs';
import TextArea from 'antd/es/input/TextArea';
import { CalendarOutlined, CloseOutlined } from '@ant-design/icons';
import { useApplicationContext } from '@/app/_context/appContext';
import useSWR from 'swr';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { getLeaves } from '../../users/_actions';
import { getHalfDayLeave, insertLeave } from '../_actions';
import UserModal from '../../users/_components/user-modal';

const UserDrawer = ({
  selectedUser,
  onSelectUserChange,
  leaveTypes,
  triggerMutate,
}: {
  selectedUser: any;
  onSelectUserChange: any;
  leaveTypes: any;
  triggerMutate: Function;
}) => {
  const [form] = Form.useForm();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAddLeaveForm, setShowAddLeaveForm] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [isLoading, setIsLoading] = useState(false);

  const [isHalfDayAvailable, setIsHalfDayAvailable] = useState(false);

  const {
    state: { orgId, userId, teamId, role },
  } = useApplicationContext();

  const leaveRequestsFetcher = (userId: string) => getLeaves(userId);

  const router = useRouter();
  const handleClick = () => {
    setIsLoading(true);
    router.push('/dashboard/orgsettings/leave-types');
  };

  const {
    data: leaveRequestData,
    isLoading: isLeaveRequestLoading,
    mutate,
  } = useSWR(
    selectedUser?.userId
      ? [`leave-requests-${selectedUser.userId}`, selectedUser.userId]
      : null,
    ([_, userId]) => leaveRequestsFetcher(userId)
  );

  // useEffect(() => {
  //   console.log(isHalfDayAvailable, 'HALFDAY');
  //   const fetchHalfDayStatus = async () => {
  //     const halfDayStatus = await getHalfDayLeave(orgId);
  //     setIsHalfDayAvailable(halfDayStatus);
  //   };

  //   fetchHalfDayStatus();
  // }, [form.getFieldValue('Date'), form.getFieldValue('isHalfDay')]);

  const cellRender: DatePickerProps<Dayjs>['cellRender'] = (current, info) => {
    const style = { backgroundColor: '#E85A4F' }; // Define the style variable
    if (info.type !== 'date') {
      return info.originNode;
    }
    if (typeof current === 'number' || typeof current === 'string') {
      return <div className="ant-picker-cell-inner">{current}</div>;
    }
    return <div className="ant-picker-cell-inner">{current.date()}</div>;
  };

  const handleError = useCallback(
    (error: any) => {
      const errorMessage = error?.message;

      if (
        error?.code === 'P0001' &&
        errorMessage === 'Leave request overlaps with existing leave period'
      ) {
        messageApi.error(
          'You already have leave scheduled for these dates. Please choose different dates or adjust the duration/shift.'
        );
      } else {
        messageApi.error(errorMessage || 'Failed to submit leave request.');
      }
    },
    [messageApi]
  );

  const handleSuccess = useCallback(() => {
    setShowAddLeaveForm(false);
    form.resetFields();
    messageApi.success('Leave request submitted successfully!');
  }, [messageApi, form, setShowAddLeaveForm]);

  const handleAddLeave = async (values: any) => {
    try {
      values.isApproved = values.isApproved ? 'APPROVED' : 'PENDING';
      const formattedStartDate = format(new Date(values.Date[0]), 'yyyy-MM-dd');
      const formattedEndDate = format(new Date(values.Date[1]), 'yyyy-MM-dd');

      values.startDate = formattedStartDate;
      values.endDate = formattedEndDate;
      const { data, error } = await insertLeave(
        values,
        selectedUser?.orgId,
        selectedUser?.teamId,
        selectedUser?.userId
      );

      if (error) {
        handleError(error);
        return;
      }

      handleSuccess();
      mutate();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      messageApi.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleDrawerClose = () => {
    // Close the drawer
    onSelectUserChange();
    triggerMutate();
    setShowAddLeaveForm(false);
    form.resetFields();
  };

  const getLeaveIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sick':
        return <span className=" text-xl">🤒</span>;
      case 'paid time off':
        return <span className=" text-xl">🏖️</span>;
      case 'unpaid':
        return <span className="text-xl">📅</span>;
      default:
        return <span className="text-xl">📅</span>;
    }
  };

  const isManagerOrOwner = role === 'MANAGER' || role === 'OWNER';

  return (
    <>
      {contextHolder}
      <Drawer
        open={selectedUser !== null}
        title={
          <Flex gap={12}>
            <Avatar size={34} src={selectedUser?.picture} />

            <Flex vertical>
              <Typography.Text strong style={{ margin: '0px', padding: '0px' }}>
                {selectedUser?.name}
              </Typography.Text>
              {role === 'USER' && selectedUser?.userId !== userId ? null : (
                <a
                  style={{
                    fontSize: '12px',
                    textDecoration: 'underline',
                    color: '#E85A4F',
                  }}
                  onClick={() => setUserProfile(selectedUser)}
                >
                  user profile
                </a>
              )}
            </Flex>
          </Flex>
        }
        closable={false}
        maskClosable
        autoFocus={false}
        onClose={handleDrawerClose}
        extra={<CloseOutlined onClick={handleDrawerClose} />}
      >
        {((role === 'MANAGER' && teamId === selectedUser?.teamId) ||
          role === 'OWNER' ||
          selectedUser?.userId === userId) &&
          !showAddLeaveForm && (
            <Button
              type="primary"
              onClick={() => setShowAddLeaveForm(true)}
              style={{ marginBottom: '20px' }}
            >
              Add leave
            </Button>
          )}

        {/* Add Leave Form */}
        {showAddLeaveForm && (
          <Card
            style={{ marginBottom: '20px' }}
            title="   "
            styles={{
              header: {
                backgroundColor: '#E85A4F',
              },
            }}
          >
            <Form
              layout="vertical"
              form={form}
              onFinish={handleAddLeave}
              initialValues={{ type: leaveTypes[0]?.value }}
            >
              <Form.Item
                label="Leave Type"
                name="type"
                rules={[
                  { required: true, message: 'Please select a leave type' },
                ]}
              >
                {leaveTypes.length == 0 ? (
                  <div>
                    <p className="text-sm text-[#E85A4F]">
                      You have not added any Leave Policy yet..
                    </p>
                    <Button danger onClick={handleClick}>
                      {isLoading ? (
                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                      ) : (
                        'Add Leave Policy'
                      )}
                    </Button>
                  </div>
                ) : (
                  <Radio.Group>
                    {leaveTypes.map((type: any) => (
                      <Radio
                        key={type?.LeaveType?.name}
                        value={type?.leaveTypeId}
                      >
                        {type?.LeaveType?.name}
                      </Radio>
                    ))}
                  </Radio.Group>
                )}
              </Form.Item>
              <Form.Item
                label="Start Date & End Date"
                name="Date"
                rules={[
                  {
                    required: true,
                    message: 'Please select a start date and end date',
                  },
                ]}
              >
                <DatePicker.RangePicker
                  placement="bottomLeft"
                  cellRender={cellRender}
                  // disabledDate={(current) => {
                  //   const today = new Date();
                  //   today.setHours(0, 0, 0, 0);
                  //   if (current && current.toDate() < today) {
                  //     return true;
                  //   }
                  //   return false;
                  // }}
                />
              </Form.Item>
              {form.getFieldValue('Date') &&
                form.getFieldValue('Date')?.[0] &&
                form.getFieldValue('Date')?.[1] &&
                form
                  .getFieldValue('Date')[0]
                  .isSame(form.getFieldValue('Date')[1], 'day') &&
                isHalfDayAvailable && (
                  <>
                    <Form.Item
                      label="Half Day Leave?"
                      name="isHalfDay"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>

                    {form.getFieldValue('isHalfDay') && (
                      <Form.Item
                        label="Select Shift"
                        name="halfDayShift"
                        rules={[
                          {
                            required: true,
                            message: 'Please select Morning or Afternoon',
                          },
                        ]}
                      >
                        <Radio.Group>
                          <Radio value="MORNING">Morning</Radio>
                          <Radio value="AFTERNOON">Afternoon</Radio>
                        </Radio.Group>
                      </Form.Item>
                    )}
                  </>
                )}

              <Form.Item label="Leave Note" name="leaveRequestNote">
                <TextArea rows={4} placeholder="Enter leave details" />
              </Form.Item>

              {/* Conditional Approve Switch for Manager or Owner */}
              {isManagerOrOwner && (
                <Form.Item
                  label="Approve this leave?"
                  name="isApproved"
                  valuePropName="checked"
                >
                  <Switch defaultValue={false} />
                </Form.Item>
              )}

              <Flex gap={12}>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
                <Button onClick={() => setShowAddLeaveForm(false)}>
                  Cancel
                </Button>
              </Flex>
            </Form>
          </Card>
        )}

        {/* Leave Requests List */}
        {!showAddLeaveForm && (
          <List
            dataSource={leaveRequestData || []}
            renderItem={(item: any, i: number) => (
              <List.Item style={{ padding: 0 }}>
                <Card
                  key={i}
                  style={{
                    borderLeft: `8px solid #${item.color ?? '9ca3af'}`,
                    width: '100%',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    marginBottom: '10px',
                    padding: '16px',
                  }}
                  bodyStyle={{ padding: 0 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontWeight: 500,
                        }}
                      >
                        {/* <CalendarOutlined />
                        <span>{item.type}</span> */}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          color: `#${item.color ?? '9ca3af'}`,
                        }}
                      >
                        {getLeaveIcon(item.type)} {'  '}
                        {item.type}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          color: '#6b7280',
                          fontSize: '14px',
                        }}
                      >
                        {formatDate(item?.startDate)} -{' '}
                        {formatDate(item?.endDate)} ({item?.workingDays}{' '}
                        {item?.workingDays === 1 ? 'day' : 'days'})
                      </p>
                      {item.leaveRequestNote && (
                        <p
                          style={{
                            margin: 0,
                            color: '#9ca3af',
                            fontSize: '13px',
                            fontStyle: 'italic',
                          }}
                        >
                          Reason: {item.leaveRequestNote}
                        </p>
                      )}
                      <p style={{ textAlign: 'left', marginTop: '8px' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '14px',
                            color:
                              item.status === 'approved'
                                ? '#22c55e' // green
                                : item.status === 'pending'
                                  ? '#eab308' // yellow
                                  : '#ef4444', // red
                          }}
                        >
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)}{' '}
                          {/* Capitalize first letter */}
                          {item.managerComment && (
                            <>
                              {' '}
                              |{' '}
                              <span style={{ color: '#6b7280' }}>
                                {item.managerComment}
                              </span>
                            </>
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
            locale={{
              emptyText: (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#999',
                    margin: '20px 0',
                    fontWeight: 'bold',
                  }}
                >
                  No Planned Leaves
                </div>
              ),
            }}
          />
        )}
      </Drawer>
      <UserModal
        selectedUser={userProfile}
        update={() => setUserProfile(null)}
      />
    </>
  );
};

export default UserDrawer;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

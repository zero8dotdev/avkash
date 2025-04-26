'use client';

import React, { useState, useCallback } from 'react';
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
import { getLeaves } from '../../users/_actions';
import { insertLeave } from '../_actions';
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
  const [visible, setVisible] = useState(false);
  const {
    state: { orgId, userId, teamId, role },
  } = useApplicationContext();

  const leaveRequestsFetcher = (userId: string) => getLeaves(userId);

  const { data: leaveRequestData, isLoading: isLeaveRequestLoading } = useSWR(
    selectedUser?.userId
      ? [`leave-requests-${selectedUser.userId}`, selectedUser.userId]
      : null,
    ([_, userId]) => leaveRequestsFetcher(userId)
  );

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
                  disabledDate={(current) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (current && current.toDate() < today) {
                      return true;
                    }
                    return false;
                  }}
                />
              </Form.Item>

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
            renderItem={(item: any, i) => (
              <Card
                styles={{ body: { padding: '0 20px 0 20px' } }}
                style={{
                  marginBottom: '10px',
                  borderLeft: `5px solid #${item.color}`,
                }}
              >
                <List.Item
                  extra={
                    <span
                      style={{
                        color:
                          item.status === 'approved' ? '#339900' : '#ffcc00',
                        width: '100px',
                        textAlign: 'right',
                      }}
                    >
                      {item.status}
                    </span>
                  }
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <CalendarOutlined /> {item.type}
                      </Space>
                    }
                    description={
                      <p>
                        {item.startDate} - {item.endDate}
                      </p>
                    }
                  />
                  <Card
                    bordered={false}
                    styles={{ body: { padding: '10px' } }}
                    style={{
                      boxShadow: 'none',
                      borderLeft: `2px solid ${item.color}`,
                      borderRadius: '0px',
                    }}
                  >
                    {item.leaveRequestNote}
                  </Card>
                </List.Item>
              </Card>
            )}
            locale={{
              emptyText: (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#999',
                    margin: '20px 0',
                  }}
                >
                  No leave requests available.
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

"use client";
import React, { useState } from "react";
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Drawer,
  Flex,
  Form,
  Input,
  List,
  Radio,
  Space,
  Typography,
  message,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import { CalendarOutlined, CloseOutlined } from "@ant-design/icons";
import UserModal from "../../users/_components/user-modal";
import { useApplicationContext } from "@/app/_context/appContext";
import useSWR from "swr";
import { getLeaves } from "../../users/_actions";

const UserDrawer = ({
  selectedUser,
  onSelectUserChange,
  leaveTypes,
}: {
  selectedUser: any;
  onSelectUserChange: any;
  leaveTypes: any;
}) => {
  const [type, setType] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAddLeaveForm, setShowAddLeaveForm] = useState(false); // New state for form visibility
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

  const handleAddLeave = async (values: any) => {
    try {
      // Simulate API call to add leave
      message.success("Leave request submitted successfully!");
      setShowAddLeaveForm(false); // Close the form on success
    } catch (error) {
      console.error("Failed to submit leave:", error);
      message.error("Failed to submit leave request.");
    }
  };

  return (
    <>
      <Drawer
        open={selectedUser !== null}
        title={
          <Flex gap={12}>
            <Avatar size={34} src={selectedUser?.picture} />

            <Flex vertical>
              <Typography.Text strong style={{ margin: "0px", padding: "0px" }}>
                {selectedUser?.name}
              </Typography.Text>
              {role === "USER" && selectedUser?.userId !== userId ? null : (
                <a
                  style={{
                    fontSize: "12px",
                    textDecoration: "underline",
                    color: "#E85A4F",
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
        autoFocus={false}
        extra={
          <CloseOutlined
            onClick={() => {
              onSelectUserChange();
              setShowAddLeaveForm(false);
            }}
          />
        }
      >
        {((role === "MANAGER" && teamId === selectedUser?.teamId) || role === "OWNER" || selectedUser?.userId === userId) && !showAddLeaveForm && (
          <Button
            type="primary"
            onClick={() => setShowAddLeaveForm(true)}
            style={{ marginBottom: "20px" }}
          >
            Add leave
          </Button>
        )}

        {/* Add Leave Form */}
        {showAddLeaveForm && (
          <Card style={{ marginBottom: "20px" }}>
            <Form
              layout="vertical"
              onFinish={handleAddLeave}
              initialValues={{ type: leaveTypes[0]?.value }}
            >
              <Form.Item
                label="Leave Type"
                name="type"
                rules={[
                  { required: true, message: "Please select a leave type" },
                ]}
              >
                <Radio.Group>
                  {leaveTypes.map((type: any) => (
                    <Radio key={type.name} value={type.leaveTypeId}>
                      {type.name}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="Start Date"
                name="startDate"
                rules={[
                  { required: true, message: "Please select a start date" },
                ]}
              >
                <DatePicker />
              </Form.Item>
              <Form.Item
                label="End Date"
                name="endDate"
                rules={[
                  { required: true, message: "Please select an end date" },
                ]}
              >
                <DatePicker />
              </Form.Item>
              <Form.Item label="Leave Note" name="leaveRequestNote">
                <TextArea rows={4} placeholder="Enter leave details" />
              </Form.Item>
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
                styles={{ body: { padding: "0 20px 0 20px" } }}
                style={{
                  marginBottom: "10px",
                  borderLeft: `5px solid #${item.color}`,
                }}
              >
                <List.Item
                  extra={
                    <span
                      style={{
                        color: item.color,
                        width: "100px",
                        textAlign: "right",
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
                    styles={{ body: { padding: "10px" } }}
                    style={{
                      width: "75%",
                      boxShadow: "none",
                      borderLeft: `2px solid ${item.color}`,
                      borderRadius: "0px",
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
                    textAlign: "center",
                    color: "#999",
                    margin: "20px 0",
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

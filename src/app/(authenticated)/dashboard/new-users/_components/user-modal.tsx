"use client";
import { Modal, Tabs, Typography } from "antd";
import React from "react";
import LeaveReport from "./leave-report";
import Settings from "./settings";
import LeaveRequest from "./leave-request";
const UserModal = ({
  selectedUser,
  update,
}: {
  selectedUser: any;
  update: Function;
}) => {
  console.log(selectedUser)
  return (
    <Modal
      open={selectedUser !== null}
      title={
        <Typography.Title level={4}>{selectedUser?.name}</Typography.Title>
      }
      width={2000}
      style={{
        top: "65px",
      }}
      styles={{ body: { height: "80vh" } }}
      onCancel={() => update()}
      footer={null}
    >
      <Tabs
        items={[
          {
            key: "leave-report",
            label: "Leave Report",
            children: <LeaveReport user={selectedUser} />,
          },
          {
            key: "leave-requests",
            label: "leave Request",
            children: <LeaveRequest user={selectedUser}/>,
          },
          {
            key: "activity",
            label: "Activity",
            children: " <Activity user={user}/>",
          },
          {
            key: "overrides",
            label: "Overrides",
            children: " <Overrides user={user}/>",
          },
          {
            key: "settings",
            label: "Settings",
            children: <Settings user={selectedUser}/>,
          },
        ]}
      />
    </Modal>
  );
};

export default UserModal;

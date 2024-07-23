"use client";
import { fetchAllTeams, updateLeaveTypeBasedOnOrg } from "@/app/_actions";
import { Button, List, Modal, Typography } from "antd";
import React, { useEffect, useState } from "react";

interface LeaveType {
  name: string;
  isActive: boolean;
  color: string;
  leaveTypeId: string;
}

interface LeaveTypeDisableProps {
  item: LeaveType | undefined;
  onCancel: () => void;
  orgId: string;
}

const LeaveTypeDisable: React.FC<LeaveTypeDisableProps> = ({
  item,
  onCancel,
  orgId,
}) => {
  const [teams, setTeams] = useState<any>();

  const visible = !!item;


  const handleDisable = async () => {
    await updateLeaveTypeBasedOnOrg(false, orgId, item?.leaveTypeId);
    onCancel()
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchAllTeams(orgId);
      setTeams(data);
    };
    fetchData();
  }, [orgId]);

  return visible ? (
    <Modal
      width="38%"
      centered={true}
      open={true}
      title={`Are you sure you want to disable ${item.name} leave type?`}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="disable" type="primary" danger onClick={handleDisable}>
          Disable
        </Button>,
      ]}
    >
      <Typography.Paragraph>
        The foloowing teams will be affected if you disable {item.name} leave
        type. Are you sure?
      </Typography.Paragraph>
      <List
        style={{ marginTop: "12px" }}
        bordered
        itemLayout="horizontal"
        dataSource={teams}
        renderItem={(item: any, index) => {
          return (
            <List.Item>
              <List.Item.Meta
                title={
                  <Typography.Paragraph style={{ color: "#E71E9A" }}>
                    {item.name}
                  </Typography.Paragraph>
                }
              />
            </List.Item>
          );
        }}
      />
    </Modal>
  ) : (
    false
  );
};

export default LeaveTypeDisable;

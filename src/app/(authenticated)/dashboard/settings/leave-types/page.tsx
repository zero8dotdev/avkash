"use client";

import {
  Row,
  Col,
  Segmented,
  List,
  Avatar,
  Button,
  Popconfirm,
  PopconfirmProps,
} from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { useState, useEffect } from "react";
import LeaveTypeEdit from "./leaveEditType";
import { useApplicationContext } from "@/app/_context/appContext";
import { fetchleaveTypes, updateLeaveTypeBasedOnOrg } from "@/app/_actions";
import LeaveTypeDisable from "./leaveTypeDisable";

interface LeaveType {
  // define the leave type here as modeled in the backend
  name: string;
  isActive: boolean;
  color: string;
  leaveTypeId: string;
}

export default function Page() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>();

  const { state: appState } = useApplicationContext();
  const { orgId } = appState;

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchleaveTypes(orgId);
      setLeaveTypes(data);
    };
    fetchData();
  }, [orgId]);

  const [segmentValue, setSegmentValue] = useState<string | number>("active");
  const [activeItem, setActiveItem] = useState<undefined | LeaveType>(
    undefined
  );
  const [disableItem, setDisableItem] = useState<undefined | LeaveType>(
    undefined
  );
  const [inActive, setInActive] = useState<undefined | LeaveType>(undefined);
  const confirm: PopconfirmProps["onConfirm"] = async() => {
    await updateLeaveTypeBasedOnOrg(true, orgId, inActive?.leaveTypeId);
  };



  
  return (
    <Row gutter={8}>
      <Col span={24}>
        <Segmented
          value={segmentValue}
          onChange={setSegmentValue}
          options={[
            {
              label: "active",
              value: "active",
              icon: <CheckCircleTwoTone />,
            },
            {
              label: "inactive",
              value: "inactive",
              icon: <CloseCircleTwoTone />,
            },
          ]}
        />
        <List
          style={{ marginTop: "12px" }}
          bordered
          itemLayout="horizontal"
          dataSource={leaveTypes?.filter((leaveType: any) => {
            if (segmentValue === "active") return leaveType.isActive;
            else return !leaveType.isActive;
          })}
          renderItem={(item, index) => {
            
            return (
              <List.Item
                actions={[
                  item.isActive ? (
                    <>
                      <Button
                        type="link"
                        key="edit"
                        onClick={() => {
                          setActiveItem(item);
                        }}
                      >
                        Edit
                      </Button>
                      ,
                      <Button
                        type="link"
                        danger
                        key="disable"
                        onClick={() => {
                          setDisableItem(item);
                        }}
                      >
                        Disable
                      </Button>
                      ,
                    </>
                  ) : (
                    <Popconfirm
                      title="Delete the task"
                      description="Are you sure to delete this task?"
                      onConfirm={confirm}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button type="link" onClick={() => setInActive(item)}>
                        Enable
                      </Button>
                    </Popconfirm>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar style={{ backgroundColor: `#${item.color}` }} />
                  }
                  title={item.name}
                />
              </List.Item>
            );
          }}
        />

        <LeaveTypeEdit
          item={activeItem}
          onCancel={() => {
            setActiveItem(undefined);
          }}
        />
        <LeaveTypeDisable
          item={disableItem}
          orgId={orgId}
          onCancel={() => {
            setDisableItem(undefined);
          }}
        />
      </Col>
    </Row>
  );
}

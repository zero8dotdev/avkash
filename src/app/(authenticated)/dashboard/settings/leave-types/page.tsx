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
  Modal,
  Form,
  Input,
  ColorPicker,
  Checkbox,
  Select,
} from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { useState, useEffect } from "react";
import LeaveTypeEdit from "./leaveEditType";
import { useApplicationContext } from "@/app/_context/appContext";
import {
  fetchleaveTypes,
  insertNewLeaveType,
  updateLeaveTypeBasedOnOrg,
} from "@/app/_actions";
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
  const [isModalVisible, setModalVisible] = useState(false);

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
  const confirm: PopconfirmProps["onConfirm"] = async () => {
    await updateLeaveTypeBasedOnOrg(true, orgId, inActive?.leaveTypeId);
  };

  const [form] = Form.useForm();
  const onFinish = async (values: any) => {
    const newValues = { ...values, color: values.color.slice(1), orgId: orgId };

    const data = await insertNewLeaveType(newValues);
    if (data) {
      form.resetFields();
      setModalVisible(false);
    }
  };

  return (
    <Row gutter={24}>
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
      <Col>
        <Button
          onClick={() => setModalVisible(true)}
          type="primary"
          style={{ marginTop: "8px" }}
        >
          Add Leave Type
        </Button>
        <Modal
          open={isModalVisible}
          footer={[
            <Button key="cancel" onClick={() => setModalVisible(false)}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={() => form.submit()}>
              Save
            </Button>,
          ]}
          closable={false}
        >
          <Form onFinish={onFinish} form={form}>
            <Form.Item
              label="Leave Type name"
              name="name"
              rules={[
                { required: true, message: "Please Enter leave type  name" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Leave Color"
              name="color"
              rules={[
                { required: true, message: "Please select leave type color" },
              ]}
            >
              <ColorPicker
                onChange={(_, hex) => form.setFieldValue("color", hex)}
              />
            </Form.Item>
            <Form.Item
              label="Set Slack Status"
              name="setSlackStatus"
              initialValue={false}
            >
              <Checkbox />
            </Form.Item>
            <Form.Item
              label="Set Slack Status"
              name="statusMsg"
              initialValue="on Paid time of leave"
            >
              <Select>
                <Select.Option value="on Paid time of leave">
                  On Paid time off Leave
                </Select.Option>
                <Select.Option value="on Slack time of leave">
                  On Slack Leave
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Leave Type Emoji"
              name="emoji"
              initialValue="https://api.dicebear.com/7.x/miniavs/svg?seed=8"
            >
              <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=8" />
            </Form.Item>
          </Form>
        </Modal>
      </Col>
    </Row>
  );
}

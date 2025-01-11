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
  ColorPicker,
  Input,
  Card,
} from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { useState, useEffect } from "react";
import LeaveTypeEdit from "./leaveEditType";
import { useApplicationContext } from "@/app/_context/appContext";
import useSWR from "swr";
import LeaveTypeDisable from "./leaveTypeDisable";
import SideMenu from "../_components/menu";
import {
  fetchOrgleaveTypes,
  insertNewLeaveType,
  updateLeaveTypeBasedOnOrg,
} from "../_actions";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { init } from "emoji-mart";
import predefinedColors, { Emoji, LeaveTypes } from "../_utils";
init({ data });

export default function Page() {
  // const [leaveTypes, setLeaveTypes] = useState<LeaveTypes[]>();
  const [isModalVisible, setModalVisible] = useState(false);
  const [loader, setLoader] = useState<boolean>(false);
  const { state: appState } = useApplicationContext();
  const { orgId, userId } = appState;

  // Fetcher function for SWR
  const orgleaves = async (orgId: string) => {
    const org = orgId.split("*")[1];

    const data = await fetchOrgleaveTypes(org);

    if (error) {
      throw new Error("Failed to fetch organization data");
    }
    return data;
  };

  const {
    data: leaveTypes,
    error,
    mutate,
  } = useSWR(orgId ? `orgLeavetypes*${orgId}` : null, orgleaves);
  const [segmentValue, setSegmentValue] = useState<string | number>("active");
  const [activeItem, setActiveItem] = useState<undefined | LeaveTypes>(
    undefined
  );
  const [color, setColor] = useState<string>("");

  const [disableItem, setDisableItem] = useState<undefined | LeaveTypes>(
    undefined
  );
  const [inActive, setInActive] = useState<undefined | LeaveTypes>(undefined);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");

  const confirm: PopconfirmProps["onConfirm"] = async () => {
    // Disable the leave type based on the organization and the leave type ID
    await updateLeaveTypeBasedOnOrg(true, orgId, inActive?.leaveTypeId);

    // Update the SWR data to reflect the latest state
    mutate(); // This will trigger a re-fetch of the leave types
  };

  const [form] = Form.useForm();
  const onFinish = async (values: any) => {
    setLoader(true);
    try {
      const newValues = {
        ...values,
        color: values.color.slice(1),
        orgId: orgId,
        isActive: true,
        createdBy: userId,
      };

      console.log(newValues);
      const data = await insertNewLeaveType(newValues);
      if (data) {
        form.resetFields();
        setModalVisible(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      mutate();
      setLoader(false);
    }
  };

  const handleIconSelect = (data: Emoji) => {
    setSelectedEmoji(data.native);
    form.setFieldValue("emoji", data.native); // Update form value
    setEmojiPickerVisible(false); // Hide picker
  };

  return (
    <Row gutter={24} style={{ padding: "80px" }}>
      <Col span={3}>
        <SideMenu position="leave-types" />
      </Col>

      <Col span={16}>
        <Card title="Leave Types">
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
                      </>
                    ) : (
                      <Popconfirm
                        title="Enable Team"
                        description="Are you sure to enable this leave type?"
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
            update={mutate}
            orgId={orgId}
          />
          <LeaveTypeDisable
            item={disableItem}
            orgId={orgId}
            onCancel={() => {
              setDisableItem(undefined);
            }}
            update={mutate}
          />
        </Card>
        <Button
          onClick={() => setModalVisible(true)}
          type="primary"
          style={{ marginTop: "8px" }}
        >
          Add Leave Type
        </Button>
      </Col>

      <Modal
        open={isModalVisible}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            loading={loader}
            type="primary"
            onClick={() => form.submit()}
          >
            Save
          </Button>,
        ]}
        closable={false}
      >
        <Form onFinish={onFinish} form={form}>
          <Form.Item label="Leave Type name" name="name">
            <Input />
          </Form.Item>
          <Form.Item
            label="Leave Color"
            name="color"
            rules={[
              { required: true, message: "Please select leave type color" },
            ]}
          >
            <div
              onClick={() => setColorPickerVisible(!colorPickerVisible)}
              style={{
                backgroundColor: form.getFieldValue("color") || "#d9d9d9",
                width: "40px",
                height: "40px",
                borderRadius: "10%",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "2px solid transparent",
              }}
            >
              {!form.getFieldValue("color") && <span>Select</span>}
            </div>
          </Form.Item>

          <div>
            {colorPickerVisible && (
              <div
                style={{
                  marginTop: "10px",
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "10px",
                }}
              >
                {predefinedColors.map((color) => (
                  <div
                    key={color}
                    style={{
                      backgroundColor: color,
                      width: "40px",
                      height: "40px",
                      borderRadius: "10%",
                      cursor: "pointer",
                      border: "2px solid transparent",
                    }}
                    onClick={() => {
                      form.setFieldValue("color", color);
                      setColor(color); // Update the form value
                      setColorPickerVisible(false); // Hide picker
                    }}
                  >
                    {form.getFieldValue("color") === color && (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          boxShadow: `0 0 5px 2px ${color}`,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Form.Item label="Leave Type Emoji" name="emoji">
            <Avatar
              size={40}
              style={{ fontSize: "30px", backgroundColor: "transparent" }}
              icon={selectedEmoji || "😊"}
              onClick={() => setEmojiPickerVisible(!emojiPickerVisible)}
            />
          </Form.Item>
          {emojiPickerVisible && (
            <div style={{ position: "absolute", zIndex: 10 }}>
              <Button
                onClick={() => setEmojiPickerVisible(!emojiPickerVisible)}
              />
              <Picker data={data} onEmojiSelect={handleIconSelect} />
            </div>
          )}
        </Form>
      </Modal>
    </Row>
  );
}

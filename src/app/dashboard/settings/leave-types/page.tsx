"use client";

import { Row, Col, Modal, Segmented, List, Avatar, Button, Form, Input, ColorPicker, Checkbox } from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface LeaveType {
  // define the leave type here as modeled in the backend
  name: string;
  isActive: boolean;
}

const LeaveTypeEdit = ({
  item,
  onCancel = () => {},
}: {
  item: LeaveType | undefined;
  onCancel: Function;
}) => {
  const visible = !!item;
  return visible ? (
    <Modal open={true} title={`Edit ${item.name} Leave Type`} onCancel={() => onCancel()}>
      <Form>
        <Form.Item label="Leave Type name" >
          <Input value={item.name}/>
        </Form.Item>
        <Form.Item label="Leave Color" >
          <ColorPicker />
        </Form.Item>
        <Form.Item label="Leave Type Emoji">
        <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=8" />
        </Form.Item>
        <Form.Item label="Enabel in Temas">
            <Checkbox />
        </Form.Item>

      </Form>
    </Modal>
  ) : (
    false
  );
};

export default function Page() {
  const [teams, setTeams] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

  const fetchLeaveTypeData = async () => {
    try {
      const { data, error } = await supabase
        .from("LeaveType")
        .select("*")
        .eq("orgId", "01bf568b-12a3-4bae-966b-36409729ab10");
      if (data) {
        setLeaveTypes(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("Team")
        .select("*")
        .eq("orgId", "01bf568b-12a3-4bae-966b-36409729ab10");

      if (data) {
        setTeams(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLeaveTypeData();
  }, []);

  const [segmentValue, setSegmentValue] = useState<string | number>("active");
  const [activeItem, setActiveItem] = useState<undefined | LeaveType>(
    undefined
  );
  // leve types
  const data = [
    { name: "Paid Leave", isActive: true },
    { name: "Sick", isActive: true },
  ];

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
          dataSource={data.filter((leaveType) => {
            if (segmentValue === "active") return leaveType.isActive;
            else return !leaveType.isActive;
          })}
          renderItem={(item, index) => {
            return (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    key="edit"
                    onClick={() => {
                      setActiveItem(item);
                    }}
                  >
                    Edit
                  </Button>,
                  <Button type="link" danger key="disable">
                    Disable
                  </Button>,
                ]}
              >
                <List.Item.Meta avatar={<Avatar />} title={item.name} />
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
      </Col>
    </Row>
  );
}
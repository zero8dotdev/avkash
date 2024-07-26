"use client";
import { fetchleaveTypes } from "@/app/_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import policies from "@slack/web-api/dist/retry-policies";
import {
  Button,
  Card,
  Divider,
  Flex,
  Form,
  InputNumber,
  List,
  Space,
  Switch,
} from "antd";
import Text from "antd/es/typography/Text";
import React, { useEffect, useState } from "react";

interface policyProps {
  name: string;
  isActive: boolean;
  accurals: boolean;
  maxLeaves: number;
  autoApprove: boolean;
  rollover: boolean;
  color: string;
  unlimited: boolean;
}
interface props {
  item: policyProps;
}

const mainSectionHeading: React.CSSProperties = {
  fontWeight: "400",
};

const mainSectionHelp: React.CSSProperties = {
  color: "#ccc",
};

const LeavePolicy: React.FC<props & { index: number }> = ({ item, index }) => {
  const [form] = Form.useForm();
  const { name } = item;
  useEffect(() => {
    form.setFieldsValue(item);
  }, [form, item]);

  const onValuesChange = (changedValues: any, allValues: any) => {
   item={ ...item, ...changedValues };
   console.log(item)

    
  };
  return (
    <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
      <Card
        style={{ minWidth: "400px" }}
        title={
          <Space>
            <div
              style={{
                height: "15px",
                width: "15px",
                margin: "6px 6px 0px 0px",
                backgroundColor: "#34cfeb",
                borderRadius: "50%",
              }}
            />
            {name}
          </Space>
        }
      >
        <Flex justify="space-between">
          <Flex vertical>
            <Text style={mainSectionHeading}>Unlimited</Text>
            <Text style={mainSectionHelp}>Allow unlimited leave days</Text>
          </Flex>
          <Form.Item name="unlimited" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Flex>
        <Divider />
        <Form.Item noStyle></Form.Item>
        <Flex justify="space-between">
          <Form.Item noStyle dependencies={["maxLeaves"]}>
            {() => {
              return (
                <Text>{`Maximum ${
                  form.getFieldValue("maxLeaves")
                    ? form.getFieldValue("maxLeaves")
                    : ""
                } leave days in a year`}</Text>
              );
            }}
          </Form.Item>
          <Form.Item name="maxLeaves" >
            <InputNumber type="number" max={14} min={1}/>
          </Form.Item>
        </Flex>
        <Divider />
        <Flex justify="space-between">
          <Text>Accurals</Text>
          <Form.Item name="accurals" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Flex>
        <Divider />
        <Flex justify="space-between">
          <Text>Rollover</Text>
          <Form.Item name="rollover" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Flex>
        <Divider />
        <Flex justify="space-between">
          <Text>Auto Approve</Text>
          <Form.Item name="autoApprove" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Flex>
      </Card>
    </Form>
  );
};

const LeavePolicies = () => {
  const [leavePolicies, setLeavePolicies] = useState<any[]>([]);
  const { state: appState } = useApplicationContext();
  const { orgId } = appState;

  const fetchLeaveTypesData = async (orgId: string) => {
    const leaveTypes = fetchleaveTypes(orgId);
    const policies = (await leaveTypes).map((each) => {
      return {
        name: each.name,
        isActive: true,
        accurals: true,
        maxLeaves: 10,
        autoApprove: false,
        rollover: false,
        color: "#fff",
        unlimited: true,
      };
    });
    setLeavePolicies(policies)
  };

  useEffect(() => {
    fetchLeaveTypesData(orgId);
  }, [orgId]);
 
  const handleFormData = async () => {
    console.log(leavePolicies)
    
  };

  return (
    <Flex vertical style={{ overflow: 'auto',height:'500px'}}>
      <List
        dataSource={leavePolicies}
        grid={{
          gutter: 24,
        }}
        renderItem={(item, index) => (
          <List.Item>
            <LeavePolicy index={index} key={index} item={item} />
          </List.Item>
        )}
      />
      <Button
        onClick={handleFormData}
        style={{ alignSelf: "end" }}
        type="primary"
      >
        Save
      </Button>
    </Flex>
  );
};

export default LeavePolicies;

"use client";
import {
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
import React, { useEffect } from "react";

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
  leavePolicies:policyProps[],
  setLeavePolicies: (data: policyProps[]) => void;
}

const mainSectionHeading: React.CSSProperties = {
  fontWeight: "400",
};

const mainSectionHelp: React.CSSProperties = {
  color: "#ccc",
};

const LeavePolicy: React.FC<props & { index: number }> = ({
  item,
  leavePolicies,
  setLeavePolicies,
  index,
}) => {
  console.log(index)
  const [form] = Form.useForm();
  const { name } = item;
  useEffect(() => {
    form.setFieldsValue(item);
  }, [form, item]);

  const onValuesChange = (changedValues: any, allValues: any) => { const updatedPolicies = [...leavePolicies]; updatedPolicies[index] = { ...updatedPolicies[index], ...allValues }; setLeavePolicies(updatedPolicies); };
  return (
    <Form form={form} layout="vertical" onValuesChange={onValuesChange} >
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
      >dValues)
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
          <Form.Item name="maxLeaves" rules={[{ min: 1, max: 365 }]}>
            <InputNumber type="number" />
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

interface Props {
  leavePolicies: policyProps[];
  setLeavePolicies: (data: policyProps[]) => void;
}

const LeavePolicies: React.FC<Props> = ({
  leavePolicies,
  setLeavePolicies,
}) => {
  return (
    <List
      dataSource={leavePolicies}
      grid={{
        gutter: 24,
      }}
      renderItem={(item, index) => (
        <List.Item>
          <LeavePolicy
            index={index}
            key={index}
            item={item}
            leavePolicies={leavePolicies}
            setLeavePolicies={setLeavePolicies}
          />
        </List.Item>
      )}
    />
   
  );
};

export default LeavePolicies;

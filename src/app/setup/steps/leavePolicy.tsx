import {
  Card,
  Flex,
  Form,
  InputNumber,
  Select,
  Switch,
  List,
  Space,
  Divider,
} from "antd";
import Text from "antd/es/typography/Text";
import React, { useEffect } from "react";

const subSetting: React.CSSProperties = {
  background: "#ccc",
  padding: "5px",
  borderRadius: "5px",
};

const mainSectionHeading: React.CSSProperties = {
  fontWeight: "400",
};

const mainSectionHelp: React.CSSProperties = {
  color: "#ccc",
};

type LeavePolicyProps = {
   leavePoliciesData:{
  name: string;
  color: string;
  unlimited: boolean;
  maxLeaves: number;
  accurals: boolean;
  rollover: boolean;
  autoApprove: boolean;
  isActive: boolean;
  
  }[];
  setLeavePoliciesData:(data: {
    name: string;
    color: string;
    unlimited: boolean;
    maxLeaves: number;
    accurals: boolean;
    rollover: boolean;
    autoApprove: boolean;
    isActive: boolean;
  }[]) => void 
};

const LeavePolicy: React.FC<LeavePolicyProps &{ index: number }> = ({
  
  leavePoliciesData,
  setLeavePoliciesData,
  index
}) => {
  const [form] = Form.useForm();
  const {name,
    accurals,
    maxLeaves,
    rollover,
    autoApprove,
    isActive,
    unlimited,
    }=leavePoliciesData[0]

  useEffect(() => {
    form.setFieldsValue({
      name,
      accurals,
      maxLeaves,
      rollover,
      autoApprove,
      isActive,
      unlimited,
    });
  }, [
    form,
    name,
    accurals,
    maxLeaves,
    rollover,
    autoApprove,
    isActive,
    unlimited,
  ]);

  const onValuesChange = (changedFields: any, allFields: any) => {
    console.log(changedFields, allFields);
    const updatedLeavePoliciesData = [...leavePoliciesData];
    updatedLeavePoliciesData[index] = allFields;
    setLeavePoliciesData(updatedLeavePoliciesData);
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


const LeavePolicies: React.FC< LeavePolicyProps> = ({
  leavePoliciesData,
  setLeavePoliciesData,
}) => {
  return (
    <Flex vertical gap={12}>
      <List
        dataSource={leavePoliciesData}
        renderItem={(item, index) => (
          <LeavePolicy
            key={index}
            index={index}
            leavePoliciesData={leavePoliciesData}
            setLeavePoliciesData={setLeavePoliciesData}
          />
        )}
      />
    </Flex>
  );
};

export default LeavePolicies;
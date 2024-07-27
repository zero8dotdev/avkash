"use client";
import { fetchleaveTypes, updateLeavePolicies } from "@/app/_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Flex,
  Form,
  InputNumber,
  List,
  Segmented,
  Select,
  Space,
  Switch,
} from "antd";
import Text from "antd/es/typography/Text";
import React, { useEffect, useState } from "react";

interface policyProps {
  name: string;
  isActive: boolean;
  accruals: boolean;
  maxLeaves: number;
  autoApprove: boolean;
  rollOver: boolean;
  unlimited: boolean;
  accrualFrequency: null;
  accrueOn: null;
  rollOverLimit: null;
  rollOverExpiry: null;
}
interface props {
  leavePolicies: policyProps[];
  item: policyProps;
  setLeavePolicies: (data: policyProps[]) => void;
}

const mainSectionHeading: React.CSSProperties = {
  fontWeight: "400",
};

const mainSectionHelp: React.CSSProperties = {
  color: "#ccc",
};

const LeavePolicy: React.FC<props & { index: number }> = ({
  leavePolicies,
  setLeavePolicies,
  item,
  index,
}) => {
  const [form] = Form.useForm();
  const { name } = item;
  useEffect(() => {
    form.setFieldsValue(item);
  }, [form, item]);

  const onValuesChange = (changedValues: any, allValues: any) => {
    const updatedPolicies = [...leavePolicies];
    updatedPolicies[index] = { ...updatedPolicies[index], ...allValues };
    setLeavePolicies(updatedPolicies);
    console.log(changedValues);
  };

  return (
    <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
      <Card
        style={{ width: "480px" }}
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
            {form.getFieldValue("unlimited") ? (
              <Text style={mainSectionHelp}>unlimited leave days per year</Text>
            ) : (
              <Text style={mainSectionHelp}>Allow unlimited leave days</Text>
            )}
          </Flex>
          <Form.Item name="unlimited" valuePropName="checked" shouldUpdate>
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
          <Form.Item name="maxLeaves">
            <InputNumber type="number" max={14} min={1} />
          </Form.Item>
        </Flex>
        <Divider />
        <Flex justify="space-between">
          <Text>Accurals</Text>
          <Form.Item name="  accruals" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Flex>
        <Form.Item
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.accruals !== currentValues.accruals
          }
        >
          {({ getFieldValue }) => {
            return getFieldValue("  accruals") ? (
              <Flex justify="space-between">
                <Form.Item
                  name="accrualFrequency"
                  initialValue="Monthly"
                  label="Accrual Frequency"
                >
                  <Select>
                    <Select.Option value="Monthly">Monthly</Select.Option>
                    <Select.Option value="Quarterly">Quarterly</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="accrueOn"
                  initialValue="Beginning"
                  label="AccrueOn"
                >
                  <Segmented options={["Beginning", "End"]} />
                </Form.Item>
              </Flex>
            ) : null;
          }}
        </Form.Item>

        <Divider />
        <Flex justify="space-between">
          <Text>Rollover</Text>
          <Form.Item name="rollOver" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Flex>
        <Form.Item
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.rollOver !== currentValues.rollOver
          }
        >
          {({ getFieldValue }) => {
            return getFieldValue("rollOver") ? (
              <Flex justify="space-between" vertical>
                <Form.Item
                  name="rollOverLimit"
                  initialValue={1}
                  label="Limit roll over days each year to"
                  help="Instead of rollin gover all unused days, this allows you to set a maximum number of days."
                >
                  <InputNumber
                    type="number"
                    max={14}
                    min={1}
                    suffix={<span style={{ marginRight: "15px" }}>days</span>}
                    style={{ width: "30%" }}
                  />
                </Form.Item>

                <Form.Item
                  name="rollOverExpiry"
                  label="rollOverExpiry"
                  help="Instead of keeping  roll over days indefinitely, you  can set an expiration date here."
                >
                  <DatePicker format="DD/MM" style={{ width: "30%" }} />
                </Form.Item>
              </Flex>
            ) : null;
          }}
        </Form.Item>
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
        leaveTypeId: each.leaveTypeId,
        accrualFrequency: null,
        accrueOn: null,
        rollOverLimit: null,
        rollOverExpiry: null,
        name: each.name,
        isActive: true,
        accruals: false,
        maxLeaves: 10,
        autoApprove: false,
        rollOver: false,
        unlimited: false,
      };
    });
    setLeavePolicies(policies);
  };

  useEffect(() => {
    fetchLeaveTypesData(orgId);
  }, [orgId]);

  const updateOrInsertLeavePolicies = async (each: any) => {
    const newValues = {
      isActive: each.isActive,
      accruals: each.accurals,
      maxLeaves: each.maxLeaves,
      autoApprove: each.autoApprove,
      rollOver: each.rollOver,
      accrualFrequency: each.accrualFrequency,
      accrueOn:each.accrueOn,
      rollOverLimit: each.ollOverLimit,
      rollOverExpiry: each.rollOverExpiry,
      unlimited: each.unlimited,
    };
    return await updateLeavePolicies(newValues, each.leaveTypeId, orgId);
  };
  const handleFormData = async () => {
    await Promise.all(
      leavePolicies.map(async (each) => {
        return await updateOrInsertLeavePolicies(each);
      })
    );
  };

  return (
    <Flex
      vertical
      style={{ overflow: "scroll", height: "500px", width: "100%" }}
    >
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

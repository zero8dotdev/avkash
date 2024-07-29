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
const { Item: FormItem } = Form;
export interface ILeavePolicyProps {
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
export interface ILeavePolicyUpdate {
  update: (values: ILeavePolicyProps) => void;
}

const mainSectionHeading: React.CSSProperties = {
  fontWeight: "400",
};

const mainSectionHelp: React.CSSProperties = {
  color: "#ccc",
};

export const LeavePolicy: React.FC<ILeavePolicyProps & ILeavePolicyUpdate> = ({
  update,
  ...props
}) => {
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue(props);
  }, [form, props]);

  const onValuesChange = (changedValues: any, allValues: any) => {
    update({ ...props, ...changedValues });
  };

  return (
    <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
      <Card
        style={{ marginBottom: "16px" }}
        styles={{}}
        title={
          <Flex gap={8} justify="start" align="center">
            <div
              style={{
                height: "16px",
                width: "16px",
                backgroundColor: "#34cfeb",
                borderRadius: "50%",
              }}
            />
            {props.name}
          </Flex>
        }
        extra={[
          <Flex justify="center" align="center" key="enable-disable">
            <FormItem
              name="isActive"
              valuePropName="checked"
              style={{ margin: 0, padding: 0 }}
            >
              <Switch />
            </FormItem>
          </Flex>,
        ]}
      >
        {props.isActive ? (
          <>
            <Flex justify="space-between">
              <Flex vertical>
                <Text style={mainSectionHeading}>Unlimited leave days</Text>
                {form.getFieldValue("unlimited") ? (
                  <Text style={mainSectionHelp}>
                    Unlimited leave days per year.
                  </Text>
                ) : (
                  <Text style={mainSectionHelp}>
                    Allow unlimited leave days.
                  </Text>
                )}
              </Flex>
              <FormItem
                name="unlimited"
                valuePropName="checked"
                shouldUpdate
                style={{ margin: 0, padding: 0 }}
              >
                <Switch />
              </FormItem>
            </Flex>
            <Divider />
            <Flex justify="space-between">
              <FormItem noStyle dependencies={["maxLeaves"]}>
                {() => {
                  return (
                    <Text>{`Maximum ${
                      form.getFieldValue("maxLeaves")
                        ? form.getFieldValue("maxLeaves")
                        : ""
                    } leave days in a year`}</Text>
                  );
                }}
              </FormItem>
              <FormItem name="maxLeaves" style={{ margin: 0, padding: 0 }}>
                <InputNumber type="number" max={14} min={1} />
              </FormItem>
            </Flex>
            <Divider />
            <Flex justify="space-between">
              <Text>Accurals</Text>
              <FormItem name="accruals" valuePropName="checked">
                <Switch />
              </FormItem>
            </Flex>
            <FormItem
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.accruals !== currentValues.accruals
              }
            >
              {({ getFieldValue }) => {
                return getFieldValue("accruals") ? (
                  <Flex justify="space-between">
                    <FormItem
                      name="accrualFrequency"
                      initialValue="Monthly"
                      label="Accrual Frequency"
                    >
                      <Select>
                        <Select.Option value="Monthly">Monthly</Select.Option>
                        <Select.Option value="Quarterly">
                          Quarterly
                        </Select.Option>
                      </Select>
                    </FormItem>

                    <FormItem
                      name="accrueOn"
                      initialValue="Beginning"
                      label="AccrueOn"
                    >
                      <Segmented options={["Beginning", "End"]} />
                    </FormItem>
                  </Flex>
                ) : null;
              }}
            </FormItem>

            <Divider />
            <Flex justify="space-between">
              <Text>Rollover</Text>
              <FormItem name="rollOver" valuePropName="checked">
                <Switch />
              </FormItem>
            </Flex>
            <FormItem
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.rollOver !== currentValues.rollOver
              }
            >
              {({ getFieldValue }) => {
                return getFieldValue("rollOver") ? (
                  <Flex justify="space-between" vertical>
                    <FormItem
                      name="rollOverLimit"
                      initialValue={1}
                      label="Limit roll over days each year to"
                      help="Instead of rollin gover all unused days, this allows you to set a maximum number of days."
                    >
                      <InputNumber
                        type="number"
                        max={14}
                        min={1}
                        suffix={
                          <span style={{ marginRight: "15px" }}>days</span>
                        }
                        style={{ width: "30%" }}
                      />
                    </FormItem>

                    <FormItem
                      name="rollOverExpiry"
                      label="rollOverExpiry"
                      help="Instead of keeping  roll over days indefinitely, you  can set an expiration date here."
                    >
                      <DatePicker format="DD/MM" style={{ width: "30%" }} />
                    </FormItem>
                  </Flex>
                ) : null;
              }}
            </FormItem>
            <Divider />
            <Flex justify="space-between">
              <Text>Auto Approve</Text>
              <FormItem name="autoApprove" valuePropName="checked">
                <Switch />
              </FormItem>
            </Flex>
          </>
        ) : null}
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
      accrueOn: each.accrueOn,
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
          <List.Item key={index}>
            <LeavePolicy
              {...leavePolicies[index]}
              update={(values) => {
                let copy = { ...leavePolicies };
                copy[index] = { ...values };
                setLeavePolicies([...copy]);
              }}
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

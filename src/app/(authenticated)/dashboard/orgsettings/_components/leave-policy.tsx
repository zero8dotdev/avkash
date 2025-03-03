'use client';

import {
  Card,
  DatePicker,
  Divider,
  Flex,
  Form,
  InputNumber,
  Segmented,
  Select,
  Switch,
} from 'antd';
import Text from 'antd/es/typography/Text';
import React, { useEffect, useState } from 'react';

const { Item: FormItem } = Form;

export interface ILeavePolicyProps {
  name: string;
  isActive: boolean;
  accruals: boolean;
  maxLeaves: number;
  autoApprove: boolean;
  rollOver: boolean;
  unlimited: boolean;
  accrualFrequency: string;
  accrueOn: string;
  rollOverLimit: number;
  rollOverExpiry: null;
}

export interface ILeavePolicyUpdate {
  update: (values: ILeavePolicyProps) => void;
}

const mainSectionHeading: React.CSSProperties = {
  fontWeight: '400',
};

const mainSectionHelp: React.CSSProperties = {
  color: '#ccc',
};

export const LeavePolicy: React.FC<ILeavePolicyProps & ILeavePolicyUpdate> = ({
  update,
  ...props
}) => {
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue(props);
  }, [form, props]);

  const onValuesChange = (changedValues: any) => {
    update({ ...props, ...changedValues });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={onValuesChange}
      style={{ width: '100%' }}
    >
      <Card
        style={{
          marginBottom: '16px',
          border: '1px solid #ccc',
          width: '100%',
        }}
        title={
          <Flex gap={8} justify="start" align="center">
            <div
              style={{
                height: '16px',
                width: '16px',
                backgroundColor: '#34cfeb',
                borderRadius: '50%',
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
                {form.getFieldValue('unlimited') ? (
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
              <FormItem noStyle dependencies={['maxLeaves']}>
                {() => {
                  return (
                    <Text>{`Maximum ${
                      form.getFieldValue('maxLeaves')
                        ? form.getFieldValue('maxLeaves')
                        : ''
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
                return getFieldValue('accruals') ? (
                  <Flex justify="space-between">
                    <FormItem name="accrualFrequency" label="Accrual Frequency">
                      <Select>
                        <Select.Option value="MONTHLY">Monthly</Select.Option>
                        <Select.Option value="QUARTERLY">
                          Quarterly
                        </Select.Option>
                      </Select>
                    </FormItem>

                    <FormItem
                      name="accrueOn"
                      initialValue="Beginning"
                      label="AccrueOn"
                    >
                      <Segmented
                        style={{ color: 'red' }}
                        options={['BEGINNING', 'END']}
                      />
                    </FormItem>
                  </Flex>
                ) : null;
              }}
            </FormItem>

            <Divider />
            <Flex justify="space-between">
              <Text>Roll Over</Text>
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
                return getFieldValue('rollOver') ? (
                  <Flex justify="space-between" vertical>
                    <FormItem
                      name="rollOverLimit"
                      label="Limit roll over days each year to"
                      help="Instead of rollin gover all unused days, this allows you to set a maximum number of days."
                    >
                      <InputNumber
                        type="number"
                        max={14}
                        min={1}
                        suffix={
                          <span style={{ marginRight: '15px' }}>days</span>
                        }
                        style={{ width: '30%' }}
                      />
                    </FormItem>

                    <FormItem
                      name="rollOverExpiry"
                      label="Roll Over Expiry"
                      help="Instead of keeping  roll over days indefinitely, you  can set an expiration date here."
                    >
                      <DatePicker format="DD/MM" style={{ width: '30%' }} />
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

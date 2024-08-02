"use client";
import { Card, Checkbox, Flex, Form, Input, List, Select } from "antd";
import moment from "moment-timezone";
import { useEffect, useState } from "react";
const { Item: FormItem } = Form;
const { Option: SelectOption } = Select;
const { Group: CheckboxGroup } = Checkbox;

interface SettingProps {
  isTeamnameVisable:boolean
  startOfWorkWeek: string;
  workweek: string[];
  timeZone: string;
  name?:string | undefined
  update: (values: {
    startOfWorkWeek: string;
    workweek: string[];
    timeZone: string;
    name?:string |undefined
  }) => void;
}

const Setting: React.FC<SettingProps> = ({
  name,
  startOfWorkWeek,
  workweek,
  timeZone,
  update,
  isTeamnameVisable
}) => {
  const [timezones, setTimezones] = useState<any[]>([]);

  useEffect(() => {
    const allTimezones = moment.tz.names();
    setTimezones(allTimezones);
  }, []);

  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      name,
      startOfWorkWeek,
      workweek,
      timeZone,
    });
  }, [form, startOfWorkWeek, workweek, timeZone,name]);

  const onValuesChange = (changedFields: any, allFields: any) => {
    update({ name,startOfWorkWeek, workweek, timeZone, ...changedFields });
  };

  const formItemLayout = { labelCol: { span: 8 }, wrapperCol: { span: 16 } };

  return (
    <Form
      form={form}
      layout="horizontal"
      {...formItemLayout}
      onValuesChange={onValuesChange}
    >
      {isTeamnameVisable&&
      <Form.Item name="name" rules={[{ required: true, message: 'Please enter your team name' }]} label="Team Name">
           <Input placeholder="Enter your team name"/>
      </Form.Item>}
      <FormItem
        label="Start of work week"
        name="startOfWorkWeek"
        rules={[
          { required: true, message: "Please select start of work week." },
        ]}
      >
        <Select placeholder="Start of the work week">
          <SelectOption value="MONDAY">Monday</SelectOption>
          <SelectOption value="TUESDAY">Tuesday</SelectOption>
          <SelectOption value="WEDNESDAY">Wednesday</SelectOption>
          <SelectOption value="THURSDAY">Thursday</SelectOption>
          <SelectOption value="FRIDAY">Friday</SelectOption>
          <SelectOption value="SATURDAY">Saturday</SelectOption>
          <SelectOption value="SUNDAY">Sunday</SelectOption>
        </Select>
      </FormItem>
      <FormItem
        label="Work week"
        name="workweek"
        rules={[
          {
            required: true,
            message: "Please select atleast one working day",
          },
        ]}
      >
        <CheckboxGroup>
          <Checkbox value="MONDAY">Monday</Checkbox>
          <Checkbox value="TUESDAY">Tuesday</Checkbox>
          <Checkbox value="WEDNESDAY">Wednesday</Checkbox>
          <Checkbox value="THURSDAY">Thursday</Checkbox>
          <Checkbox value="FRIDAY">Friday</Checkbox>
          <Checkbox value="SATURDAY">Saturday</Checkbox>
          <Checkbox value="SUNDAY">Sunday</Checkbox>
        </CheckboxGroup>
      </FormItem>
      <FormItem
        label="Time Zone"
        name="timeZone"
        rules={[{ required: true, message: "Please select your timezone." }]}
      >
        <Select
          showSearch
          placeholder="Timezone"
          optionFilterProp="children"
          filterOption={(input, option) =>
            ((option?.label ?? "") as string)
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          filterSort={(optionA, optionB) =>
            ((optionA?.label ?? "") as string)
              .toLowerCase()
              .localeCompare(((optionB?.label ?? "") as string).toLowerCase())
          }
          options={timezones.map((timezone: string) => ({
            value: timezone,
            label: timezone,
          }))}
        />
      </FormItem>
    </Form>
  );
};

export default Setting;

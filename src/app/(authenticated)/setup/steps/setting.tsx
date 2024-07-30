"use client";
import { Card, Checkbox, Flex, Form, List, Select } from "antd";
import moment from "moment-timezone";
import { useEffect, useState } from "react";
const { Item: FormItem } = Form;
const { Option: SelectOption } = Select;
const { Group: CheckboxGroup } = Checkbox;

interface SettingProps {
  startOfWorkWeek: string;
  workweek: string[];
  timeZone: string;
  update: (values: {
    startOfWorkWeek: string;
    workweek: string[];
    timeZone: string;
  }) => void;
}

const Setting: React.FC<SettingProps> = ({
  startOfWorkWeek,
  workweek,
  timeZone,
  update,
}) => {
  const [timezones, setTimezones] = useState<any[]>([]);

  useEffect(() => {
    const allTimezones = moment.tz.names();
    setTimezones(allTimezones);
  }, []);

  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      startOfWorkWeek,
      workweek,
      timeZone,
    });
  }, [form, startOfWorkWeek, workweek, timeZone]);

  const onValuesChange = (changedFields: any, allFields: any) => {
    update({ startOfWorkWeek, workweek, timeZone, ...changedFields });
  };

  const formItemLayout = { labelCol: { span: 8 }, wrapperCol: { span: 16 } };

  return (
    <Form
      form={form}
      layout="horizontal"
      {...formItemLayout}
      onValuesChange={onValuesChange}
    >
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

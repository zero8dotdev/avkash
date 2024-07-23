"use client";
import { Card, Checkbox, Flex, Form, List, Select } from "antd";
import moment from "moment-timezone";
import { useEffect, useState } from "react";

interface SettingsProps {
  settingsData: {
    startOfWorkWeek: string;
    workweek: string[];
    timeZone: string;
  }[];
  setSettingsData: (data: {
    startOfWorkWeek: string;
    workweek: string[];
    timeZone: string;
  }[]) => void;
}

const Setting: React.FC<SettingsProps & { index: number }> = ({
  settingsData,
  setSettingsData,
  index,
}) => {
  const { startOfWorkWeek, workweek, timeZone } = settingsData[index];

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
    console.log(changedFields, allFields);
    const updatedSettingsData = [...settingsData];
    updatedSettingsData[index] = allFields;
    setSettingsData(updatedSettingsData);
  };

  return (
    <Card>
      <Form form={form} onValuesChange={onValuesChange}>
        <Form.Item
          label="Start of work week"
          name="startOfWorkWeek"
          rules={[
            { required: true, message: "Please select start of work week" },
          ]}
          initialValue={["MONDAY"]}
        >
          <Select className="ml-4 w-56" placeholder="Select start of work week">
            <Select.Option value="MONDAY">Monday</Select.Option>
            <Select.Option value="TUESDAY">Tuesday</Select.Option>
            <Select.Option value="WEDNESDAY">Wednesday</Select.Option>
            <Select.Option value="THURSDAY">Thursday</Select.Option>
            <Select.Option value="FRIDAY">Friday</Select.Option>
            <Select.Option value="SATURDAY">Saturday</Select.Option>
            <Select.Option value="SUNDAY">Sunday</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="Work week"
          name="workweek"
          rules={[
            {
              required: true,
              message: "Please select atleast one working day",
            },
          ]}
          initialValue={["MONDAY"]}
        >
          <Checkbox.Group>
            <Checkbox value="MONDAY">Monday</Checkbox>
            <Checkbox value="TUESDAY">Tuesday</Checkbox>
            <Checkbox value="WEDNESDAY">Wednesday</Checkbox>
            <Checkbox value="THURSDAY">Thursday</Checkbox>
            <Checkbox value="FRIDAY">Friday</Checkbox>
            <Checkbox value="SATURDAY">Saturday</Checkbox>
            <Checkbox value="SUNDAY">Sunday</Checkbox>
          </Checkbox.Group>
        </Form.Item>
        <Form.Item
          label="Time Zone"
          name="timeZone"
          rules={[{ required: true, message: "Please select your timezone" }]}
        >
          <Select
            style={{ width: "200px" }}
            className="ml-16"
            showSearch
            placeholder="Search to Select"
            optionFilterProp="children"
            filterOption={(input, option) =>
              ((option?.label ?? "") as string).includes(input)
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
        </Form.Item>
      </Form>
    </Card>
  );
};

const Settings: React.FC<SettingsProps> = ({ settingsData, setSettingsData }) => {
  return (
    <Flex vertical>
      <List
        dataSource={settingsData}
        renderItem={(item, index) => (
          <Setting
            key={index}
            settingsData={settingsData}
            setSettingsData={setSettingsData}
            index={index}
          />
        )}
        itemLayout="vertical"
        grid={{ gutter: 16 }}
      />
    </Flex>
  );
};

export default Settings;
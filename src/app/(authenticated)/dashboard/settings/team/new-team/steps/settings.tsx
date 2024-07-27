"use client";

import { Card, Checkbox, Form, Input, List, Select } from "antd";
import moment from "moment-timezone";
import { useEffect } from "react";

interface props {
  name:string
  startOfWorkWeek: string;
  workweek: string[];
  timeZone: string;
}

const timezones = moment.tz.names();

interface Props {
  item: props;
  setSettings: (
    data: {
      name:string,
      startOfWorkWeek: string;
      workweek: string[];
      timeZone: string;
    }[]
  ) => void;
}
const Setting: React.FC<Props> = ({ item, setSettings }) => {
  const { startOfWorkWeek, workweek, timeZone } = item;

  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue({
      startOfWorkWeek,
      workweek,
      timeZone,
    });
  }, [form, startOfWorkWeek, workweek, timeZone]);

  const onValuesChange = (value: any) => {
    setSettings([{ ...item,...value }]);
  };

  const days:string[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  return (
    <Card>
      <Form form={form} onValuesChange={onValuesChange}>
        <Form.Item name="name" label="Team Name">
          <Input placeholder="Team Name"/>
        </Form.Item>
        <Form.Item
          label="Start of work week"
          name="startOfWorkWeek"
          rules={[
            { required: true, message: "Please select start of work week" },
          ]}
        >
          <Select className="ml-4 w-56" placeholder="Select start of work week">
            {days.map((day, i) => (
              <Select.Option key={i} value={day}>
                {day}
              </Select.Option>

            ))}
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
        >
          <Checkbox.Group>
            {days.map((day, i) => (
              <Checkbox key={i} value={day}>
                {day}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>
        <Form.Item
          label="Time Zone"
          name="timeZone"
          rules={[{ required: true, message: "Please select your timezone" }]}
        >
          <Select>
            {timezones.map((each, i) => (
              <Select.Option key={i} value={each}>
                {each}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Card>
  );
};

interface settingPops {
  settings: props[];
  setSettings: (
    data: props[]
  ) => void;
}
const Settings: React.FC<settingPops> = ({ settings, setSettings }) => {
  return (

    <List
    grid={{gutter:24}}
      dataSource={settings}
      renderItem={(item, index) => (
        <Setting key={index} item={item} setSettings={setSettings} />
      )}
      itemLayout="vertical"

    />

  );
};

export default Settings;

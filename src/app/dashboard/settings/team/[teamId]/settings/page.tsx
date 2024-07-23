"use client";
import { Button, Card, Checkbox, Form, Input, Select } from "antd";
import moment from "moment-timezone";
import { useEffect, useState } from "react";

const TeamSettings = () => {
  const [timezones, setTimezones] = useState<any[]>([]);

  // we need to fetch team details from backend
  const team = {
    name: "team1",
    id: "603ca341-bb32-48bb-aed8-9e99d2b49153",
    startOfWorkWeek: "Monday",
    workWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    timeZone: "Asia/kolkata",
  };

  useEffect(() => {
    const allTimezones = moment.tz.names();
    setTimezones(allTimezones);
  }, []);

  const onFinish = async(values: any) => {
    console.log(values)
  };

  console.log(timezones);
  return (
    <Card
      className="justify-center flex flex-col shadow-xl "
      title="Name-Settings"
    >
      <Form
        onFinish={onFinish}
        initialValues={{
          name: team.name,
          startOfWorkWeek: team.startOfWorkWeek,
          workWeek: team.workWeek,
          timeZone:team.timeZone,
        }}
      >
        <Form.Item name="name" label="Team Name" initialValue={team.name}>
          <Input />
        </Form.Item>
        <Form.Item label="Start of work week" name="startOfWorkWeek">
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
        <Form.Item label="Work week" name="workWeek">
          <Checkbox.Group>
            <Checkbox className="ml-16" value="MONDAY">
              Monday
            </Checkbox>

            <Checkbox className="ml-16" value="TUESDAY">
              Tuesday
            </Checkbox>

            <Checkbox className="ml-16" value="WEDNESDAY">
              Wednesday
            </Checkbox>

            <Checkbox className="ml-16" value="THURSDAY">
              Thursday
            </Checkbox>

            <Checkbox className="ml-16" value="FRIDAY">
              Friday
            </Checkbox>

            <Checkbox className="ml-16" value="SATURDAY">
              Saturday
            </Checkbox>

            <Checkbox className="ml-16" value="SUNDAY">
              Sunday
            </Checkbox>
          </Checkbox.Group>
        </Form.Item>
        <Form.Item label="Time Zone" name="timeZone">
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
        <Form.Item>
          <Button htmlType="submit" type="primary" danger>
            Save
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
export default TeamSettings;

"use client";
import { Card, Checkbox, Form, Select } from "antd";

export const SettingPage = ({ timezones }: { timezones: any[] }) => {
  return (
    <Card className="justify-center flex flex-col shadow-xl ">
      <Form.Item
        label="Start of work week"
        name="startOfWorkWeek"
        rules={[
          { required: true, message: "Please select start of work week" },
        ]}
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
        name="workWeek"
        rules={[
          {
            required: true,
            message: "Please select atleast one working day",
          },
        ]}
      >
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
    </Card>
  );
};

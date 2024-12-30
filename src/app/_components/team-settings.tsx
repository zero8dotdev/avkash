"use client";
import { Card, Checkbox, Form, Select } from "antd";
import React, { useEffect, useState } from "react";
import moment from "moment-timezone";
const { Item: FormItem } = Form;
const { Option: SelectOption } = Select;
const { Group: CheckboxGroup } = Checkbox;

const weekDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const TeamSettings = ({ form }: { form: any }) => {
  const [timezones, setTimezones] = useState<any[]>([]);

  const [startOfWorkWeek, setStartOfWeek] = useState<string[]>([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ]);

  useEffect(() => {
    const allTimezones = moment.tz.names();
    setTimezones(allTimezones);
  }, []);
  const onChangeWorkWeek = (v: any) => {
    const data = v.sort(
      (a: any, b: any) => weekDays.indexOf(a) - weekDays.indexOf(b)
    );
    setStartOfWeek(data);
    form.setFieldValue("startOfWorkWeek", data[0]);
  };

  return (
    <>
      <FormItem
        label="Start of work week"
        name="startOfWorkWeek"
        rules={[
          {
            required: true,
            message: "Please select start of work week.",
          },
        ]}
      >
        <Select placeholder="Start of the work week">
          {startOfWorkWeek.map((day) => (
            <SelectOption key={day} value={day}>
              {day}
            </SelectOption>
          ))}
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
        initialValue={startOfWorkWeek}
      >
        <CheckboxGroup onChange={(v) => onChangeWorkWeek(v)}>
          {weekDays.map((day) => (
            <Checkbox key={day} value={day}>
              {day}
            </Checkbox>
          ))}
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
    </>
  );
};

export default TeamSettings;

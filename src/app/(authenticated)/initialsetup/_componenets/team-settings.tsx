'use client';

import { Card, Checkbox, Form, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import moment from 'moment-timezone';

const { Item: FormItem } = Form;
const { Option: SelectOption } = Select;
const { Group: CheckboxGroup } = Checkbox;

const weekDays = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const TeamSettings = ({ form, data }: { form: any; data?: any }) => {
  const [timezones, setTimezones] = useState<string[]>([]);

  useEffect(() => {
    const allTimezones = moment.tz.names();
    setTimezones(allTimezones);

    if (data) {
      form.setFieldsValue({
        startOfWorkWeek: data.startOfWorkWeek,
        workweek: data.workweek,
        timeZone: data.timeZone,
      });
    }
  }, [data, form]);

  const onChangeWorkWeek = (values: string[]) => {
    const sortedDays = values.sort(
      (a, b) => weekDays.indexOf(a) - weekDays.indexOf(b)
    );
    form.setFieldValue('startOfWorkWeek', sortedDays[0]);
  };

  return (
    <>
      <FormItem
        label="Start of Work Week"
        name="startOfWorkWeek"
        rules={[{ required: true, message: 'Please select a start day.' }]}
      >
        <Select>
          {weekDays.map((day) => (
            <SelectOption key={day} value={day}>
              {day}
            </SelectOption>
          ))}
        </Select>
      </FormItem>
      <FormItem
        label="Work Week"
        name="workweek"
        rules={[{ required: true, message: 'Please select work days.' }]}
      >
        <CheckboxGroup onChange={onChangeWorkWeek}>
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
        rules={[{ required: true, message: 'Please select a time zone.' }]}
      >
        <Select
          showSearch
          placeholder="Timezone"
          options={timezones.map((timezone) => ({
            value: timezone,
            label: timezone,
          }))}
        />
      </FormItem>
    </>
  );
};

export default TeamSettings;

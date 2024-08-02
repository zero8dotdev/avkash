"use client"
import { updataOrgData } from "@/app/_actions";
import { Form, Select, Switch, Button } from "antd";
import { useApplicationContext } from "@/app/_context/appContext";
import { useState } from "react";

const { Item: FormItem } = Form;
const { Option: SelectOption } = Select;

const General: React.FC = () => {
  const [loader,setLoader]=useState<boolean>(false)
  const { state: appState } = useApplicationContext();
  const { orgId } = appState;

  const onFinish = async (values: any) => {
    setLoader(true)
    const data = await updataOrgData(values, orgId);
    setLoader(false)

  };

  return (
    <Form
      initialValues={{
        whoCanSee: "SELF",
        dateFormat: "MM/DD/YYYY",
        timeFormat: "hh:mm:ss A",
        halfDay: false,
      }}
      onFinish={onFinish}
      layout="horizontal"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      disabled={loader}
    >
      <FormItem name="dateformat" label="Date Format" initialValue="MM/DD/YYYY">
        <Select placeholder="Select a date format">
          <SelectOption value="MM/DD/YYYY">MM/DD/YYYY</SelectOption>
          <SelectOption value="DD/MM/YYYY">DD/MM/YYYY</SelectOption>
          <SelectOption value="YYYY-MM-DD">YYYY-MM-DD</SelectOption>
        </Select>
      </FormItem>
      <FormItem name="timeformat" label="Time Format" initialValue="HH:mm:ss">
        <Select placeholder="Select a time format">
          <SelectOption value="hh:mm:ss A">12-hour (hh:mm:ss)</SelectOption>
          <SelectOption value="HH:mm:ss">24-hour (HH:mm:ss)</SelectOption>
        </Select>
      </FormItem>
      <FormItem
        name="visibility"
        label="Who can see other's leave?"
        initialValue="SELF"
      >
        <Select>
          <SelectOption value="ORG">
            Users can see the organization`s leave
          </SelectOption>
          <SelectOption value="TEAM">
            Users can see their team`s` leave
          </SelectOption>
          <SelectOption value="SELF">
            Users can can only see their own leave
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem name="halfDayLeave" label="Half days" initialValue={false}>
        <Switch />
      </FormItem>
      <FormItem wrapperCol={{ offset: 8, span: 16 }}>
        <Button htmlType="submit" type="primary" loading={loader}>
          Save
        </Button>
      </FormItem>
    </Form>
  );
};

export default General;

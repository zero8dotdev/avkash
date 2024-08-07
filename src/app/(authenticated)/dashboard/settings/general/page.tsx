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
        timeFormat: "hh:mm:ss A",
        halfDay: false,
      }}
      onFinish={onFinish}
      layout="horizontal"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      disabled={loader}
    >
      <FormItem name="dateformat" label="Date Format" initialValue="DD MMM YYYY">
        <Select placeholder="Select a date format">
          <SelectOption value="DD MMM YYYY">07 Aug 2024</SelectOption>
          <SelectOption value="MMMM D, YYYY">August 7, 2024</SelectOption>
        </Select>
      </FormItem>
      <FormItem name="timeformat" label="Time Format" initialValue="HH:mm">
        <Select placeholder="Select a time format">
          <SelectOption value="hh:mm">12-hour (hh:mm)</SelectOption>
          <SelectOption value="HH:mm">24-hour (HH:mm)</SelectOption>
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

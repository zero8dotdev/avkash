"use client";
import { updataOrgData } from "@/app/_actions";
import { Form, Select, Switch, Button, Card, Row, Col } from "antd";
import { useApplicationContext } from "@/app/_context/appContext";
import { useState } from "react";
import SideMenu from "../_components/menu";

const { Item: FormItem } = Form;
const { Option: SelectOption } = Select;

const General: React.FC = () => {
  const [loader, setLoader] = useState<boolean>(false);
  const { state: appState } = useApplicationContext();
  const { orgId } = appState;

  const onFinish = async (values: any) => {
    setLoader(true);
    const data = await updataOrgData(values, orgId);
    setLoader(false);
  };

  return (
    <Row style={{ padding: "80px" }}>
      <Col span={3}>
        <SideMenu position="general" />
      </Col>
      <Col span={16}>
        <Card>
          <Form
            initialValues={{
              whoCanSee: "SELF",
              timeFormat: "hh:mm:ss A",
              halfDay: false,
            }}
            onFinish={onFinish}
            layout="vertical"
            disabled={loader}
          >
            <FormItem
              name="dateformat"
              label="Date Format"
              initialValue="DD MMM YYYY"
            >
              <Select placeholder="Select a date format">
                <Select.Option value="yyyy-mm-dd">yyyy-mm-dd</Select.Option>
                <Select.Option value="dd/mm/yyyy">dd/mm/yyyy</Select.Option>
                <Select.Option value="mm/dd/yyyy">mm/dd/yyyy</Select.Option>
              </Select>
            </FormItem>
            <FormItem
              name="timeformat"
              label="Time Format"
              initialValue="HH:mm"
            >
              <Select placeholder="Select a time format">
                <Select.Option value="12-hour">
                  12-hour format (hh:mm)
                </Select.Option>
                <Select.Option value="24-hour">
                  24-hour format (HH:mm)
                </Select.Option>
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
            <FormItem
              name="halfDayLeave"
              label="Half days"
              initialValue={false}
            >
              <Switch />
            </FormItem>
            <FormItem wrapperCol={{ span: 24, offset: 22 }}>
              <Button htmlType="submit" type="primary" loading={loader}>
                Save
              </Button>
            </FormItem>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default General;

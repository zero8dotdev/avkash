"use client";

import useSWR from "swr";
import { useState } from "react";
import { Form, Select, Switch, Button, Card, Row, Col } from "antd";
import SideMenu from "../_components/menu";
import { fetchOrgGeneralData, updataOrgGeneralData } from "../_actions";
import { useApplicationContext } from "@/app/_context/appContext";

const { Item: FormItem } = Form;
const { Option: SelectOption } = Select;

const General: React.FC<{}> = () => {
  const [loader, setLoader] = useState<boolean>(false);
  const [form] = Form.useForm();
  const { state: appState } = useApplicationContext();
  const { orgId } = appState;
  // Use SWR to fetch organization data
  // Fetcher function for SWR
  const fetcher = async (orgId: string) => {
    const org = orgId.split("*")[1];
    const data = await fetchOrgGeneralData(org);

    // if (error) {
    //   throw new Error("Failed to fetch organization data");
    // }
    return data;
  };

  const {
    data: orgData,
    error,
    mutate,
  } = useSWR(`orgGeneral*${orgId}`, fetcher);

  const onFinish = async (values: any) => {
    setLoader(true);
    try {
      // Use the server action to update the data
      const updatedData = await updataOrgGeneralData(values, orgId);
      // Optimistically update SWR cache
      mutate({ ...orgData, ...updatedData }, false);
    } catch (err) {
      console.error("Failed to update data:", err);
    } finally {
      setLoader(false);
    }
  };

  return (
    <Row style={{ padding: "80px", overflow: "hidden" }}>
      <Col span={3}>
        <SideMenu position="general" />
      </Col>
      <Col span={16}>
        <Card title="General Settings">
          {error ? (
            <div style={{ color: "red" }}>Error loading organization data.</div>
          ) : !orgData ? (
            <div>Loading...</div>
          ) : (
            <Form
              form={form}
              initialValues={{
                visibility: orgData?.visibility,
                timeformat: orgData?.timeformat,
                halfDayLeave: orgData?.halfDayLeave,
                dateformat: orgData?.dateformat,
              }}
              onFinish={onFinish}
              layout="vertical"
              disabled={loader}
            >
              <FormItem name="dateformat" label="Date Format">
                <Select placeholder="Select a date format">
                  <Select.Option value="yyyy-mm-dd">yyyy-mm-dd</Select.Option>
                  <Select.Option value="dd/mm/yyyy">dd/mm/yyyy</Select.Option>
                  <Select.Option value="mm/dd/yyyy">mm/dd/yyyy</Select.Option>
                  <Select.Option value="dd.mm.yyyy">dd.mm.yyyy</Select.Option>
                  <Select.Option value="mm.dd.yyyy">mm.dd.yyyy</Select.Option>
                  <Select.Option value="dd-MMM-yyyy">dd-MMM-yyyy</Select.Option>
                  <Select.Option value="MMM-dd-yyyy">MMM-dd-yyyy</Select.Option>
                </Select>
              </FormItem>
              <FormItem name="timeformat" label="Time Format">
                <Select placeholder="Select a time format">
                  <Select.Option value="12-hour">
                    12-hour format (hh:mm)
                  </Select.Option>
                  <Select.Option value="24-hour">
                    24-hour format (HH:mm)
                  </Select.Option>
                </Select>
              </FormItem>
              <FormItem name="visibility" label="Who can see other's leave?">
                <Select>
                  <SelectOption value="ORG">
                    Users can see the organization`&apos`s leave
                  </SelectOption>
                  <SelectOption value="TEAM">
                    Users can see their team`&apos`s leave
                  </SelectOption>
                  <SelectOption value="SELF">
                    Users can only see their own leave
                  </SelectOption>
                </Select>
              </FormItem>
              <FormItem name="halfDayLeave" label="Half days">
                <Switch />
              </FormItem>
              <FormItem wrapperCol={{ span: 24, offset: 22 }}>
                <Button htmlType="submit" type="primary" loading={loader}>
                  Save
                </Button>
              </FormItem>
            </Form>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default General;

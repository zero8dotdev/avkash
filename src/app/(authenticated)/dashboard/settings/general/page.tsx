import { updataOrgData } from "@/app/_actions";
import { Form, Select, Switch, Button } from "antd";
import { useApplicationContext } from "@/app/_context/appContext";

const General = () => {
  const { state: appState } = useApplicationContext();
  const { orgId } = appState;

  const onFinish = async (values: any) => {
    const data = await updataOrgData(values, orgId);
    console.log(data);
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
    >
      <Form.Item
        name="dateformat"
        label="Date Format"
        initialValue="MM/DD/YYYY"
      >
        <Select placeholder="Select a date format">
          <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
          <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
          <Select.Option value="YYYY-MM-DD">YYYY-MM-DD</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="timeformat" label="Time Format" initialValue="HH:mm:ss">
        <Select placeholder="Select a time format">
          <Select.Option value="hh:mm:ss A">12-hour (hh:mm:ss)</Select.Option>
          <Select.Option value="HH:mm:ss">24-hour (HH:mm:ss)</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="visibility"
        label="Who can see other's leave?"
        initialValue="SELF"
      >
        <Select>
          <Select.Option value="ORG">
            Users can see the organization`s leave
          </Select.Option>
          <Select.Option value="TEAM">
            Users can see their team`s` leave
          </Select.Option>
          <Select.Option value="SELF">
            Users can can only see their own leave
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="halfDayLeave" label="Half days" initialValue={false}>
        <Switch />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button htmlType="submit" type="primary">
          Save
        </Button>
      </Form.Item>
    </Form>
  );
};

export default General;

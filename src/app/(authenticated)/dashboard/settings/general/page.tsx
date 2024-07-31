import { updataOrgData } from "@/app/_actions";
import { Form, Select, Switch, Button } from "antd";
import { useApplicationContext } from "@/app/_context/appContext";

const { Item: FormItem } = Form;
const { Option: SelectOption } = Select;

const General: React.FC = () => {
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
        <Button htmlType="submit" type="primary">
          Save
        </Button>
      </FormItem>
    </Form>
  );
};

export default General;

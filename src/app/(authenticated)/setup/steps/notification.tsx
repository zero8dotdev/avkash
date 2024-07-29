import { Card, Checkbox, Flex, Form, Switch } from "antd";
import { useEffect } from "react";

const { Item } = Form;
const { Group } = Checkbox;
interface NotificationProps {
  leaveChange: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
  sendNtf: string[];
  update: (values: {
    leaveChange: boolean;
    dailySummary: boolean;
    weeklySummary: boolean;
    sendNtf: string[];
  }) => void;
}

const Notifications: React.FC<NotificationProps> = ({
  leaveChange,
  dailySummary,
  weeklySummary,
  sendNtf,
  update,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      leaveChange,
      dailySummary,
      weeklySummary,
      sendNtf,
    });
  }, [form, leaveChange, dailySummary, weeklySummary, sendNtf]);
  const onValuesChange = (changedFields: any) => {
    update({
      leaveChange,
      dailySummary,
      weeklySummary,
      sendNtf,
      ...changedFields,
    });
  };

  const formItemLayout = { labelCol: { span: 8 }, wrapperCol: { span: 16 } };

  return (
    <Form
      form={form}
      layout="horizontal"
      {...formItemLayout}
      onValuesChange={onValuesChange}
    >
      <Item
        label="Leave Changed"
        name="leaveChanged"
        valuePropName="checked"
        help="Send a notification
          whenever leave is approved or deleted."
      >
        <Switch />
      </Item>
      <Item
        label="Daily Summary"
        name="dailySummary"
        valuePropName="checked"
        help="Send a report of upcoming work days leave"
      >
        <Switch />
      </Item>
      <Item
        label="Weekly Summary"
        name="weeklySummary"
        valuePropName="checked"
        help="Send a report of
          upcoming weeks leave"
      >
        <Switch />
      </Item>
      <Item label="Send notications to" name="sendNtf">
        <Group>
          <Checkbox value="OWNER" defaultChecked>
            Owner
          </Checkbox>
          <Checkbox value="MANAGER">Managers</Checkbox>
        </Group>
      </Item>
    </Form>
  );
};
export default Notifications;

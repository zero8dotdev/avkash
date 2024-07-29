import { Card, Checkbox,Flex, Form, Switch } from "antd";
import { useEffect } from "react";

const {Item}=Form
const {Group}=Checkbox
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

  return (
    <Flex vertical gap={12}>
      <Card className="shadow-xl">
        <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
          <Item
            label="Leave Changed"
            name="leaveChanged"
            valuePropName="checked"
            help="Send a notification
          whenever leave is approved or deleted"
          >
            <Switch className="ml-12 bg-purple-500 mr-3" />
          </Item>
          <Item
            label="Daily Summary"
            name="dailySummary"
            valuePropName="checked"
            help="Send a report of upcoming work days leave"
          >
            <Switch className="ml-12 bg-purple-500 mr-3" />
          </Item>
          <Item
            label="Weekly Summary"
            name="weeklySummary"
            valuePropName="checked"
            help="Send a report of
          upcoming weeks leave"
          >
            <Switch className="ml-8 bg-purple-500 mr-3" />
          </Item>
          <Item label="Send notications to" name="sendNtf">
            <Group className="ml-6">
              <Checkbox value="OWNER" defaultChecked>
                Owners
              </Checkbox>
              <Checkbox value="MANAGER">Managers</Checkbox>
            </Group>
          </Item>
        </Form>
      </Card>
    </Flex>
  );
};
export default Notifications;

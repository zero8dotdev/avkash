import { Card, Checkbox, Divider, Flex, Form, List, Switch } from "antd";
import { useEffect } from "react";

interface NotificationProps {
  notificationData: {
    leaveChange: boolean;
    dailySummary: boolean;
    weeklySummary: boolean;
    sendNtf: string[];
  }[];
 setNotificationData:(data: {
    leaveChange: boolean;
    dailySummary: boolean;
    weeklySummary: boolean;
    sendNtf: string[];
  }[]) => void 
}

const Notification: React.FC<NotificationProps & { index: number }> = ({
  notificationData,
  setNotificationData,
  index,
}) => {
  const [form] = Form.useForm();
  const { leaveChange, dailySummary, weeklySummary, sendNtf } =
    notificationData[0];

  useEffect(() => {
    form.setFieldsValue({
      leaveChange,
      dailySummary,
      weeklySummary,
      sendNtf,
    });
  }, [form, leaveChange, dailySummary, weeklySummary, sendNtf]);

  const onValuesChange = (changedFields: any, allFields: any) => {
    console.log(changedFields, allFields);
    const updatedNotificationData = [...notificationData];
    updatedNotificationData[index] = allFields;
    setNotificationData(updatedNotificationData);
  };

  return (
    <Card className="shadow-xl">
      <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
        <Form.Item
          label="Leave Changed"
          name="leaveChanged"
          valuePropName="checked"
          help="Send a notification
          whenever leave is approved or deleted"
        >
          <Switch className="ml-12 bg-purple-500 mr-3" />
        </Form.Item>
        <Form.Item
          label="Daily Summary"
          name="dailySummary"
          valuePropName="checked"
          help="Send a report of upcoming work days leave"
        >
          <Switch className="ml-12 bg-purple-500 mr-3" />
        </Form.Item>
        <Form.Item
          label="Weekly Summary"
          name="weeklySummary"
          valuePropName="checked"
          help="Send a report of
          upcoming weeks leave"
        >
          <Switch className="ml-8 bg-purple-500 mr-3" />
        </Form.Item>
        <Form.Item label="Send notications to" name="sendNtf">
          <Checkbox.Group className="ml-6">
            <Checkbox value="OWNER" defaultChecked>
              Owners
            </Checkbox>
            <Checkbox value="MANAGER">Managers</Checkbox>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Card>
  );
};

const Notifications: React.FC<NotificationProps> = ({
  notificationData,
  setNotificationData,
}) => {
  return (
    <Flex vertical gap={12}>
      <List
        dataSource={notificationData}
        renderItem={(item, index) => (
          <Notification
            key={index}
            notificationData={notificationData}
            setNotificationData={setNotificationData}
            index={index}
          />
        )}
      />
    </Flex>
  );
};
export default Notifications;
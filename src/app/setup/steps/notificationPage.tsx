import { Card, Checkbox, Divider, Form, Switch } from "antd";


const NotificationPage = () => {
    return (
      <Card className="shadow-xl">
        <h1>company name</h1>
        <Divider />

        <Form.Item
          label="Leave Changed"
          name="leaveChanged"
          valuePropName="checked"
          help="Send a notification
          whenever leave is approved or deleted"
          initialValue={false}
        >
          <Switch className="ml-12 bg-purple-500 mr-3" />
        </Form.Item>
        <Form.Item
          label="Daily Summary"
          name="dailySummary"
          valuePropName="checked"
          help="Send a report of upcoming work days leave"
          initialValue={false}
        >
          <Switch className="ml-12 bg-purple-500 mr-3" />
        </Form.Item>
        <Form.Item
          label="Weekly Summary"
          name="weeklySummary"
          valuePropName="checked"
          initialValue={false}
          help="Send a report of
          upcoming weeks leave"
        >
          <Switch className="ml-8 bg-purple-500 mr-3" />
        </Form.Item>
        <Form.Item
          label="Send notications to"
          name="sendNtf"
          initialValue={["Owners"]}
        >
          <Checkbox.Group className="ml-6">
            <Checkbox value="OWNER" defaultChecked>
              Owners
            </Checkbox>
            <Checkbox value="MANAGER">Managers</Checkbox>
          </Checkbox.Group>
        </Form.Item>
      </Card>
    );
  };

  export default NotificationPage
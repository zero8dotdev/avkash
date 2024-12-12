"use client";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Flex,
  Form,
  Row,
  Steps,
  Switch,
  Typography,
} from "antd";
import { useEffect } from "react";
import {
  LeftOutlined,
  SmileOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import TopSteps from "../componenets/steps";
const { Item } = Form;
const { Group } = Checkbox;

const Notifications = () => {
  const [form] = Form.useForm();
  const router = useRouter();

  // onChange isRecuring
  const handlenext = () => {
    router.push(
      new URL("/initialsetup/invite-users", window?.location.origin).toString()
    );
  };

  const handlePrevious = () => {
    router.push(
      new URL("/initialsetup/locations", window?.location.origin).toString()
    );
  };
  return (
    <Row
      style={{
        padding: "50px 50px 180px 20px",
        height: "100%",
      }}
    >
      <TopSteps position={4} />

      <Col span={16} push={4}>
        <Card
          style={{
            margin: "25px 0px 25px 0px",
            minHeight: "300px",
            overflow: "auto",
          }}
        >
          <Form
            form={form}
            layout="vertical"
            size="small"
            style={{ marginTop: "25px", width: "70%" }}
          >
            <Flex justify="space-between">
              <Typography.Text>Leave Changed</Typography.Text>
              <Flex gap={15}>
                <Item
                  name="leaveChanged"

                  // help="Send a notification
                  //   whenever leave is approved or deleted."
                >
                  <Switch />
                </Item>
                <Typography.Text>
                  Send a notification whenever leave is approved or deleted.
                </Typography.Text>
              </Flex>
            </Flex>
            <Flex justify="space-between">
              <Typography.Text>Daily Summary</Typography.Text>
              <Flex gap={15}>
                <Item
                  name="dailySummary"
                  // help="Send a report of upcoming work days leave"
                >
                  <Switch />
                </Item>
                <Typography.Text style={{ marginRight: "95px" }}>
                  Send a report of upcoming work days leave
                </Typography.Text>
              </Flex>
            </Flex>
            <Flex justify="space-between">
              <Typography.Text>Weekly Summary</Typography.Text>
              <Flex gap={15}>
                <Item name="weeklySummary">
                  <Switch />
                </Item>
                <Typography.Text style={{ marginRight: "118px" }}>
                  Send a report of upcoming weeks leave
                </Typography.Text>
              </Flex>
            </Flex>

            <Item label="Send notications to" name="sendNtf">
              <Group>
                <Checkbox value="OWNER" defaultChecked>
                  Owner
                </Checkbox>
                <Checkbox value="MANAGER">Managers</Checkbox>
              </Group>
            </Item>
          </Form>
        </Card>
        <Flex justify="space-between">
          <Button danger icon={<LeftOutlined />} onClick={handlePrevious}>
            Previous
          </Button>
          <Button type="primary" onClick={handlenext}>
            Next
          </Button>
          {/* <Button type="primary">Done</Button> */}
        </Flex>
      </Col>
    </Row>
  );
};
export default Notifications;

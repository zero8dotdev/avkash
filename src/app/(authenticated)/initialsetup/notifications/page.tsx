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
import { updateInitialsetupState, updateTeamNotificationsSettings } from "../_actions";
import { useApplicationContext } from "@/app/_context/appContext";
const { Item } = Form;
const { Group } = Checkbox;

const Notifications = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const {
    state: { orgId, userId, teamId },
    dispatch,
  } = useApplicationContext();

  const handlenext = async () => {
    // Log form values
    const formValues = form.getFieldsValue();
    try {
      // Update team settings
      const data = await updateTeamNotificationsSettings(teamId, { ...formValues });
      if (!data) {
        // Handle failure to update team settings
        throw new Error("Failed to update team notification settings");
      }

      // Update initial setup state
      const status = await updateInitialsetupState(orgId, "5");
      if (status) {
        // // Navigate to the next page if update is successful
        router.push(
          new URL("/initialsetup/invite-users", window?.location.origin).toString()
        );
      } else {
        // Handle failure to update initial setup state
        throw new Error("Failed to update initial setup state");
      }
    } catch (error) {
      console.error(error);
    }

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
            name="notifications"
            layout="vertical"
            size="small"
            style={{ marginTop: "25px", width: "70%" }}
            initialValues={{
              leaveChanged: false,
              dailySummary: false,
              weeklySummary: false,
              sendntw: ["OWNER"], // Default selected notifications
            }}
          >
            <Flex justify="space-between">
              <Typography.Text>Leave Changed</Typography.Text>
              <Flex gap={15}>
                <Item name="leaveChanged" valuePropName="checked">
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
                <Item name="dailySummary" valuePropName="checked">
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
                <Item name="weeklySummary" valuePropName="checked">
                  <Switch />
                </Item>
                <Typography.Text style={{ marginRight: "118px" }}>
                  Send a report of upcoming weeks leave
                </Typography.Text>
              </Flex>
            </Flex>

            <Item label="Send notifications to" name="sendntw">
              <Group>
                <Checkbox value="OWNER">Owner</Checkbox>
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
        </Flex>
      </Col>
    </Row>
  );
};

export default Notifications;

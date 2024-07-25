import { Avatar, Card, Col, Flex, Row, Space, Tabs } from "antd";
import Title from "antd/es/typography/Title";
import { getUserDetails } from "../_actions";
import LeaveReport from "../_components/leave-report";
import LeaveRequests from "../_components/leave-requests";
import Activity from "../_components/activity";

export default async function Page({
  params: { userId },
}: {
  params: { userId: string };
}) {
  const user = await getUserDetails(userId);
  return (
    <Row gutter={8}>
      <Col span={12} push={6}>
        <Card
          title={
            <Flex gap={4} justify="start" align="center">
              <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" />
              <Title level={4} style={{ margin: 0, padding: 0 }}>
                {user.name}
              </Title>
            </Flex>
          }
        >
          <Tabs
            items={[
              {
                key: "leave-report",
                label: "Leave Report",
                children: <LeaveReport user={user} />,
              },
              {
                key: "leave-requests",
                label: "leave Request",
                children: <LeaveRequests user={user}/>,
              },
              { key: "activity", label: "Activity", children: <Activity user={user}/> },
            ]}
          ></Tabs>
        </Card>
      </Col>
    </Row>
  );
}

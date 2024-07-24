import { Avatar, Card, Col, Flex, Row, Space, Tabs } from "antd";
import Title from "antd/es/typography/Title";
import { getUserDetails } from "../_actions";
import LeaveReport from "../_components/leave-report";

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
                label: "Leave Requests",
                children: <></>,
              },
              { key: "activity", label: "Activity", children: <></> },
            ]}
          ></Tabs>
        </Card>
      </Col>
    </Row>
  );
}

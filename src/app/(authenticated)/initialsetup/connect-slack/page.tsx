/* eslint-disable @next/next/no-img-element */
"use client";

import {
  SmileOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Flex, Button, Row, Col, Steps, Card } from "antd";
import { useRouter } from "next/navigation";
import TopSteps from "../_componenets/steps";

export default function AddToSlack() {
  const router = useRouter();

  const redirectToNext = new URL(
    "/initialsetup/settings",
    window?.location.origin
  ).toString();

  const handlenext = () => {
    router.push(redirectToNext);
  };

  return (
    <Row
      style={{
        padding: "50px 50px 180px 20px",
        height: "100%",
      }}
    >
      <TopSteps position={0} />

      <Col span={16} push={4}>
        <Card
          style={{
            margin: "25px 0px 25px 0px",
            minHeight: "300px",
            overflow: "auto",
            display: "flex",
            justifyContent: "center", // Horizontal alignment
            alignItems: "center", // Vertical alignment
          }}
        >
          <a
            href={`https://slack.com/oauth/v2/authorize?client_id=6356258938273.7279987270326&scope=app_mentions:read,channels:history,channels:read,chat:write,chat:write.public,commands,groups:read,im:history,im:read,mpim:history,users:read,users:read.email&user_scope=channels:history,channels:read,groups:read,im:history,im:read,mpim:history,mpim:read&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URL}welcome/install-to-slack`}
          >
            <img
              alt="Add to Slack"
              height="40"
              width="139"
              src="https://platform.slack-edge.com/img/add_to_slack.png"
              srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
            />
          </a>
        </Card>
        <Flex justify="end">
          {/* <Button danger icon={<LeftOutlined />}>
            Previous
          </Button> */}
          <Button type="primary" onClick={handlenext}>
            Next
          </Button>
          {/* <Button type="primary">Done</Button> */}
        </Flex>
      </Col>
    </Row>
  );
}

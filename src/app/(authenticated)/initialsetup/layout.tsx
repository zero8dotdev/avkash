"use client";
import { LeftOutlined } from "@ant-design/icons";
import { Button, Card, Col, Flex, message, Row, Steps } from "antd";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [current, setCurrent] = useState(0);

  const steps = [
    {
      title: "Connect ot Slack",
    },
    {
      title: "Settings",
    },
    {
      title: "Leave Policy",
    },
    {
      title: "Locations",
    },
    {
      title: "Notifications",
    },
    {
      title: "Invite Users",
    },
  ];
  const router = useRouter();
  useEffect(() => {
    if (current == 0) {
      router.push("connect-slack");
    } else if (current === 1) {
      router.push("settings");
    } else if (current === 2) {
      router.push("leave-policy");
    } else if (current === 3) {
      router.push("locations");
    } else if (current === 4) {
      router.push("notifications");
    } else if (current === 5) {
      router.push("invite-users");
    }
  }, [current, router]);

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  return (
    <Row
      style={{
        padding: "50px 50px 180px 20px",
        height: "100%",
      }}
    >
      <Col span={16} push={4}>
        <Steps
          status="process"
          current={current}
          items={steps}
          type="navigation"
        />
      </Col>
      <Col span={16} push={4}>
        <Card
          style={{
            margin: "25px 0px 25px 0px",
            height: "500px",
            overflow: "auto",
          }}
        >
          {children}
        </Card>
        <Flex justify="space-between">
          {current < steps.length - 1 && (
            <Button type="primary" onClick={() => next()}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button
              type="primary"
              onClick={() => message.success("Processing complete!")}
            >
              Done
            </Button>
          )}
          {current > 0 && (
            <Button danger icon={<LeftOutlined />} onClick={() => prev()}>
              Previous
            </Button>
          )}
        </Flex>
      </Col>
    </Row>
  );
};

export default Layout;

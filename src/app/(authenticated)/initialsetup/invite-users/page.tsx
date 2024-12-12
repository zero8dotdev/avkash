"use client";
import { Button, Card, Col, Flex, Row } from "antd";
import React, { useRef } from "react";
import { Users } from "../../dashboard/settings/_components/users";
import {
  LeftOutlined,
  SmileOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import TopSteps from "../componenets/steps";

const Page = () => {
  const ref = useRef(null);
  const router = useRouter();

  const handlenext = () => {
    router.push(
      new URL("/initialsetup/invite-users", window?.location.origin).toString()
    );
  };

  const handlePrevious = () => {
    router.push(
      new URL("/initialsetup/notifications", window?.location.origin).toString()
    );
  };
  return (
    <Row
      style={{
        padding: "50px 50px 180px 20px",
        height: "100%",
      }}
    >
      <TopSteps position={5}/>
      <Col span={16} push={4}>
        <Card
          style={{
            margin: "25px 0px 25px 0px",
            minHeight: "300px",
            overflow: "auto",
          }}
        >
          <Card>
            <Users ref={ref} />
          </Card>
        </Card>
        <Flex justify="space-between">
          <Button danger icon={<LeftOutlined />} onClick={handlePrevious}>
            Previous
          </Button>
          <Button type="primary" onClick={handlenext}>
            Done
          </Button>
        </Flex>
      </Col>
    </Row>
  );
};

export default Page;

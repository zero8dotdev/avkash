"use client";
import { Button, Card, Col, Flex, Row } from "antd";
import React, { useRef } from "react";
import { LeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import TopSteps from "../_componenets/steps";
import { Users } from "../_componenets/users";
import {
  fetchLeavePolicies,
  insertLeavePolicies,
  insertUsers,
  updateInitialsetupState,
} from "../_actions";
import { useApplicationContext } from "@/app/_context/appContext";

interface UsersRef {
  getUsers: () => any[];
}

const Page = () => {
  const ref = useRef<UsersRef>(null);
  const router = useRouter();
  const {
    state: { orgId, userId, teamId },
    dispatch,
  } = useApplicationContext();

  const handlenext = async () => {
    try {
      if (ref.current) {
        const users = ref.current.getUsers();
        const leavePoliciesData = await fetchLeavePolicies(teamId);
        const activePolicies = leavePoliciesData.filter(
          ({ isActive }) => isActive
        );
        const accruedLeave = activePolicies.reduce((acc, policy) => {
          acc[policy.leaveTypeId] = {
            balance: policy.unlimited ? "unlimited" : policy.maxLeaves,
          };
          return acc;
        }, {});
        const usedLeave = activePolicies.reduce((acc, policy) => {
          acc[policy.leaveTypeId] = {
            balance: policy.unlimited ? "unlimited" : 0,
          };
          return acc;
        }, {});

        const data = await insertUsers(
          orgId,
          users,
          userId,
          teamId,
          accruedLeave,
          usedLeave
        );
        // if (!data) {
        //   // Handle failure to update team settings
        //   throw new Error("Failed to insert users");
        // }

        // Update initial setup state
        const status = await updateInitialsetupState(orgId, "6");
        if (status) {
          // // Navigate to the next page if update is successful
          // router.push(
          //   new URL(
          //     "/initialsetup/locations",
          //     window?.location.origin
          //   ).toString()
          // );
        }
        // Update team settings
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
      <TopSteps position={5} />
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

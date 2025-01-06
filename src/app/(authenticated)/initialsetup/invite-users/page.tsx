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
    state: { orgId, userId, teamId, org },
    dispatch,
  } = useApplicationContext();

  const handlenext = async () => {
    try {
      if (!ref.current) throw new Error("Reference not available");

      const users = ref.current.getUsers();
      const leavePoliciesData = await fetchLeavePolicies(teamId);

      // const activePolicies = leavePoliciesData.filter(
      //   ({ isActive }) => isActive
      // );

      // Create users array with prorated leave balances
      const updatedUsers = users.map((user) => {
        const prorateFactor = user.isProrate;
        const today = new Date("2025-06-07T00:46:03+05:30");
        // console.log(today)

        const janFirstThisYear = new Date(today.getFullYear(), 0, 1);
        const orgCreatedOn = org?.createdOn
          ? new Date(org.createdOn)
          : new Date();

        const accruedLeave = leavePoliciesData.reduce((acc, policy) => {
          if (!prorateFactor) {
            // If prorating is disabled
            if (policy.unlimited) {
              acc[policy.leaveTypeId] = { balance: "unlimited" };
            } else {
              if (!policy.accruals) {
                acc[policy.leaveTypeId] = { balance: policy.maxLeaves };
              } else {
                acc[policy.leaveTypeId] = { balance: 0 };
              }
            }
          } else {
            // If prorating is enabled
            if (policy.unlimited) {
              acc[policy.leaveTypeId] = { balance: "unlimited" };
            } else {
              if (!policy.accruals) {
                acc[policy.leaveTypeId] = { balance: policy.maxLeaves };
              } else {
                const maxLeavesPerMonth = policy.maxLeaves / 12;

                // Determine the start date for prorating
                const prorateStartDate =
                  orgCreatedOn < janFirstThisYear
                    ? janFirstThisYear
                    : orgCreatedOn;
                console.log(prorateStartDate);
                // Calculate the number of months for prorating
                const monthsForProrate =
                  (today.getFullYear() - prorateStartDate.getFullYear()) * 12 +
                  (today.getMonth() - prorateStartDate.getMonth()) +
                  1; // Include the current month

                acc[policy.leaveTypeId] = {
                  balance: maxLeavesPerMonth * monthsForProrate,
                };
              }
            }
          }
          return acc;
        }, {});

        const usedLeave = leavePoliciesData.reduce((acc, policy) => {
          acc[policy.leaveTypeId] = {
            balance: policy.unlimited ? "unlimited" : 0, // Adjust if necessary
          };
          return acc;
        }, {});

        return {
          email: user.email,
          slackId: user.slackId,
          name: user.name,
          orgId,
          teamId,
          accruedLeave,
          usedLeave,
          createdBy: userId,
        };
      });

      const data = await insertUsers(orgId, updatedUsers);

      // Proceed with other logic if necessary
      const status = await updateInitialsetupState(orgId, "6");
      if (status) {
        router.push("/dashboard/timeline");
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
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

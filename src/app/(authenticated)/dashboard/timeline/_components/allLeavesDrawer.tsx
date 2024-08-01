import { Button, Card, Drawer, Flex, Space, Typography } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { createClient } from "@/app/_utils/supabase/client";
import { useApplicationContext } from "@/app/_context/appContext";
import { getLeaves } from "@/app/_components/header/_components/actions";

const supabase = createClient();

const AllLeavesDrawer = ({
  allLeaveDrawerVisible,
  setAllLeaveDrawerVisible,
}: any) => {
  const [leave, setLeave] = useState<any[]>([]);
  const {
    state: { userId, user },
  } = useApplicationContext();
  const fetchLeave = useCallback(async () => {
    try {
      const data = await getLeaves("userId",userId)
      setLeave(data);
    } catch (error) {
      console.error("Error fetching user team:", error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchLeave();
    }
  }, []);

  const leaves = [
    {
      type: "paid of",
      approve: "PENDING",
      color: "red",
      start: "16.6.2024",
      end: "20.6.2024",
    },
    {
      type: "sick leave",
      approve: "APPROVE",
      color: "blue",
      start: "18.6.2024",
      end: "25.6.2024",
    },
    {
      type: "paid of",
      approve: "PENDING",
      color: "red",
      start: "16.6.2024",
      end: "20.6.2024",
    },
    {
      type: "sick leave",
      approve: "APPROVE",
      color: "blue",
      start: "18.6.2024",
      end: "25.6.2024",
    },
  ];
  return (
    <Drawer
      title={user ? "Ashutosh" : null}
      open={allLeaveDrawerVisible}
      onClose={() => setAllLeaveDrawerVisible(false)}
    >
      <Typography.Title level={3}>Leave Requests:</Typography.Title>
      {leaves.map((each, i) => {
        return (
          <Card
            style={{
              borderLeft: `5px solid ${each.color}`,
              marginBottom: "5px",
            }}
            bodyStyle={{ padding: "15px" }}
            key={i}
          >
            <Flex justify="space-between" style={{ width: "100%" }}>
              <Space direction="vertical">
                <Typography.Paragraph
                  style={{ fontSize: "18px", margin: "0px" }}
                >
                  {each.type}
                </Typography.Paragraph>
                <Typography.Text style={{ margin: "0px" }}>
                  {each.start}-{each.end}
                </Typography.Text>
              </Space>
              <Typography.Text type="success">{each.approve}</Typography.Text>
            </Flex>
          </Card>
        );
      })}
      <Button type="primary">Add leave</Button>
    </Drawer>
  );
};

export default AllLeavesDrawer;

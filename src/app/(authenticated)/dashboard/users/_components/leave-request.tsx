import { CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import { Card, List, Space } from "antd";
import React from "react";
import { formatLeavesData, getLeaves } from "../_actions";
import useSWR from "swr";
import { useApplicationContext } from "@/app/_context/appContext";

const LeaveRequest = ({ user, data }: { user: any , data: any, loading: any}) => {
  return (
    <List
      dataSource={data || []}
      renderItem={(item: any, i) => (
        <Card
          styles={{ body: { padding: "0 20px 0 20px" } }}
          style={{
            marginBottom: "10px",
            borderLeft: `5px solid #${item.color}`,
          }}
        >
          <List.Item
            extra={
              <span
                style={{
                  color: item.color,
                  width: "100px",
                  textAlign: "right",
                }}
              >
                {item.status}
              </span>
            }
          >
            <List.Item.Meta
              title={
                <Space>
                  <CalendarOutlined /> {item.type}
                </Space>
              }
              description={
                <p>
                  {item.startDate} - {item.endDate}
                </p>
              }
            />
            <Card
              bordered={false}
              styles={{ body: { padding: "10px" } }}
              style={{
                width: "75%",
                boxShadow: "none",
                borderLeft: `2px solid ${item.color}`,
                borderRadius: "0px",
              }}
            >
              {item.leaveRequestNote}
            </Card>
          </List.Item>
        </Card>
      )}
    />
  );
};

export default LeaveRequest;

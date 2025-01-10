import { CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import { Card, List, Space } from "antd";
import React from "react";

const LeaveRequest = ({ user }: { user: any }) => {
  const data = [
    {
      type: "paid of",
      startDate: "2025-01-01",
      endDate: "2025-01-05",
      leaveRequestNote: "tesing 1",
      status: "pending",
      color: "blue",
    },
    {
      type: "sick",
      startDate: "2025-01-06",
      endDate: "2025-01-10",
      leaveRequestNote: "tesing 2",
      status: "pending",
      color: "red",
    },
    {
      type: "unpaid",
      startDate: "2025-01-16",
      endDate: "2025-01-20",
      leaveRequestNote: "tesing 3",
      status: "approved",
      color: "green",
    },
  ];
  return (
    <List
      dataSource={data}
      renderItem={(item, i) => (
        <Card
          styles={{ body: { padding: "0 20px 0 20px" } }}
          style={{
            marginBottom: "10px",
            borderLeft: `5px solid ${item.color}`,
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
                  {item.startDate} - {item.endDate} (5 working days)
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

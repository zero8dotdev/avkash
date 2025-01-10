"use client";

import { useApplicationContext } from "@/app/_context/appContext";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Row, Flex, Select, Table, Col, Space } from "antd";
import useSWR from "swr";
import { getLeaves } from "../_actions";

export default function LeaveReport({ user }: { user: any }) {
  const d = new Date();
  let year = d.getFullYear();
  let month = d.getMonth();
  const { state: appState } = useApplicationContext();
  const { userId } = appState;


  const fetcher = async (userId: string) => {
    const user = userId.split("*")[1];
    const data =  await getLeaves(user);
  
    // if (error) {
    //   throw new Error("Failed to fetch organization data");
    // }
    return data;
  };
  
    const {
      data: dataSource,
      error,
      mutate,
    } = useSWR(`userLeaveReport*${userId}`, fetcher);
    console.log("dataSource",dataSource)
  // const dataSource = [
  //   {
  //     key: "1",
  //     leaveType: "paid",
  //     taken: 5,
  //     planned: 6,
  //     total: 14,
  //     remaining: 3,
  //     available: 2,
  //   },
  //   {
  //     key: "2",
  //     leaveType: "sick",
  //     taken: 5,
  //     planned: 6,
  //     total: 14,
  //     remaining: 3,
  //     available: 2,
  //   },
  //   {
  //     key: "3",
  //     leaveType: "unpaid",
  //     taken: 5,
  //     planned: 6,
  //     total: 14,
  //     remaining: 3,
  //     available: 2,
  //   },
  // ];

  // TODO: 1. make select full width, make table full width
  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Flex gap={8}>
            <Select style={{ width: 200 }} defaultValue={year}>
              <Select.Option value={year}>{year}</Select.Option>
            </Select>
            <Select style={{ width: 200 }} defaultValue={month}>
              <Select.Option value={0}>All</Select.Option>
              <Select.Option value={1}>January</Select.Option>
              <Select.Option value={2}>Febuary</Select.Option>
              <Select.Option value={3}>March</Select.Option>
              <Select.Option value={4}>April</Select.Option>
              <Select.Option value={5}>May</Select.Option>
              <Select.Option value={6}>June</Select.Option>
              <Select.Option value={7}>July</Select.Option>
              <Select.Option value={8}>August</Select.Option>
              <Select.Option value={9}>September</Select.Option>
              <Select.Option value={10}>October</Select.Option>
              <Select.Option value={11}>November</Select.Option>
              <Select.Option value={12}>December</Select.Option>
            </Select>
          </Flex>
        </Col>

        <Col span={24}>
          <Table
            bordered
            dataSource={dataSource}
            pagination={false}
            columns={[
              { title: "LEAVE TYPE", dataIndex: "leaveType", key: "leaveType" },
              { title: "TAKEN", dataIndex: "taken", key: "taken" },
              { title: "PLANNED", dataIndex: "planned", key: "planned" },
              { title: "TOTAL", dataIndex: "total", key: "total" },
              {
                title: (
                  <Space>
                    REMAINING <QuestionCircleOutlined />
                  </Space>
                ),
                dataIndex: "remaining",
                key: "remaining",
              },
              {
                title: (
                  <Space>
                    AVAILABLE <QuestionCircleOutlined />
                  </Space>
                ),
                dataIndex: "available",
                key: "available",
              },
            ]}
            summary={(pageData) => {
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={1}>sum</Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    {pageData.reduce((sum, record) => sum + record.taken, 0)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    {pageData.reduce((sum, record) => sum + record.planned, 0)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    {pageData.reduce((sum, record) => sum + record.total, 0)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    {pageData.reduce(
                      (sum, record) => sum + record.remaining,
                      0
                    )}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    {pageData.reduce(
                      (sum, record) => sum + record.available,
                      0
                    )}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </Col>
      </Row>
    </>
  );
}

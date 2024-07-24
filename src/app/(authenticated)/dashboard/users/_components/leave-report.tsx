"use client";

import { Row, Flex, Select, Table } from "antd";

export default function LeaveReport({ user }: { user: any }) {
  const { accruedLeave, usedLeave } = user;

  const usedLeaveMap = Object.keys(usedLeave).reduce(
    (acc: { [key: string]: any }, key) => {
      const newKey = usedLeave[key]["name"];
      const value = usedLeave[key]["balance"];

      acc[newKey] = value;
      return acc;
    },
    {}
  );

  const final = Object.keys(accruedLeave)
    .map((key) => {
      return {
        leaveType: accruedLeave[key]["name"],
        remaining: accruedLeave[key]["balance"],
      };
    })
    .map((x) => {
      return {
        ...x,
        taken: usedLeaveMap[x.leaveType],
      };
    });

  // TODO: 1. make select full width, make table full width
  return (
    <>
      <Row gutter={8}>
        <Flex gap={8}>
          <Select>
            <Select.Option value={2024}>2024</Select.Option>
          </Select>
          <Select>
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
      </Row>
      <Row gutter={8}>
        <Table
          bordered
          pagination={false}
          columns={[
            { title: "Leave Type", dataIndex: "leaveType", key: "title" },
            { title: "Taken", dataIndex: "taken", key: "taken" },
            { title: "Remaining", dataIndex: "remaining", key: "remaining" },
          ]}
          dataSource={final}
        ></Table>
      </Row>
    </>
  );
}

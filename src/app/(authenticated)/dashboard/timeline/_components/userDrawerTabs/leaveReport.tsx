import { Flex, Select, Space, Table } from "antd";
import React, { useEffect } from "react";
import type { TableColumnsType } from "antd";





interface DataType {
  key: React.Key;
  name: string;
  taken: number;
  planned: number;
  total: number;
  remaining: number;
  available:number
}

const columns: TableColumnsType<DataType> = [
  {
    title: "LEAVE TYPE",
    dataIndex: "name",
  },
  {
    title: "TAKEN",
    dataIndex: "taken",
  },
  {
    title: "PLANNED",
    dataIndex: "planned",
  },
  {
    title: "TOTAL",
    dataIndex: "total",
  },
  {
    title: "REMAINING",
    dataIndex: "remaining",
  },
  {
    title: "AVAILABLE ?",
    dataIndex: "available",
  },
];

const data: DataType[] = [
  {
    key: "1",
    name: "paid time of",
    taken: 1,
    planned: 2,
    total: 7,
    remaining: 4,
    available:5
  },
  {
    key: "2",
    name: "Sick",
    taken: 1,
    planned: 2,
    total: 7,
    remaining: 4,
    available:5
  },
  {
    key: "3",
    name: "sum",
    taken: 1,
    planned: 2,
    total: 7,
    remaining: 4,
    available:5
  },
];

const LeaveReport = () => {

  return (
    <Flex vertical gap={12}>
      <Space>
        <Select style={{ width: "100px" }} defaultValue="2024">
          <Select.Option value="2024">2024</Select.Option>
        </Select>
        <Select style={{ width: "100px" }} defaultValue="all">
          <Select.Option value="all">All months</Select.Option>
          <Select.Option value="JAN">January</Select.Option>
          <Select.Option value="FEB">February</Select.Option>
          <Select.Option value="MARCH">March</Select.Option>
          <Select.Option value="APRIL">April</Select.Option>
          <Select.Option value="MAY">May</Select.Option>
          <Select.Option value="JUN">Jun</Select.Option>
          <Select.Option value="JULY">July</Select.Option>
          <Select.Option value="AUG">August</Select.Option>
          <Select.Option value="SEP">September</Select.Option>
          <Select.Option value="OCT">Octobar</Select.Option>
          <Select.Option value="NOV">November</Select.Option>
          <Select.Option value="DEC">December</Select.Option>
        </Select>
      </Space>
      <Table columns={columns} dataSource={data} bordered pagination={false}/>
    </Flex>
  );
};

export default LeaveReport;

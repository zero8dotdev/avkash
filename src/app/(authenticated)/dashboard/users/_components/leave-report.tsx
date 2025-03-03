'use client';

import { useApplicationContext } from '@/app/_context/appContext';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Row, Flex, Select, Table, Col, Space, Typography } from 'antd';
import useSWR from 'swr';
import { getLeaveSummaryByUser, getLeaves } from '../_actions';

export default function LeaveReport({
  user,
  data,
}: {
  user: any;
  data: any;
  loading: any;
}) {
  const d = new Date();
  let year = d.getFullYear();
  let month = d.getMonth();
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
            dataSource={data || []}
            pagination={false}
            columns={[
              { title: 'LEAVE TYPE', dataIndex: 'leaveType', key: 'leaveType' },
              { title: 'TAKEN', dataIndex: 'taken', key: 'taken' },
              { title: 'PLANNED', dataIndex: 'planned', key: 'planned' },
              { title: 'TOTAL', dataIndex: 'total', key: 'total' },
              {
                title: (
                  <Space>
                    REMAINING <QuestionCircleOutlined />
                  </Space>
                ),
                dataIndex: 'remaining',
                key: 'remaining',
              },
              {
                title: (
                  <Space>
                    AVAILABLE <QuestionCircleOutlined />
                  </Space>
                ),
                dataIndex: 'available',
                key: 'available',
              },
            ]}
            summary={(
              pageData: readonly {
                taken: number;
                planned: number;
                total: number;
                remaining: number;
                available: number;
              }[]
            ) => {
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={1}>
                    <Typography.Text strong style={{ color: '#E85A4F' }}>
                      Sum
                    </Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Typography.Text strong style={{ color: '#E85A4F' }}>
                      {pageData.reduce((sum, record) => sum + record?.taken, 0)}
                    </Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Typography.Text strong style={{ color: '#E85A4F' }}>
                      {pageData.reduce(
                        (sum, record) => sum + record?.planned,
                        0
                      )}
                    </Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Typography.Text strong style={{ color: '#E85A4F' }}>
                      {pageData.reduce((sum, record) => sum + record.total, 0)}
                    </Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <Typography.Text strong style={{ color: '#E85A4F' }}>
                      {pageData.reduce(
                        (sum, record) => sum + Number(record.remaining),
                        0
                      )}
                    </Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <Typography.Text strong style={{ color: '#E85A4F' }}>
                      {pageData.reduce(
                        (sum, record) => sum + Number(record.available),
                        0
                      )}
                    </Typography.Text>
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

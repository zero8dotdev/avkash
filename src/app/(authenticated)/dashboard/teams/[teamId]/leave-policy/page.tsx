"use client";
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Form,
  InputNumber,
  List,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import React, { useState } from "react";
import TeamSettingsTabs from "../_components/team-settings-tabs";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import useSWR from "swr";
import { useApplicationContext } from "@/app/_context/appContext";
import { fetchLeavePolicies } from "../_actions";

const Page = () => {
  const [segmentValue, setSegmentValue] = useState<string | number>("active");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const leaveTypes = [
    {
      id: "1",
      name: "paid off",
      color: "#1890ff",
      status: "active",
      leaves: "15",
    },
    {
      id: "2",
      name: "sick",
      color: "#ff4d4f",
      status: "active",
      leaves: "16",
    },
    {
      id: "3",
      name: "unpaid",
      color: "#ff4d",
      status: "inactive",
      leaves: "20",
    },
  ];

  const { state: appState } = useApplicationContext();
  const { teamId, orgId } = appState;

    // Fetch team data
    const fetcher = async (key: string) => {
      const team = key.split("*")[1];
      return await fetchLeavePolicies(team);
    };

    const { data: LeavePolicies, error, mutate, isValidating: leavePoliciesLoading } = useSWR(
      `teampolicies*${teamId}`,
      fetcher
    );

  const activeLeaveTypes = leaveTypes.filter(
    (leaveType: any) => leaveType.status === "active"
  );
  const inactiveLeaveTypes = leaveTypes.filter(
    (leaveType: any) => leaveType.status === "inactive"
  );
  const { Item } = Form;
  const [form] = Form.useForm();
  console.log("LeavePolicies", LeavePolicies);

  return (
    <Row>
      <Col span={3}>
        <TeamSettingsTabs position="leave-policy" />
      </Col>
      <Col span={16}>
        <Card title="Team Leave Policy">
          <Segmented
            value={segmentValue}
            style={{ marginBottom: "20px" }}
            onChange={setSegmentValue}
            options={[
              {
                label: "active",
                value: "active",
                icon: <CheckCircleTwoTone />,
              },
              {
                label: "inactive",
                value: "inactive",
                icon: <CloseCircleTwoTone />,
              },
            ]}
          />
          <Flex vertical>
            {segmentValue === "active" ? (
              <List
                bordered
                dataSource={activeLeaveTypes}
                renderItem={(item, index) => (
                  <List.Item
                    style={{ cursor: "pointer" }}
                    onClick={(event: React.MouseEvent<HTMLElement>) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setSelectedType(item.name);
                    }}
                  >
                    <List.Item.Meta
                      title={item.name}
                      avatar={
                        <Avatar style={{ backgroundColor: item.color }} />
                      }
                      description={`${item.leaves} days per year`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <List
                bordered
                dataSource={inactiveLeaveTypes}
                renderItem={(item, index) => (
                  <List.Item key={index}>
                    <List.Item.Meta
                      title={item.name}
                      avatar={
                        <Avatar style={{ backgroundColor: item.color }} />
                      }
                      description={`${item.leaves} days per year`}
                    />
                    <Button
                      type="text"
                      onClick={() =>
                        console.log(
                          "bro ekkada click cheste action rayali status should change to active ok"
                        )
                      }
                    >
                      Enable
                    </Button>
                  </List.Item>
                )}
              />
            )}
          </Flex>
        </Card>
        <Modal
          footer={null}
          open={selectedType !== null}
          width={700}
          title={
            <Flex vertical>
              <Typography.Title level={3}>{selectedType}</Typography.Title>
              <Typography.Paragraph
                type="secondary"
                style={{ fontSize: "20px", marginTop: "0px" }}
              >
                For Team name
              </Typography.Paragraph>
            </Flex>
          }
          onCancel={() => setSelectedType(null)}
        >
          <Form onFinish={(values) => console.log(values)} form={form}>
            <Flex gap={50}>
              <Item name="maxleaves" style={{ padding: "0px", margin: "0px" }}>
                <InputNumber />
              </Item>
              <Typography.Text strong>Days per year</Typography.Text>
            </Flex>
            <Flex
              gap={95}
              style={{ padding: "0px", margin: "12px 0px 0px 0px" }}
            >
              <Item name="unlimited" style={{ padding: "0px", margin: "0px" }}>
                <Switch />
              </Item>
              <Typography.Text strong>
                Allow unlimited leave days
              </Typography.Text>
            </Flex>
            <Flex
              gap={95}
              style={{ padding: "0px", margin: "12px 0px 0px 0px" }}
            >
              <Item name="accruals">
                <Switch />
              </Item>
              <Flex vertical gap={5}>
                <Typography.Text strong>Accruals</Typography.Text>
                <Typography.Text type="secondary">
                  If you enable accruals, leave will be earned continuously over
                  the year.
                </Typography.Text>
                <Flex gap={10}>
                  <Typography.Text type="secondary">
                    Accrual Frequency
                  </Typography.Text>
                  <Item
                    name="accrualfrequency"
                    style={{ padding: "0px", margin: "0px", width: "100px" }}
                  >
                    <Select
                      options={[
                        { value: "monthly", label: "Monthly" },
                        { value: "yearly", label: "Yearly" },
                      ]}
                    />
                  </Item>
                </Flex>
                <Flex gap={10} style={{ marginTop: "15px" }}>
                  <Typography.Text type="secondary">Accrual On</Typography.Text>
                  <Item
                    name="accrueOn"
                    initialValue="BEGINNING"
                    style={{ padding: "0px", margin: "0px", width: "100px" }}
                  >
                    <Segmented options={["BEGINNING", "END"]} />
                  </Item>
                </Flex>
              </Flex>
            </Flex>
            <Divider />
            <Flex gap={95}>
              <Item name="unusedleaves">
                <Switch />
              </Item>
              <Space direction="vertical">
                <Typography.Text strong>
                  Roll over unused leave to next year
                </Typography.Text>
                <Typography.Text type="secondary">
                  Roll over will be enabled by default when using accruals.
                </Typography.Text>
              </Space>
            </Flex>
            <Flex gap={95}>
              <Item name="rolloverlimit">
                <Switch />
              </Item>
              <Space direction="vertical">
                <Typography.Text strong>Limit roll over days</Typography.Text>
                <Flex gap={8}>
                  <Typography.Text type="secondary">
                    Limit roll over days each year to
                  </Typography.Text>
                  <Item
                    name="limitrolloverdays"
                    style={{ margin: "0px 0px 2px 2px", padding: "0px" }}
                  >
                    <InputNumber />
                  </Item>
                  <Typography.Text type="secondary">day</Typography.Text>
                </Flex>
              </Space>
            </Flex>
            <Flex gap={95}>
              <Item name="rolloverexpiry">
                <Switch />
              </Item>
              <Space direction="vertical">
                <Typography.Text strong>Roll over expiry</Typography.Text>
                <Space>
                  <Typography.Text type="secondary">
                    Roll over days expire each year on
                  </Typography.Text>
                  <Item
                    name="rolloverdayseachyear"
                    style={{ margin: "0px 0px 2px 2px", padding: "0px" }}
                  >
                    <Select style={{ width: "90px" }}>
                      <Select.Option value="dd/mm">dd/mm</Select.Option>
                    </Select>
                  </Item>
                </Space>
              </Space>
            </Flex>
            <Divider />
            <Flex gap={95}>
              <Item name="autoapprove">
                <Switch />
              </Item>
              <Typography.Text strong>
                Auto approve each leave request
              </Typography.Text>
            </Flex>
            <Flex justify="space-between">
              <Button onClick={() => setSelectedType(null)}>Cancel</Button>
              <Item>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              </Item>
            </Flex>
          </Form>
        </Modal>
      </Col>
    </Row>
  );
};

export default Page;

"use client";
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
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
import dayjs from "dayjs";
import React, { useState } from "react";
import TeamSettingsTabs from "../_components/team-settings-tabs";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import useSWR from "swr";
import { fetchLeavePolicies, updatePolicyData } from "../_actions";
import { useParams } from "next/navigation";

const Page = () => {
  const [segmentValue, setSegmentValue] = useState<string | number>("active");
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const { teamId } = useParams() as { teamId: string };
  // Fetch team data
  const { data: teamData, error, isValidating } = useSWR(`teamsettings*${teamId}`);
  const fetcher = async (key: string) => {
    const team = key.split("*")[1];
    return await fetchLeavePolicies(team);
  };

  const {
    data: leavePolicies = [],
    error: leavePoliciesError,
    mutate,
    isValidating: leavePoliciesLoading,
  } = useSWR(`teampolicies*${teamId}`, fetcher);

  const activeLeavePolicies =
    leavePolicies?.filter((leaveType: any) => leaveType.isActive) || [];
  const inactiveLeavePolicies =
    leavePolicies?.filter((leaveType: any) => !leaveType.isActive) || [];

  const { Item } = Form;
  const [form] = Form.useForm();

  const openModal = (policy: any) => {
    setSelectedPolicy(policy);
    form.setFieldsValue({
      maxLeaves: policy.maxLeaves,
      unlimited: policy.unlimited,
      accruals: policy.accruals,
      accrualFrequency: policy.accrualFrequency,
      accrueOn: policy.accrueOn,
      rollOver: policy.rollOver,
      rollOverLimit: policy.rollOverLimit,
      rollOverExpiry: policy.rollOverExpiry
        ? dayjs(policy.rollOverExpiry, "DD/MM") // Convert to Day.js object
        : null,
      autoApprove: policy.autoApprove,
    });
  };

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
                dataSource={activeLeavePolicies}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: "pointer" }}
                    onClick={() => openModal(item)}
                  >
                    <List.Item.Meta
                      title={item?.leaveType?.name}
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: `#${item?.leaveType?.color}`,
                          }}
                        />
                      }
                      description={`${item?.maxLeaves} days per year`}
                    />
                    <Button
                      type="text"
                      danger
                      onClick={async (e) => {
                        e.stopPropagation();
                        await updatePolicyData(
                          teamId,
                          { isActive: false },
                          item.leavePolicyId
                        ); // Update backend data
                        mutate();
                      }}
                    >
                      Disable
                    </Button>
                  </List.Item>
                )}
              />
            ) : (
              <List
                bordered
                dataSource={inactiveLeavePolicies}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: "pointer" }}
                    onClick={() => openModal(item)}
                  >
                    <List.Item.Meta
                      title={item?.leaveType?.name}
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: `#${item?.leaveType?.color}`,
                          }}
                        />
                      }
                      description={`${item?.maxLeaves} days per year`}
                    />
                    <Button
                      type="link"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await updatePolicyData(
                          teamId,
                          { isActive: true },
                          item.leavePolicyId
                        ); // Update backend data
                        mutate();
                      }}
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
          open={selectedPolicy !== null}
          width={700}
          title={
            <Flex vertical>
              <Typography.Title level={3}>
                {selectedPolicy?.leaveType?.name}
              </Typography.Title>
              <Typography.Paragraph
                type="secondary"
                style={{ fontSize: "20px", marginTop: "0px" }}
              >
                For {teamData?.name} Team
              </Typography.Paragraph>
            </Flex>
          }
          onCancel={() => setSelectedPolicy(null)}
        >
          <Form
            form={form}
            onFinish={async (values) => {
              if (values.rollOverExpiry) {
                values.rollOverExpiry = values.rollOverExpiry.format("DD/MM"); // or use "DD/MM" depending on your requirement
              }
              await updatePolicyData(
                teamId,
                values,
                selectedPolicy.leavePolicyId
              ); // Update backend data
              mutate();
              setSelectedPolicy(null);
            }}
          >
            <Flex gap={50}>
              <Item name="maxLeaves" style={{ padding: "0px", margin: "0px" }}>
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
                    name="accrualFrequency"
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
              <Item name="rollOver">
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
              <Space direction="vertical">
                <Typography.Text strong>Limit roll over days</Typography.Text>
                <Flex gap={8}>
                  <Typography.Text type="secondary">
                    Limit roll over days each year to
                  </Typography.Text>
                  <Item
                    name="rollOverLimit"
                    rules={[
                      {
                        validator: (_, value) => {
                          const maxLeaves = form.getFieldValue("maxLeaves"); // Get the maxLeaves value
                          if (value === undefined || value <= maxLeaves) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error(
                              `Roll over limit cannot exceed ${maxLeaves} days.`
                            )
                          );
                        },
                      },
                    ]}
                    style={{ margin: "0px 0px 2px 2px", padding: "0px" }}
                  >
                    <InputNumber />
                  </Item>
                  <Typography.Text type="secondary">days</Typography.Text>
                </Flex>
              </Space>
            </Flex>
            <Flex gap={95}>
              <Space direction="vertical">
                <Typography.Text strong>Roll over expiry</Typography.Text>
                <Space>
                  <Typography.Text type="secondary">
                    Roll over days expire each year on
                  </Typography.Text>
                  <Item
                    name="rollOverExpiry"
                    style={{ margin: "0px 0px 2px 2px", padding: "0px" }}
                  >
                    <DatePicker format="DD/MM" />
                  </Item>
                </Space>
              </Space>
            </Flex>
            <Divider />
            <Flex gap={95}>
              <Item name="autoApprove">
                <Switch />
              </Item>
              <Typography.Text strong>
                Auto approve each leave request
              </Typography.Text>
            </Flex>
            <Flex justify="space-between">
              <Button
                onClick={() => {
                  setSelectedPolicy(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
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

"use client";
import {
  Avatar,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  Popover,
  Row,
  Segmented,
  Select,
  Switch,
  Tag,
  Typography,
  Button,
  Checkbox,
  Steps,
} from "antd";
import {
  LeftOutlined,
  LoadingOutlined,
  SmileOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import React from "react";
import { useRouter } from "next/navigation";
import TopSteps from "../componenets/steps";

const Page = () => {
  const [leaveTypes, setLeaveTypes] = React.useState<any[]>([
    { name: "Paid time of", color: "#85a7de", active: true },
    { name: "Sick", color: "#d7a4ed", active: true },
    { name: "Unpaid", color: "#dbd1ce", active: false },
  ]);
  const router = useRouter();

  const handlenext = (values: any) => {
    console.log(values);
    router.push(
      new URL("/initialsetup/locations", window?.location.origin).toString()
    );
  };

  const handlePrevious = () => {
    router.push(
      new URL("/initialsetup/settings", window?.location.origin).toString()
    );
  };
  const [form] = Form.useForm();
  const handleLeaveTypes = (type: string) => {
    setLeaveTypes((prevLeaveTypes) =>
      prevLeaveTypes.map((leaveType) =>
        leaveType.name === type
          ? { ...leaveType, active: !leaveType.active }
          : leaveType
      )
    );
  };
  const activeLeaveTypesCount = leaveTypes.filter((e) => e.active).length;
  return (
    <Row
      style={{
        padding: "50px 50px 180px 20px",
        height: "100%",
      }}
    >
      <TopSteps position={2} />

      <Col span={16} push={4}>
        <Form
          size="small"
          form={form}
          style={{ width: "90%" }}
          onFinish={handlenext}
        >
          <Card
            style={{
              margin: "25px 0px 25px 0px",
              minHeight: "300px",
              overflow: "auto",
            }}
          >
            <>
              {leaveTypes.every((e) => !e.active) && (
                <Typography.Title level={3} type="danger">
                  Atleast select one leave type
                </Typography.Title>
              )}
              <Row gutter={12}>
                {leaveTypes.map((e: any, i) => (
                  <Col
                    key={i}
                    // span={activeLeaveTypesCount === 1 ? 24 : 12}
                    span={24}
                    style={{ marginBottom: "8px" }}
                  >
                    {e.active ? (
                      <Card
                        styles={{
                          header: {
                            border: "none",
                            padding: "0px 12px 0px 20px",
                          },
                          body: { padding: "0px 20px 0px 20px" },
                        }}
                        style={{
                          width: "100%",
                        }}
                        title={
                          <>
                            <Avatar
                              size={20}
                              style={{ backgroundColor: e.color }}
                            />
                            <Typography.Text
                              style={{ marginLeft: "8px", padding: "0px" }}
                            >
                              {e.name}
                            </Typography.Text>
                          </>
                        }
                        extra={
                          <Tag
                            color="warning"
                            onClick={() => handleLeaveTypes(e.name)}
                          >
                            Disable
                          </Tag>
                        }
                      >
                        <Flex gap={12} justify="space-between">
                          <Typography.Text>unlimited leaves</Typography.Text>
                          <Popover
                            content={
                              form.getFieldValue([e.name, "unlimited"])
                                ? "Unlimited days per year"
                                : "Allow unlimited leaves days"
                            }
                          >
                            <Form.Item
                              name={[e.name, "unlimited"]}
                              style={{ margin: "0px 0px 10px 0px" }}
                            >
                              <Switch />
                            </Form.Item>
                          </Popover>
                        </Flex>
                        <Form.Item
                          style={{ margin: "0px 0px 0px 0px" }}
                          shouldUpdate={(prevValues, currentValues) => {
                            // console.log("Previous Values:", prevValues);
                            // console.log("Current Values:", currentValues);
                            return (
                              prevValues[e.name].unlimited !==
                              currentValues[e.name].unlimited
                            );
                          }}
                        >
                          {({ getFieldValue }) => {
                            return !getFieldValue([e.name, "unlimited"]) ? (
                              <>
                                <Flex gap={12} vertical>
                                  <Typography.Text>
                                    Maximum leaves
                                  </Typography.Text>
                                  <Popover content="maximum 100 leave days per year">
                                    <Form.Item
                                      name={[e.name, "maxLeaves"]}
                                      style={{ margin: "0px 0px 10px 0px" }}
                                      initialValue={14}
                                    >
                                      <Input type="number" max={100} min={1} />
                                    </Form.Item>
                                  </Popover>
                                </Flex>
                                <Flex gap={12} justify="space-between">
                                  <Typography.Text>
                                    Accruals leaves
                                  </Typography.Text>
                                  <Popover content="If you enable accruals, leave will be earned continuously over the year">
                                    <Form.Item
                                      name={[e.name, "accruals"]}
                                      style={{ margin: "0px 0px 10px 0px" }}
                                    >
                                      <Switch />
                                    </Form.Item>
                                  </Popover>
                                </Flex>

                                <Form.Item
                                  style={{ margin: "0px" }}
                                  shouldUpdate={(prevValues, currentValues) =>
                                    prevValues[e.name].accruals !==
                                    currentValues[e.name].accruals
                                  }
                                >
                                  {({ getFieldValue }) => {
                                    return getFieldValue([
                                      e.name,
                                      "accruals",
                                    ]) ? (
                                      <Flex justify="space-between">
                                        <Flex vertical gap={5}>
                                          <Typography.Text>
                                            Accrual Frequency
                                          </Typography.Text>
                                          <Popover content="You can set accrual frequency only once.">
                                            <Form.Item
                                              name={[
                                                e.name,
                                                "accrualFrequency",
                                              ]}
                                              style={{ margin: "0px" }}
                                              // help={
                                              //   <Typography.Text type="warning">
                                              //     You can set accrual frequency only once.
                                              //   </Typography.Text>
                                              // }
                                            >
                                              <Select>
                                                <Select.Option value="MONTHLY">
                                                  Monthly
                                                </Select.Option>
                                                <Select.Option value="QUARTERLY">
                                                  Quarterly
                                                </Select.Option>
                                              </Select>
                                            </Form.Item>
                                          </Popover>
                                        </Flex>
                                        <Flex vertical gap={5}>
                                          <Typography.Text>
                                            Accrual On
                                          </Typography.Text>
                                          <Form.Item
                                            style={{
                                              margin: "0px 0px 0px 0px",
                                            }}
                                            name={[e.name, "accrueOn"]}
                                            initialValue="Beginning"
                                          >
                                            <Segmented
                                              options={["BEGINNING", "END"]}
                                            />
                                          </Form.Item>
                                        </Flex>
                                      </Flex>
                                    ) : null;
                                  }}
                                </Form.Item>
                                <Flex gap={12} justify="space-between">
                                  <Typography.Text>Roll over</Typography.Text>
                                  <Popover content="Roll over unused leave to next year">
                                    <Form.Item
                                      name={[e.name, "rollover"]}
                                      style={{ margin: "0px 0px 10px 0px" }}
                                    >
                                      <Switch />
                                    </Form.Item>
                                  </Popover>
                                </Flex>
                                <Form.Item
                                  style={{ margin: "0px" }}
                                  shouldUpdate={(prevValues, currentValues) =>
                                    prevValues[e.name].rollover !==
                                    currentValues[e.name].rollover
                                  }
                                >
                                  {({ getFieldValue }) => {
                                    return getFieldValue([
                                      e.name,
                                      "rollover",
                                    ]) ? (
                                      <Flex justify="space-between">
                                        <Flex vertical gap={5}>
                                          <Typography.Text>
                                            Limit roll over unused leave to next
                                            year
                                          </Typography.Text>
                                          <Popover content="Instead of rolling over all unused days, this allows you to set a maximum number of days.">
                                            <Form.Item
                                              name={[e.name, "rollOverLimit"]}
                                              rules={[
                                                {
                                                  validator: async (
                                                    _,
                                                    value
                                                  ) => {
                                                    const maxLeavesValue =
                                                      Number(
                                                        form.getFieldValue([
                                                          e.name,
                                                          "maxLeaves",
                                                        ])
                                                      );
                                                    const rollOverValue =
                                                      Number(value);

                                                    console.log(
                                                      "value:",
                                                      rollOverValue,
                                                      "maxLeavesValue:",
                                                      maxLeavesValue,
                                                      "comparison:",
                                                      rollOverValue >
                                                        maxLeavesValue
                                                    );

                                                    if (
                                                      rollOverValue >
                                                      maxLeavesValue
                                                    ) {
                                                      return Promise.reject(
                                                        new Error(
                                                          "Roll over limit cannot be greater than maximum leaves"
                                                        )
                                                      );
                                                    }
                                                    return Promise.resolve();
                                                  },
                                                },
                                              ]}
                                            >
                                              <Input
                                                type="number"
                                                min={1}
                                                suffix={
                                                  <span
                                                    style={{
                                                      marginRight: "15px",
                                                    }}
                                                  >
                                                    days
                                                  </span>
                                                }
                                              />
                                            </Form.Item>
                                          </Popover>
                                        </Flex>
                                        <Flex vertical gap={5}>
                                          <Typography.Text>
                                            Roll Over Expiry
                                          </Typography.Text>
                                          <Popover content="Instead of keeping  roll over days indefinitely, you  can set an expiration date here.">
                                            <Form.Item
                                              name={[e.name, "rollOverExpiry"]}

                                              // help="Instead of keeping  roll over days indefinitely, you  can set an expiration date here."
                                            >
                                              <DatePicker format="DD/MM" />
                                            </Form.Item>
                                          </Popover>
                                        </Flex>
                                      </Flex>
                                    ) : null;
                                  }}
                                </Form.Item>
                              </>
                            ) : null;
                          }}
                        </Form.Item>

                        <Flex gap={12} justify="space-between">
                          <Typography.Text>Auto approve</Typography.Text>
                          <Popover content="Auto approve each leave request">
                            <Form.Item
                              name={[e.name, "autoAprrive"]}
                              style={{ margin: "0px 0px 10px 0px" }}
                            >
                              <Switch />
                            </Form.Item>
                          </Popover>
                        </Flex>
                      </Card>
                    ) : (
                      <Card
                        title={
                          <>
                            {" "}
                            <Avatar
                              size={15}
                              style={{
                                backgroundColor: e.color,
                                marginRight: "10px",
                              }}
                            />
                            {e.name}
                          </>
                        }
                        style={{
                          width: "100%",
                        }}
                        styles={{
                          header: { border: "none", padding: "8px" },
                          body: { padding: "0px" },
                        }}
                        extra={
                          <Tag
                            color="success"
                            onClick={() => handleLeaveTypes(e.name)}
                          >
                            Enable
                          </Tag>
                        }
                      />
                    )}
                  </Col>
                ))}
              </Row>
            </>
          </Card>
          <Flex justify="space-between">
            <Button danger icon={<LeftOutlined />} onClick={handlePrevious}>
              Previous
            </Button>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Next
              </Button>
            </Form.Item>
            {/* <Button type="primary">Done</Button> */}
          </Flex>
        </Form>
      </Col>
    </Row>
  );
};

export default Page;

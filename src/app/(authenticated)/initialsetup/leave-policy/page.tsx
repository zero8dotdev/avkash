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
} from "antd";
import React from "react";

const Page = () => {
  const [leaveTypes, setLeaveTypes] = React.useState<any[]>([
    { name: "Paid time of", color: "#3273db", active: true },

    { name: "Sick", color: "#fa592d", active: true },
    { name: "Unpaid", color: "#dbd1ce", active: false },
  ]);

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
            span={activeLeaveTypesCount === 1 ? 18 : 12}
            style={{ marginBottom: "8px" }}
          >
            {e.active ? (
              <Card
                styles={{
                  header: { border: "none", padding: "0px 12px 0px 20px" },
                  body: { padding: "0px 20px 0px 20px" },
                }}
                title={
                  <>
                    <Avatar size={15} style={{ backgroundColor: e.color }} />
                    <Typography.Text
                      style={{ marginLeft: "8px", padding: "0px" }}
                    >
                      {e.name}
                    </Typography.Text>
                  </>
                }
                extra={
                  <Tag color="warning" onClick={() => handleLeaveTypes(e.name)}>
                    Disable
                  </Tag>
                }
              >
                <Form size="small" form={form} style={{ width: "90%" }}>
                  <Flex gap={12} justify="space-between">
                    <Typography.Text>unlimited leaves</Typography.Text>
                    <Popover
                      content={
                        form.getFieldValue("unlimited")
                          ? "Unlimited days per year"
                          : "Allow unlimited leaves days"
                      }
                    >
                      <Form.Item
                        name="unlimited"
                        style={{ margin: "0px 0px 10px 0px" }}
                      >
                        <Switch />
                      </Form.Item>
                    </Popover>
                  </Flex>
                  <Form.Item
                    style={{ margin: "0px 0px 0px 0px" }}
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.unlimited !== currentValues.unlimited
                    }
                  >
                    {({ getFieldValue }) => {
                      return !getFieldValue("unlimited") ? (
                        <>
                          <Flex gap={12} vertical>
                            <Typography.Text>Maximum leaves</Typography.Text>
                            <Popover content="maximum 100 leave days per year">
                              <Form.Item
                                name="maxLeaves"
                                style={{ margin: "0px 0px 10px 0px" }}
                                initialValue={1}
                              >
                                <Input type="number" max={100} min={1} />
                              </Form.Item>
                            </Popover>
                          </Flex>
                          <Flex gap={12} justify="space-between">
                            <Typography.Text>Accruals leaves</Typography.Text>
                            <Popover content="If you enable accruals, leave will be earned continuously over the year">
                              <Form.Item
                                name="accruals"
                                style={{ margin: "0px 0px 10px 0px" }}
                              >
                                <Switch />
                              </Form.Item>
                            </Popover>
                          </Flex>

                          <Form.Item
                            style={{ margin: "0px" }}
                            shouldUpdate={(prevValues, currentValues) =>
                              prevValues.accruals !== currentValues.accruals
                            }
                          >
                            {({ getFieldValue }) => {
                              return getFieldValue("accruals") ? (
                                <Flex justify="space-between">
                                  <Flex vertical gap={5}>
                                    <Typography.Text>
                                      Accrual Frequency
                                    </Typography.Text>
                                    <Popover content="You can set accrual frequency only once.">
                                      <Form.Item
                                        name="accrualFrequency"
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
                                      style={{ margin: "0px 0px 0px 0px" }}
                                      name="accrueOn"
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
                                name="rollover"
                                style={{ margin: "0px 0px 10px 0px" }}
                              >
                                <Switch />
                              </Form.Item>
                            </Popover>
                          </Flex>
                          <Form.Item
                            style={{ margin: "0px" }}
                            shouldUpdate={(prevValues, currentValues) =>
                              prevValues.rollover !== currentValues.rollover
                            }
                          >
                            {({ getFieldValue }) => {
                              return getFieldValue("rollover") ? (
                                <Flex justify="space-between">
                                  <Flex vertical gap={5}>
                                    <Typography.Text>
                                      Limit roll over unused leave to next year
                                    </Typography.Text>
                                    <Popover content="Instead of rolling over all unused days, this allows you to set a maximum number of days.">
                                      <Form.Item name="rollOverLimit">
                                        <Input
                                          type="number"
                                          max={14}
                                          min={1}
                                          suffix={
                                            <span
                                              style={{ marginRight: "15px" }}
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
                                        name="rollOverExpiry"

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
                        name="autoAprrive"
                        style={{ margin: "0px 0px 10px 0px" }}
                      >
                        <Switch />
                      </Form.Item>
                    </Popover>
                  </Flex>
                </Form>
              </Card>
            ) : (
              <Card
                title={
                  <>
                    {" "}
                    <Avatar
                      size={15}
                      style={{ backgroundColor: e.color, marginRight: "10px" }}
                    />
                    {e.name}
                  </>
                }
                styles={{
                  header: { border: "none", padding: "8px" },
                  body: { padding: "0px" },
                }}
                extra={
                  <Tag color="success" onClick={() => handleLeaveTypes(e.name)}>
                    Enable
                  </Tag>
                }
              />
            )}
          </Col>
        ))}
      </Row>
    </>
  );
};

export default Page;

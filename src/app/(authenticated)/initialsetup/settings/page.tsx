"use client";
import {
  Button,
  Card,
  Checkbox,
  Flex,
  Form,
  Input,
  Select,
  Col,
  Row,
  Steps,
} from "antd";
import moment from "moment-timezone";
import { useEffect, useState } from "react";
import {
  LeftOutlined,
  LoadingOutlined,
  SmileOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import TopSteps from "../componenets/steps";

const { Item: FormItem } = Form;
const { Option: SelectOption } = Select;
const { Group: CheckboxGroup } = Checkbox;

const Setting = ({}) => {
  const [timezones, setTimezones] = useState<any[]>([]);
  const [startOfWorkWeek, setStartOfWeek] = useState<string[]>([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ]);
  const router = useRouter();

  useEffect(() => {
    const allTimezones = moment.tz.names();
    setTimezones(allTimezones);
  }, []);

  const [form] = Form.useForm();

  const weekDays = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  const onChangeWorkWeek = (v: any) => {
    const data = v.sort(
      (a: any, b: any) => weekDays.indexOf(a) - weekDays.indexOf(b)
    );
    setStartOfWeek(data);
    form.setFieldValue("startOfWorkWeek", data[0]);
  };

  const redirectToNext = new URL(
    "/initialsetup/leave-policy",
    window?.location.origin
  ).toString();

  const handlenext = (values: any) => {
    console.log(values);
    router.push(redirectToNext);
  };

  const handlePrevious = () => {
    router.push(
      new URL("/initialsetup/connect-slack", window?.location.origin).toString()
    );
  };

  return (
    <Row
      style={{
        padding: "50px 50px 180px 20px",
        height: "100%",
      }}
    >
      <TopSteps position={1} />
      <Col span={16} push={4}>
        <Form form={form} layout="vertical" onFinish={handlenext}>
          <Card
            style={{
              margin: "25px 0px 25px 0px",
              minHeight: "300px",
              overflow: "auto",
            }}
          >
            <Form.Item
              name="name"
              rules={[
                { required: true, message: "Please enter your team name" },
              ]}
              label="Team Name"
            >
              <Input placeholder="Enter your team name" />
            </Form.Item>
            <FormItem
              label="Start of work week"
              name="startOfWorkWeek"
              rules={[
                {
                  required: true,
                  message: "Please select start of work week.",
                },
              ]}
            >
              <Select placeholder="Start of the work week">
                {startOfWorkWeek.map((day) => (
                  <SelectOption key={day} value={day}>
                    {day}
                  </SelectOption>
                ))}
              </Select>
            </FormItem>
            <FormItem
              label="Work week"
              name="workweek"
              rules={[
                {
                  required: true,
                  message: "Please select atleast one working day",
                },
              ]}
              initialValue={startOfWorkWeek}
            >
              <CheckboxGroup onChange={(v) => onChangeWorkWeek(v)}>
                {weekDays.map((day) => (
                  <Checkbox key={day} value={day}>
                    {day}
                  </Checkbox>
                ))}
              </CheckboxGroup>
            </FormItem>
            <FormItem
              label="Time Zone"
              name="timeZone"
              rules={[
                { required: true, message: "Please select your timezone." },
              ]}
            >
              <Select
                showSearch
                placeholder="Timezone"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  ((option?.label ?? "") as string)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                filterSort={(optionA, optionB) =>
                  ((optionA?.label ?? "") as string)
                    .toLowerCase()
                    .localeCompare(
                      ((optionB?.label ?? "") as string).toLowerCase()
                    )
                }
                options={timezones.map((timezone: string) => ({
                  value: timezone,
                  label: timezone,
                }))}
              />
            </FormItem>
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
          </Flex>
        </Form>
      </Col>
    </Row>
  );
};

export default Setting;

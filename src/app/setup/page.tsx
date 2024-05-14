"use client";
import { DeleteOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Steps,
  Switch,
  Table,
  message,
} from "antd";
import moment from "moment-timezone";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { countries } from "countries-list";
import axios from "axios";
import { useRouter } from "next/navigation";
import { SettingPage } from "./steps/settings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function InitialSettings() {
  const [current, setCurrent] = useState(0);
  const [title, setTitle] = useState("Settings");
  const [formItems, setFormItems] = useState([{ id: 0 }]);
  const [selectedCountry, setSelectedCountry] = useState("IN");
  const [holidays, setHolidays] = useState<holidaysList[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await axios.get(
          `https://api.11holidays.com/v1/holidays?country=${[
            selectedCountry,
          ]}&year=${[2024]}`
        );
        const holidaysData = response.data.map((holiday: any) => ({
          key: holiday.holiday_id,
          name: holiday.name,
          date: holiday.date,
          isRecurring: true,
        }));
        setHolidays(holidaysData);
      } catch (error) {
        console.error("Error fetching holidays:", error);
      }
    };
    fetchHolidays();
  }, [selectedCountry]);

  const handleCountryChange = (value: any) => {
    setSelectedCountry(value);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleAddCustomForm = (values: any) => {
    const { name, date } = values;
    const newHoliday: holidaysList = {
      key: Date.now().toString(),
      name: name,
      date: date.format("YYYY-MM-DD"),
      isRecurring: true,
    };

    const updatedHolidays = [...holidays, newHoliday];
    setHolidays(updatedHolidays);
    setIsModalOpen(false);
  };

  const [form] = Form.useForm();

  const [timezones, setTimezones] = useState<any[]>([]);

  useEffect(() => {
    const allTimezones = moment.tz.names();
    setTimezones(allTimezones);
  }, []);

  const next = () => {
    form
      .validateFields()
      .then(() => {
        form.submit();
        setCurrent(current + 1);
        setTitle(steps[current + 1].title);
      })
      .catch((errorInfo) => {
        message.error("Please fill all required fields before proceeding.");
      });
  };

  const prev = () => {
    setCurrent(current - 1);
    setTitle(steps[current - 1].title);
  };
  const Done = () => {
    console.log("yes iam done");
    form.submit();
  };

  const LeavePolicyPage = () => {
    return (
      <div className="shadow-2xl p-5 border">
        <Flex gap={16} className="m-5 flex ">
          <Card className="shadow-md">
            <h1>Paid time off</h1>

            <Form.Item
              name="paidOfUnlimited"
              valuePropName="checked"
              help="Allow unlimited leave days"
            >
              <Switch className="bg-purple-500 mr-3" />
            </Form.Item>
            <Form.Item
              label="Maximum 14 leave days per year"
              name="paidOfMaxleave"
            >
              <InputNumber min={1} max={14} />
            </Form.Item>
            <Form.Item
              name="paidOfAccruals"
              help=" if you enable accruals,leave will be earned continuously
                    over the year"
            >
              <Switch className="bg-purple-500 mr-3" />
            </Form.Item>
            <Form.Item
              name="paidOfUnUsedLeave"
              help="Roll over unused leave to next year"
            >
              <Switch className="bg-purple-500 mr-3" />
            </Form.Item>
            <Form.Item
              className="autoApproveLeave"
              name="paidOfAutoApprove"
              help="Auto approve each leave request"
            >
              <Switch className="bg-purple-500 mr-3" />
            </Form.Item>
          </Card>
          <Card className="shadow-md">
            <h1>Sick</h1>
            <Form.Item
              name="sickUnlimited"
              valuePropName="checked"
              help=" Allow unlimited leave days"
            >
              <Switch className="bg-purple-500 mr-3" />
            </Form.Item>
            <Form.Item
              label="Maximum 14 leave days per year"
              name="sickMaxleave"
            >
              <InputNumber min={1} max={14} />
            </Form.Item>
            <Form.Item
              name="sickAccruals"
              help="if you enable accruals,leave will be earned continuously
                    over the year"
            >
              <Switch className="bg-purple-500  mr-3" />
            </Form.Item>
            <Form.Item
              name="sickUnUsedLeave"
              help="Roll over unused leave to next year"
            >
              <Switch className="bg-purple-500  mr-3" />
            </Form.Item>
            <Form.Item
              className="autoApproveLeave"
              name="sickAutoApprove"
              help="Auto approve each leave request"
            >
              <Switch className="bg-purple-500 mr-3" />
            </Form.Item>
          </Card>
          <div>
            <h1>Unpaid</h1>
            <a href="#">Enable</a>
          </div>
        </Flex>
      </div>
    );
  };
  interface holidaysList {
    key: string;
    name: string;
    date: string;
    isRecurring: boolean;
  }

  const LocationPage = () => {
    const handleDelete = (key: any) => {
      const updatedHolidays = holidays.filter((holiday) => holiday.key !== key);
      setHolidays(updatedHolidays);
    };

    const handleCheckboxChange = (isChecked: any, rowData: any) => {
      const updatedHolidays = [];
      for (const holiday of holidays) {
        if (holiday.key === rowData.key) {
          updatedHolidays.push({ ...holiday, isRecurring: isChecked });
        } else {
          updatedHolidays.push(holiday);
        }
      }
      setHolidays(updatedHolidays);
    };

    let countriesData: any = countries;

    const columns = [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "Date",
        dataIndex: "date",
        key: "date",
      },
      {
        title: "Recurring",
        dataIndex: "isRecurring",
        key: "isRecurring",
        render: (r: any, rowData: any) => (
          <Checkbox
            defaultChecked={rowData.isRecurring}
            onChange={(e) => handleCheckboxChange(e.target.checked, rowData)}
          />
        ),
      },
      {
        title: "Action",
        key: "action",
        render: (rowData: any) => (
          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={(event) => handleDelete(rowData.key)}
          />
        ),
      },
    ];

    return (
      <>
        <Select
          showSearch
          style={{ width: "300px" }}
          onChange={handleCountryChange}
          value={selectedCountry}
          options={Object.keys(countriesData).map((code: any) => ({
            label: countriesData[code].name,
            value: code,
          }))}
        />

        <Table columns={columns} dataSource={holidays} pagination={false} />
        <Button onClick={showModal} type="primary">
          Add Custom Holidays
        </Button>
        <Modal
          title="Basic Modal"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <Form onFinish={handleAddCustomForm}>
            <Form.Item name="name" label="Holiday Name">
              <Input placeholder="Name" />
            </Form.Item>
            <Form.Item name="date" label="Holiday Date">
              <DatePicker />
            </Form.Item>
            <Form.Item label="Recurring" name="recurring">
              <Checkbox defaultChecked />
            </Form.Item>
            <Form.Item>
              <Button type="default" htmlType="submit">
                Add Holiday
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  };

  const NotificationPage = () => {
    return (
      <Card className="shadow-xl">
        <h1>company name</h1>
        <Divider />

        <Form.Item
          label="Leave Changed"
          name="leaveChanged"
          valuePropName="checked"
          help="Send a notification
          whenever leave is approved or deleted"
          initialValue={false}
        >
          <Switch className="ml-12 bg-purple-500 mr-3" />
        </Form.Item>
        <Form.Item
          label="Daily Summary"
          name="dailySummary"
          valuePropName="checked"
          help="Send a report of upcoming work days leave"
          initialValue={false}
        >
          <Switch className="ml-12 bg-purple-500 mr-3" />
        </Form.Item>
        <Form.Item
          label="Weekly Summary"
          name="weeklySummary"
          valuePropName="checked"
          initialValue={false}
          help="Send a report of
          upcoming weeks leave"
        >
          <Switch className="ml-8 bg-purple-500 mr-3" />
        </Form.Item>
        <Form.Item
          label="Send notications to"
          name="sendNtf"
          initialValue={["Owners"]}
        >
          <Checkbox.Group className="ml-6">
            <Checkbox value="OWNER" defaultChecked>
              Owners
            </Checkbox>
            <Checkbox value="MANAGER">Managers</Checkbox>
          </Checkbox.Group>
        </Form.Item>
      </Card>
    );
  };
  const InviteUser = () => {
    const [data, setData] = useState<any[]>([]);
    const [count, setCount] = useState(0);

    const handleAddRow = () => {
      const newData = [...data];
      setCount((prevCount) => prevCount + 1);
      newData.push({
        key: count,
        name: (
          <Form.Item
            name={`firstName${count}`}
            rules={[{ required: true, message: "Please enter user name" }]}
          >
            <Input />
          </Form.Item>
        ),
        email: (
          <Form.Item
            name={`workEmail${count}`}
            rules={[
              { required: true, message: "Please enter user work email" },
            ]}
          >
            <Input />
          </Form.Item>
        ),

        manager: (
          <Form.Item
            name={`isManger${count}`}
            initialValue={false}
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
        ),
      });
      setData(newData);
    };

    const columns = [
      {
        title: "First Name",
        dataIndex: "name",
      },
      {
        title: "Work Email",
        dataIndex: "email",
      },

      {
        title: "Is manager",
        dataIndex: "manager",
      },
    ];

    return (
      <Card>
        <Table dataSource={data} columns={columns} pagination={false} />
        <Button onClick={handleAddRow} style={{ marginTop: 16 }} type="default">
          Add Row
        </Button>
      </Card>
    );
  };

  const steps = [
    {
      title: "Settings",
      content: <SettingPage timezones={timezones}/>,
    },
    {
      title: "Leave Policy",
      content: <LeavePolicyPage />,
    },
    {
      title: "Locations",
      content: <LocationPage />,
    },
    {
      title: "Notifications",
      content: <NotificationPage />,
    },
    {
      title: "Invite Users",
      content: <InviteUser />,
    },
  ];

  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  const onFinish = async (values: any) => {
    console.log(values);
    try {
      const orgId = localStorage.getItem("orgId");
      //settings

      const { data: updatedOrgData } = await supabase
        .from("Organisation")
        .update({
          startOfWorkWeek: values.startOfWorkWeek,
          timeZone: values.timeZone,
          workweek: values.workWeek,
        })
        .eq("orgId", orgId);

      //leaveType

      const { data: existingLeaveTypes } = await supabase
        .from("LeaveType")
        .select("*")
        .eq("orgId", orgId);
      if (!existingLeaveTypes || existingLeaveTypes.length === 0) {
        const leaveTypesToInsert = [
          { name: "paidOfLeave", orgId },
          { name: "sickLeave", orgId },
        ];
        await supabase.from("LeaveType").insert(leaveTypesToInsert);
      }
      //leavePolicy
      const { data: leavePolicy, error } = await supabase
        .from("LeavePolicy")
        .select("*")
        .eq("orgId", orgId);

      if (existingLeaveTypes !== null && leavePolicy?.length === 0) {
        const leavePolicyToUpsert = [
          {
            leaveTypeId: existingLeaveTypes[0].leaveTypeId,
            unlimited: values.paidOfUnlimited,
            maxLeaves: values.paidOfMaxleave,
            accurals: values.paidOfAccruals,
            rollOver: values.paidOfUnUsedLeave,
            orgId: existingLeaveTypes[0].orgId,
            autoApprove: values.paidOfAutoApprove,
          },
          {
            leaveTypeId: existingLeaveTypes[1].leaveTypeId,
            unlimited: values.sickUnlimited,
            maxLeaves: values.sickMaxleave,
            accurals: values.sickAccruals,
            rollOver: values.sickUnUsedLeave,
            orgId: existingLeaveTypes[1].orgId,
            autoApprove: values.sickAutoApprove,
          },
        ];

        const { data, error } = await supabase
          .from("LeavePolicy")
          .upsert(leavePolicyToUpsert);
        if (data) {
          console.log("inserted data successfully");
        } else {
          console.log(error);
        }
      }
      const { data: existingHolidaysData } = await supabase
        .from("Holiday")
        .select("*")
        .eq("orgId", orgId);
      if (!existingHolidaysData || existingHolidaysData.length == -0) {
        const holidaysToInsert = holidays.map((holiday: any) => ({
          name: holiday.name,
          date: holiday.date,
          isRecurring: holiday.isRecurring,
          orgId,
        }));
        const { data, error } = await supabase
          .from("Holiday")
          .insert(holidaysToInsert);
        if (data) {
          console.log("holidays list inserted successfully");
        } else {
          console.log(error);
        }

        //notification
      }
      const { data: updatedNotificationData } = await supabase
        .from("Organisation")
        .update({
          notificationDailySummary: values.dailySummary,
          notificationLeaveChanged: values.leaveChanged,
          notificationToWhom: values.sendNtf[0],
          notificationWeeklySummary: values.weeklySummary,
        })
        .eq("orgId", orgId);
      //inviter users

      const usersData: any[] = [];
      const keys = Object.keys(values);
      const teamId = localStorage.getItem("teamId");
      for (let i = 0; i < keys.length / 3; i++) {
        const index = String(i);
        usersData.push({
          name: values[`firstName${index}`],
          email: values[`workEmail${index}`],
          isManager: values[`isManger${index}`],
          teamId,
        });
      }

      const { data: userData, error: userError } = await supabase
        .from("User")
        .insert(usersData)
        .select();

      if (userError) {
        console.log(userError);
      } else {
        console.log(userData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-5 bg-white h-screen">
      <Form
        form={form}
        onFinish={onFinish}
        initialValues={{
          paidOfMaxleave: 14,
          sickMaxleave: 14,
          paidOfUnlimited: false,
          paidOfAccruals: false,
          paidOfAutoApprove: false,
          paidOfUnUsedLeave: false,
          sickAccruals: false,
          sickAutoApprove: false,
          sickUnUsedLeave: false,
          sickUnlimited: false,
        }}
      >
        <Steps
          current={current}
          items={items}
          className="border w-3/4"
          type="navigation"
        />
        <Flex vertical className="h-full">
          <Flex vertical>
            <h1 className="pt-8 pb-8">{title}</h1>
            <div className="w-3/4">{steps[current].content}</div>
          </Flex>

          <div style={{ marginTop: 24 }}>
            {current < steps.length - 1 && (
              <Button
                className="bg-purple-600 mr-3 text-white"
                onClick={() => next()}
              >
                Next
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button
                className="bg-purple-600 mr-3 text-white"
                htmlType="submit"
                onClick={Done}
              >
                Done
              </Button>
            )}
            {current > 0 && (
              <Button
                onClick={() => prev()}
                className="bg-purple-600 mr-3 text-white"
              >
                Previous
              </Button>
            )}
          </div>
        </Flex>
      </Form>
    </div>
  );
}

// export default function InitialSettings() {
//   return (
//     <div className="flex h-screen">
//       <Flex className="gap-8 h-screen  justify-center items-center ">
//       <Card className="w-96 h-3/6 ml-10 shadow-xl">

//       </Card>
//       <Card className="w-96 h-3/6 shadow-xl">

//       </Card>
//       <Card className="w-96 h-3/6 shadow-xl">

//       </Card>
//       <Card className="w-96 h-3/6 shadow-xl">

//       </Card>
//       <Card className="w-96 h-3/6 shadow-xl">

//       </Card>

//       </Flex>
//     </div>

//   )
// }

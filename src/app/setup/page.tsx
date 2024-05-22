"use client";
import {
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
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
  Radio,
  Row,
  Select,
  Space,
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
  const [selectedCountry, setSelectedCountry] = useState("IN");
  const [holidays, setHolidays] = useState<holidaysList[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [padiOfRollOver, setPaidOfRollOver] = useState(false);
  const [sickOfAccruals, setSickOfAccruals] = useState(false);
  const [paidOfAccruals, setPaidOfAccruals] = useState(false);
  const [sickOfRollOver, setSickOfRollOver] = useState(false);
  const [initialData,setInitialData]=useState([])

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
        <Flex gap={16} className="m-5">
          <Card className="shadow-md bg-blue-50">
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
              valuePropName="checked"
              help={
                <p className="text-blue-500">
                  if you enable accruals,leave will be earned continuously over
                  the year <a className="text-red-600">Learn More</a>
                </p>
              }
              label="Accruels"
            >
              <Switch
                className="bg-purple-500 mr-3"
                onChange={(c) => setPaidOfAccruals(c)}
              />
            </Form.Item>
            {paidOfAccruals && (
              <Space>
                <Form.Item
                  name="paidOfAccrualFrequency"
                  label="Accrual Frequency"
                  initialValue={"Monthly"}
                >
                  <Select placeholder="select accruals frequency">
                    <Select.Option value="Weekly">Weekly</Select.Option>
                    <Select.Option value="Monthly">Monthly</Select.Option>
                    <Select.Option value="Quarterly">Quarterly</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Accrue on" name="paidOfAccruedOn" initialValue={"End"}>
                  <Radio.Group >
                    <Radio value="Beginning">Beginning</Radio>
                    <Radio value="End">End</Radio>
                  </Radio.Group>
                </Form.Item>
              </Space>
            )}
            <Form.Item
              name="paidOfRollOver"
              valuePropName="checked"
              initialValue={false}
              help={
                padiOfRollOver ? (
                  <p className="text-blue-500">
                    Roll over will be enabled by default when using accruals.
                    <a className="text-red-600">Learn more</a>
                  </p>
                ) : (
                  ""
                )
              }
              label="Roll over unused leave to next year"
            >
              <Switch
                className="bg-purple-500 mr-2"
                onChange={(checked) => setPaidOfRollOver(checked)}
              />
            </Form.Item>
            {padiOfRollOver && (
              <Space direction="vertical">
                <Form.Item
                  name="paidOfRollOverEachYearDays"
                  label="Limit roll over days each year to"
                  initialValue={"1"}
                >
                  <Select
                    style={{ width: "100px" }}
                    placeholder="select how many days you want"
                  >
                    {Array.from(Array(14).keys()).map((i) => (
                      <Select.Option key={i + 1} value={i + 1}>
                        {i + 1}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="paidOExpireRollover"
                  valuePropName="checked"
                  label="Roll over days expire each year on"
                  initialValue={false}
                >
                  <Checkbox style={{ marginRight: "10px" }} />
                </Form.Item>

                <Form.Item
                  name="paidOfRollOverMonth"
                  initialValue={"dd/mm"}
                  extra="Insetead of keeping roll over days indefinitely, you can set an expiration date here."
                  label="Expiry date"
                >
                  <Select style={{ marginLeft: "10px", width: "100px" }}>
                    <Select.Option value="dd/mm">dd/mm</Select.Option>
                  </Select>
                </Form.Item>
              </Space>
            )}

            <Form.Item
              className="autoApproveLeave"
              name="paidOfAutoApprove"
              label="Auto approve each leave request"
              initialValue={false}
            >
              <Switch className="bg-purple-500 mr-3" />
            </Form.Item>
          </Card>

          <Card className="shadow-md bg-blue-50">
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
              help={
                <p className="text-blue-500">
                  if you enable accruals,leave will be earned continuously over
                  the year <a className="text-red-600">Learn More</a>
                </p>
              }
            >
              <Switch
                className="bg-purple-500  mr-3"
                onChange={(c) => setSickOfAccruals(c)}
              />
            </Form.Item>
            {sickOfAccruals && (
              <Space>
                <Form.Item
                  name="sickOfAccrualFrequency"
                  label="Accrual Frequency"
                  initialValue={"Monthly"}
                >
                  <Select placeholder="select accruals frequency">
                    <Select.Option value="Weekly">Weekly</Select.Option>
                    <Select.Option value="BiWeekly">Biweekly</Select.Option>
                    <Select.Option value="Monthly">Monthly</Select.Option>
                    <Select.Option value="Quarterly">Quarterly</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label="Accrue on"
                  name="sickOfaccrueOn"
                  initialValue={"End"}
                >
                  <Radio.Group >
                    <Radio value="Beginning">Beginning</Radio>
                    <Radio value="End">End</Radio>
                  </Radio.Group>
                </Form.Item>
              </Space>
            )}

            <Form.Item
              name="sickOfRollOver"
              label="Roll over unused leave to next year"
              initialValue={false}
            >
              <Switch
                className="bg-purple-500  mr-3"
                onChange={(checked) => setSickOfRollOver(checked)}
              />
            </Form.Item>
            {sickOfRollOver && (
              <Flex vertical>
                <Form.Item
                  name="sickOfRollOverEachYearDays"
                  label="Limit roll over days each year to"
                  initialValue={"1"}
                >
                  <Select
                    style={{ width: "100px" }}
                    placeholder="select how many days you want"
                  >
                    {Array.from(Array(14).keys()).map((i) => (
                      <Select.Option key={i + 1} value={i + 1}>
                        {i + 1}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="sickOfExpireRollover"
                  valuePropName="checked"
                  label="Roll over days expire each year on"
                  initialValue={false}
                >
                  <Checkbox style={{ marginRight: "10px" }} />
                </Form.Item>
                <Form.Item
                  name="sickOfRollOverMonth"
                  label="Expiry date"
                  initialValue={"dd/mm"}
                  help="Insetead of keeping roll over days indefinitely, you can set an expiration date here."
                >
                  <Select style={{ marginLeft: "10px", width: "100px" }}>
                    <Select.Option value="dd/mm">dd/mm</Select.Option>
                  </Select>
                </Form.Item>
              </Flex>
            )}
            <Form.Item
              className="autoApproveLeave"
              name="sickAutoApprove"
              help="Auto approve each leave request"
            >
              <Switch className="bg-purple-500 mr-3" />
            </Form.Item>
          </Card>
          <Card>
            <h1>Unpaid</h1>

            <a href="#">Enable</a>
          </Card>
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
    const columns = [
      {
        title: "Name",
        dateIndex: "name",
        render: (k: any, v: any, index: any) => (
          <Form.Item name={[index, "name"]}>
            <Input placeholder="First Name" />
          </Form.Item>
        ),
      },
      {
        title: "Working Email",
        dateIndex: "email",
        render: (k: any, v: any, index: any) => (
          <Form.Item name={[index, "email"]} rules={[{ type: "email" }]}>
            <Input placeholder="Email" />
          </Form.Item>
        ),
      },

      {
        title: "Is Manager",
        dateIndex: "isManager",
        render: (k: any, v: any, index: any) => (
          <Form.Item
            name={[index, "isManager"]}
            initialValue={false}
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
        ),
      },
      {
        title: "Action",
        dateIndex: "action",
        render: (text: any, record: any, index: any) => (
          <DeleteOutlined
            onClick={() => handleRemoveRow(index)}
            style={{ color: "red" }}
          />
        ),
      },
    ];
    const handleRemoveRow = (index: any) => {
      const users = form.getFieldValue("users");
      if (users.length > 1) {
        users.splice(index, 1);
        form.setFieldsValue({ users });
      }
    };

    return (
      <>
        <Form.List name="users">
          {(fields, { add, remove }) => (
            <Flex vertical gap={10}>
              <Table
                dataSource={fields}
                columns={columns}
                pagination={false}
                rowKey="key"
                bordered
              />
              <Form.Item
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <Button
                  type="primary"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  ghost
                >
                  add user
                </Button>
              </Form.Item>
            </Flex>
          )}
        </Form.List>
      </>
    );
  };

  const steps = [
    {
      title: "Settings",
      content: <SettingPage timezones={timezones} />,
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
    setInitialData([...initialData,])
    // try {
    //   const orgId = localStorage.getItem("orgId");
    //   //settings

    //   const { data: updatedOrgData } = await supabase
    //     .from("Organisation")
    //     .update({
    //       startOfWorkWeek: values.startOfWorkWeek,
    //       timeZone: values.timeZone,
    //       workweek: values.workWeek,
    //     })
    //     .eq("orgId", orgId);

    //   //leaveType

    //   const { data: existingLeaveTypes } = await supabase
    //     .from("LeaveType")
    //     .select("*")
    //     .eq("orgId", orgId);
    //   if (!existingLeaveTypes || existingLeaveTypes.length === 0) {
    //     const leaveTypesToInsert = [
    //       { name: "paidOfLeave", orgId },
    //       { name: "sickLeave", orgId },
    //     ];
    //     await supabase.from("LeaveType").insert(leaveTypesToInsert);
    //   }
    //   //leavePolicy
    //   const { data: leavePolicy, error } = await supabase
    //     .from("LeavePolicy")
    //     .select("*")
    //     .eq("orgId", orgId);

    //   if (existingLeaveTypes !== null && leavePolicy?.length === 0) {
    //     const leavePolicyToUpsert = [
    //       {
    //         leaveTypeId: existingLeaveTypes[0].leaveTypeId,
    //         unlimited: values.paidOfUnlimited,
    //         maxLeaves: values.paidOfMaxleave,
    //         accurals: values.paidOfAccruals,
    //         rollOver: values.paidOfUnUsedLeave,
    //         orgId: existingLeaveTypes[0].orgId,
    //         autoApprove: values.paidOfAutoApprove,
    //       },
    //       {
    //         leaveTypeId: existingLeaveTypes[1].leaveTypeId,
    //         unlimited: values.sickUnlimited,
    //         maxLeaves: values.sickMaxleave,
    //         accurals: values.sickAccruals,
    //         rollOver: values.sickUnUsedLeave,
    //         orgId: existingLeaveTypes[1].orgId,
    //         autoApprove: values.sickAutoApprove,
    //       },
    //     ];

    //     const { data, error } = await supabase
    //       .from("LeavePolicy")
    //       .upsert(leavePolicyToUpsert);
    //     if (data) {
    //       console.log("inserted data successfully");
    //     } else {
    //       console.log(error);
    //     }
    //   }
    //   const { data: existingHolidaysData } = await supabase
    //     .from("Holiday")
    //     .select("*")
    //     .eq("orgId", orgId);
    //   if (!existingHolidaysData || existingHolidaysData.length == 0) {
    //     const holidaysToInsert = holidays.map((holiday: any) => ({
    //       name: holiday.name,
    //       date: holiday.date,
    //       isRecurring: holiday.isRecurring,
    //       orgId,
    //     }));
    //     const { data, error } = await supabase
    //       .from("Holiday")
    //       .insert(holidaysToInsert);
    //     if (data) {
    //       console.log("holidays list inserted successfully");
    //     } else {
    //       console.log(error);
    //     }

    //     //notification
    //   }
    //   const { data: updatedNotificationData } = await supabase
    //     .from("Organisation")
    //     .update({
    //       notificationDailySummary: values.dailySummary,
    //       notificationLeaveChanged: values.leaveChanged,
    //       notificationToWhom: values.sendNtf[0],
    //       notificationWeeklySummary: values.weeklySummary,
    //     })
    //     .eq("orgId", orgId);
    //   //inviter users
    //    const teamId=localStorage.getItem("teamId")
    //   const usersData=values.map((user:any)=>({
    //     isManager:user.isManager,
    //     name:user.name,
    //     email:user.email,
    //     accruedLeave:0,
    //     userLeave:0,
    //     teamId:teamId
    //   }))
    //   console.log(usersData,values)
    //   const {data:userData,error:userError}=await supabase
    //   .from("User")
    //   .insert([])

    // } catch (error) {
    //   console.error(error);
    // }
    try {
      // updating organisation
      const orgId = localStorage.getItem("orgId");
      let paidOfLeaveTypeId:any
      let sickOfLeaveTypeId:any
      if (current == 1) {
        const { data: updatedOrgData } = await supabase
          .from("Organisation")
          .update({
            startOfWorkWeek: values.startOfWorkWeek,
            timeZone: values.timeZone,
            workweek: values.workWeek,
          })
          .eq("orgId", orgId);

        //inserting leave type
        const { data: leaveTypeData, error } = await supabase
          .from("LeaveType")
          .select("*")
          .eq("orgId", orgId);

        if (leaveTypeData?.length === 0) {
          const { data, error } = await supabase.from("LeaveType").insert([
            { name: "paidOfLeave", orgId: orgId },
            { name: "sickLeave", orgId: orgId },
          ]).select();

          if(data){
            localStorage.setItem("paidOfLeaveTypeId",data[0].leaveTypeId)
            localStorage.setItem("sickOfLeaveTypeId",data[1].leaveTypeId)
          }
        
        }
      }else if(current==2){
        const paidOfLeaveTypeId=localStorage.getItem("paidOfLeaveTypeId")
        const sickOfLeaveTypeId=localStorage.getItem("paidOfLeaveTypeId")
        const leavePolicyData = [
                 {
                   leaveTypeId: paidOfLeaveTypeId,
                   unlimited: values.paidOfUnlimited,
                   maxLeaves: values.paidOfMaxleave,
                   accurals: values.paidOfAccruals,
                   rollOver: values.paidOfRollOver,
                   orgId: orgId,
                   autoApprove: values.paidOfAutoApprove,
                   accuralFrequency:values.paidOfAccrualFrequency,
                   accrueOn:values.paidOfAccruedOn,
                   rollOverLimit:values.paidOfRollOverEachYearDays,
                   rollOverExpiry:values.paidOfRollOverMonth

                  

                 },
                 {
                   leaveTypeId: sickOfLeaveTypeId,
                   unlimited: values.sickUnlimited,
                   maxLeaves: values.sickMaxleave,
                   accurals: values.sickAccruals,
                   rollOver: values.sickUnUsedLeave,
                   orgId: orgId,
                   autoApprove: values.sickAutoApprove,
                   accuralFrequency:values.sickOfAccrualFrequency,
                   accrueOn:values.sickOfAccruedOn,
                   rollOverLimit:values.sickOfRollOverEachYearDays,
                   rollOverExpiry:values.sickOfRollOverMonth

                 },
               ];

               //inserting leavePolicy data 
               const {data,error}=await supabase 
               .from("LeavePolicy")
               .select("*")
               .eq("leaveTypeId",paidOfLeaveTypeId)

               if(!data){
                const {data,error}=await supabase 
                .from("leavePolicy")
                .insert(leavePolicyData)
                .select()

                
               }
               

        
      }

     





    } catch (error) {
      console.log(error);
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
          users: [],
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

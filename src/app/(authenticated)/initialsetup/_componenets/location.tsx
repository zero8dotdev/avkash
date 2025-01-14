"use client";
import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Row,
  Select,
  Steps,
  Table,
} from "antd";
import {
  DeleteOutlined,
  LeftOutlined,
  SmileOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { fetchPublicHolidays } from "@/app/_actions";
import { Card } from "antd";
import { useRouter } from "next/navigation";
import TopSteps from "../_componenets/steps";
import {
  fetchHolidaysData,
  fetchTeamGeneralData,
  insertHolidays,
  updateInitialsetupState,
  updateLocation,
} from "../_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import useSWR from "swr";

export interface holidaysList {
  key: string;
  name: string;
  date: string;
  isRecurring: boolean;
  isCustom: boolean;
}

interface props {
  holidaysList: holidaysList[];
  updateCountryCode: (data: string) => void;
  update: (values: any) => void;
  countryCode: any;
}


const Location = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countryCode, setCountryCode] = useState<string>();
  const [holidaysList, setHolidaysList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const moment = require("moment");
  const router = useRouter();
  const {
    state: { orgId, userId, teamId },
  } = useApplicationContext();

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const holidays = await fetchPublicHolidays(countryCode);
        const holidayData = holidays.map((each: any) => ({
          key: each.id,
          name: each.name,
          date: moment(each.date).format("DD MMM YYYY"),
          isRecurring: true,
          isCustom: false,
        }));
        setHolidaysList(holidayData);
      } catch (error) {
        console.error("Failed to fetch holidays", error);
      }
    };

    fetchHolidays();
  }, [countryCode, moment]);

    const fetcherTeam = async (teamId: string) => {
      const team = teamId.split("*")[1];
      const data = await fetchTeamGeneralData(team);
      return data;
    };

    const { data: teamData, error: teamError, mutate: teamMutate } = useSWR(
      `teamGeneral*${teamId}`,
      fetcherTeam,{onSuccess:()=>{
        setCountryCode(teamData.location)
      }}
    );

    // Fetch holidays data based on country code from team data
    const fetcherHolidays = async (teamId: string) => {
      const countryCode = teamId.split("*")[1];
      const org = teamId.split("*")[2];
      const data = await fetchHolidaysData(org,countryCode);
      return data;
    };

    const {
      data: holidaysData,
      error: holidaysError,
      mutate: holidaysMutate,
    } = useSWR(
      teamData ? `holidays*${teamData.location}*${orgId}` : null,
      fetcherHolidays, {onSuccess: (data)=>{
        setHolidaysList(data);
      }}
    );


  const handleDelete = (key: string) => {
    const updatedHolidays = holidaysList.filter(
      (holiday) => holiday.key !== key
    );
    setHolidaysList(updatedHolidays);
  };

  const handlenext = async () => {
    try {
      // Update team settings
      setLoading(true);
      const data = await insertHolidays(
        orgId,
        holidaysList,
        userId,
        countryCode
      );
      if (!data) {
        // Handle failure to update team settings
        throw new Error("Failed to update team holidays");
      }

      await updateLocation(orgId, [countryCode], "org");
      await updateLocation(teamId, countryCode, "team");

      // Update initial setup state
      const status = await updateInitialsetupState(orgId, "4");
      if (status) {
        // Navigate to the next page if update is successful
        router.push(
          new URL(
            "/initialsetup/notifications",
            window?.location.origin
          ).toString()
        );
      } else {
        // Handle failure to update initial setup state
        throw new Error("Failed to update initial setup state");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 10000);
    }
  };

  const handlePrevious = () => {
    router.push(
      new URL("/initialsetup/leave-policy", window?.location.origin).toString()
    );
  };
  const handleIsRecurringChange = (isChecked: boolean, rowData: any) => {
    const updatedHolidays = holidaysList.map((holiday) =>
      holiday.key === rowData.key ? { ...holiday, isRecurring: isChecked } : holiday
    );
    setHolidaysList(updatedHolidays);
  };
  

  const [form] = Form.useForm();

  const locations = [
    {
      countryCode: "IN",
      countryName: "India",
    },
    {
      countryCode: "DE",
      countryName: "Germany",
    },
    {
      countryCode: "GB",
      countryName: "United Kingdom",
    },
    {
      countryCode: "US",
      countryName: "United States",
    },
    {
      countryCode: "NL",
      countryName: "Netherlands",
    },
  ];

  // holidays sorting based on date
  const dataSource = holidaysList.map((each) => ({
    ...each,
    date: moment(each.date).format("DD MMM YYYY"), // Format date here
  }));

  dataSource.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );


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
      render: (date: string) => moment(date).format("DD MMM YYYY"), // Format date here
    },
    {
      title: "Recurring",
      dataIndex: "isRecurring",
      key: "isRecurring",
      render: (r: any, rowData: any) => (
        <Checkbox
          defaultChecked={rowData.isRecurring}
          onChange={(e) => handleIsRecurringChange(e.target.checked, rowData)}
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
    <Row
      style={{
        padding: "50px 50px 180px 20px",
        height: "100%",
      }}
    >
      <TopSteps position={3} />
      <List loading={loading} style={{ width: "100%" }}>
        <Col span={16} push={4}>
          <Card
            style={{
              margin: "25px 0px 25px 0px",
              minHeight: "300px",
              overflow: "auto",
            }}
          >
            <Row gutter={[16, 16]} style={{ marginTop: "0px" }}>
              <Col span={4}>
                <Select
                  showSearch
                  style={{ width: "300px" }}
                  onChange={(code) => setCountryCode(code)}
                  value={countryCode || ""} // Default to "IN" if countryCode is undefined
                  options={locations.map((each: any) => ({
                    label: each.countryName,
                    value: each.countryCode,
                  }))}
                />
              </Col>
              <Col span={24}>
                <Table
                  columns={columns}
                  dataSource={holidaysList}
                  pagination={false}
                  bordered
                  size="small"
                />
              </Col>
              <Button onClick={() => setIsModalOpen(true)} type="primary" ghost>
                Add Custom Holidays
              </Button>
              <Modal
                title="Add New Holiday"
                open={isModalOpen}
                closable={false}
                footer={
                  <Flex justify="space-between">
                    {/* onClick={() => setIsModalOpen(false)} */}
                    <Button onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      key="submit"
                      type="primary"
                      onClick={() => form.submit()}
                    >
                      Save
                    </Button>
                  </Flex>
                }
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={(values) => {
                    const { name, date, isRecurring } = values;
                    const newHoliday = {
                      key: moment(date).toISOString(), // Unique identifier
                      name,
                      date: moment(date).format("DD MMM YYYY"),
                      isRecurring,
                      isCustom: true,
                    };

                    setHolidaysList((prev) => [...prev, newHoliday]);
                    setIsModalOpen(false);
                    form.resetFields();
                  }}
                >
                  {" "}
                  <Form.Item
                    name="name"
                    label="Holiday Name"
                    rules={[
                      { required: true, message: "Please enter holiday name" },
                    ]}
                  >
                    <Input placeholder="Name" />
                  </Form.Item>
                  <Form.Item
                    name="date"
                    label="Holiday Date"
                    rules={[
                      { required: true, message: "Please select a date!" },
                    ]}
                  >
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item
                    label="Recurring"
                    name="isRecurring"
                    initialValue={true}
                  >
                    <Checkbox defaultChecked />
                  </Form.Item>
                </Form>
              </Modal>
            </Row>
          </Card>
          <Flex justify="space-between">
            <Button danger icon={<LeftOutlined />} onClick={handlePrevious}>
              Previous
            </Button>
            <Form.Item>
              <Button type="primary" onClick={handlenext}>
                Next
              </Button>
            </Form.Item>
          </Flex>
        </Col>
      </List>
    </Row>
  );
};

export default Location;

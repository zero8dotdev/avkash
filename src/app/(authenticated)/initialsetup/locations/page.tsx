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
  Modal,
  Row,
  Select,
  Table,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { fetchPublicHolidays } from "@/app/_actions";

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
const LocationPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countryCode, setCountryCode] = useState<string>("IN");
  const [holidaysList, setHolidaysList] = useState<any[]>([]);

  const moment = require("moment");

  // delete holiday function

  const handleDelete = (key: string) => {
    const updatedHolidays = holidaysList.filter(
      (holiday) => holiday.key !== key
    );
    setHolidaysList(updatedHolidays);
  };

  // onChange isRecuring

  const handleIsRecurringChange = (isChecked: boolean, rowData: any) => {
    const updatedHolidays: holidaysList[] = [];
    for (const holiday of holidaysList) {
      if (holiday.key === rowData.key) {
        updatedHolidays.push({ ...holiday, isRecurring: isChecked });
      } else {
        updatedHolidays.push(holiday);
      }
    }
    setHolidaysList(updatedHolidays);
  };

  // onChange for country code

  const [form] = Form.useForm();
  // const handleAddCustomForm = (values: any) => {
  //   const { name, date, isRecurring } = values;
  //   const newHoliday = {
  //     key: values.date,
  //     name: name,
  //     date: moment(date).format("DD MMM YYYY"),
  //     isRecurring: isRecurring,
  //     isCustom: true,
  //   };

  //   const updatedHolidays = [...holidaysList, newHoliday];
  //   update(updatedHolidays);

  //   setIsModalOpen(false);
  //   form.resetFields();
  // };

  // locations list

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
  const dataSource = holidaysList.map((each) => {
    return {
      ...each,
      date: moment(new Date(each.date)).format("DD MMM YYYY"),
    };
  });

  dataSource.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const holidays = await fetchPublicHolidays(countryCode);
        const holidayData = holidays.map((each: any) => ({
          key: each.id,
          name: each.name,
          date: moment(each.date).toISOString(),
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
    <Row gutter={[16, 16]} style={{ marginTop: "0px" }}>
      <Col span={4}>
        <Select
          showSearch
          style={{ width: "300px" }}
          onChange={(code) => setCountryCode(code)}
          defaultValue={countryCode}
          // defaultValue={countryCode}
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
      {/* <Button onClick={() => setIsModalOpen(true)} type="primary" ghost>
        Add Custom Holidays
      </Button> */}
      <Modal
        title="Add New Holiday"
        open={isModalOpen}
        closable={false}
        footer={
          <Flex justify="space-between">
            {/* onClick={() => setIsModalOpen(false)} */}
            <Button>Cancel</Button>
            <Button key="submit" type="primary" onClick={() => form.submit()}>
              Save
            </Button>
          </Flex>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Holiday Name"
            rules={[{ required: true, message: "Please enter holiday name" }]}
          >
            <Input placeholder="Name" />
          </Form.Item>
          <Form.Item
            name="date"
            label="Holiday Date"
            rules={[{ required: true, message: "Please select a date!" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Recurring" name="isRecurring" initialValue={true}>
            <Checkbox defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

export default LocationPage;

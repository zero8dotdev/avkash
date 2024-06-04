import { useEffect, useState } from "react";
import { countries } from "countries-list";
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Table,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import axios from "axios";

interface holidaysList {
  key: string;
  name: string;
  date: string;
  isRecurring: boolean;
}

const LocationPage = () => {
  const [holidays, setHolidays] = useState<holidaysList[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("IN");
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      <Button onClick={() => setIsModalOpen(true)} type="primary">
        Add Custom Holidays
      </Button>
      <Modal
        title="Basic Modal"
        open={isModalOpen}
        onOk={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
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

export default LocationPage;

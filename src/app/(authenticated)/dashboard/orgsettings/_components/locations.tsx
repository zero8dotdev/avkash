import { useState } from "react";
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
import { fetchPublicHolidays } from "../_actions";

export interface holidaysList {
  key: string;
  name: string;
  date: string;
  isRecurring: boolean;
  isCustom: boolean;
}
interface props {
  holidaysList: holidaysList[];
  locationMode: string | null;
  updateCountryCode: (data: string) => void;
  update: (values: any) => void;
  countryCode: any;
  availableLocations?: { countryCode: string; countryName: string }[];
}

const LocationPage: React.FC<props> = ({
  updateCountryCode,
  holidaysList,
  update,
  countryCode,
  availableLocations, // New prop
  locationMode,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const moment = require("moment");

  // delete holiday function
  const handleDelete = (key: string) => {
    const updatedHolidays = holidaysList.filter(
      (holiday) => holiday.key !== key
    );
    update(updatedHolidays);
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
    update(updatedHolidays);
  };

  // onChange for country code
  const handleCountryChange = async (code: string) => {
    updateCountryCode(code);
    try {
      const holidays = await fetchPublicHolidays(code);
      const transformedHolidays = holidays.map((holiday: any) => ({
        key: holiday.id,
        name: holiday.name,
        date: moment(holiday.date).toISOString(),
        isRecurring: true,
        isCustom: false,
      }));
      update(transformedHolidays);
    } catch (error) {
      console.error("Error fetching public holidays:", error);
    }
  };

  const [form] = Form.useForm();

  // adding new holiday
  const handleAddCustomForm = (values: any) => {
    const { name, date, isRecurring } = values;
    // Ensure the date is formatted as desired
    const formattedDate = moment(date).toISOString();

    const newHoliday = {
      key: formattedDate, // Use the ISO string as the key
      name: name,
      date: moment(date.toDate()).format("DD MMM YYYY"), // Display format
      isRecurring: isRecurring,
      isCustom: true,
    };

    const updatedHolidays = [...holidaysList, newHoliday];
    update(updatedHolidays);
    setIsModalOpen(false);
    form.resetFields();
  };

  // locations list
  const defaultLocations = [
    { countryCode: "IN", countryName: "India" },
    { countryCode: "DE", countryName: "Germany" },
    { countryCode: "GB", countryName: "United Kingdom" },
    { countryCode: "US", countryName: "United States" },
    { countryCode: "NL", countryName: "Netherlands" },
  ];

  const locationsToUse = availableLocations || defaultLocations;

  // holidays sorting based on date
  const dataSource = holidaysList.map((each) => ({
    ...each,
    date: moment(new Date(each.date)).format("DD MMM YYYY"),
  }));

  dataSource.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Date", dataIndex: "date", key: "date" },
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
          onClick={() => handleDelete(rowData.key)}
        />
      ),
    },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginTop: "0px" }}>
      {locationMode === "create" && (
        <Col span={4}>
          <Select
            showSearch
            style={{ width: "300px" }}
            onChange={handleCountryChange}
            value={countryCode || undefined} // Empty if not set
            placeholder="Select a country"
            options={locationsToUse.map((each: any) => ({
              label: each.countryName,
              value: each.countryCode,
            }))}
          />
        </Col>
      )}
      <Col span={24}>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: 500, y: 400 }}
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
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button key="submit" type="primary" onClick={() => form.submit()}>
              Save
            </Button>
          </Flex>
        }
      >
        <Form onFinish={handleAddCustomForm} form={form} layout="vertical">
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
            rules={[
              { required: true, message: "Please select a date!" },
              {
                validator: (_, value) => {
                  const date = moment(new Date(value)).format("DD MMM YYYY");
                  if (!value) {
                    return Promise.reject(new Error("Please select a date!"));
                  }
                  const isDateTaken = holidaysList.some((holiday) =>
                    moment(holiday.date).isSame(date, "day")
                  );

                  if (isDateTaken) {
                    return Promise.reject(
                      new Error("This holiday date already exists.")
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
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

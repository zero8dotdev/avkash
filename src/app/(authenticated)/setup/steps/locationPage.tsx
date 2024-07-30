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
import { format, parse } from 'date-fns';
export interface holidaysList {
  key: string,
  name: string,
  date: string,
  isRecurring: boolean,
  isCustom: boolean,
}

interface props {
  holidaysList:holidaysList[]
  updateCountryCode: (data:string) => void;
  update: (values:any) => void;
}
const LocationPage: React.FC<props> = ({updateCountryCode,holidaysList,update}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = (key: string) => {
    const updatedHolidays = holidaysList.filter((holiday) => holiday.key !== key);
    update(updatedHolidays);
  };

  const handleCheckboxChange = (isChecked: boolean, rowData: any) => {
    const updatedHolidays:holidaysList[] = [];
    for (const holiday of holidaysList) {
      if (holiday.key === rowData.key) {
        updatedHolidays.push({ ...holiday, isRecurring: isChecked });
      } else {
        updatedHolidays.push(holiday);
      }
    }
    update(updatedHolidays);
   };

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

 
  const handleCountryChange = async (code: any) => {
    updateCountryCode(code);
  };

  const handleAddCustomForm = (values:any) => {
    console.log(values)

    const { name, date, isRecurring } = values;
    const newHoliday = {
      key:holidaysList.length +1,
      name: name,
      date: date,
      isRecurring: isRecurring,
      isCustom: true,
    };

    const updatedHolidays = [...holidaysList, newHoliday];
    update(updatedHolidays);
    setIsModalOpen(false);
  };

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
      countryCode: "Us",
      countryName: "United States",
    },
    {
      countryCode: "NL",
      countryName: "Netherlands",
    },
  ];

  const [form] = Form.useForm();
  holidaysList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const moment = require('moment');
  const dataSource=holidaysList.map((each)=>{
    const {date}=each
    const d= moment(date).format("DD MMM YYYY")


   return {
    ...each,
   date:d
   }
  })

console.log(dataSource)
  return (
    <Row gutter={[16, 16]}>
      <Col span={4}>
        <Select
          showSearch
          style={{ width: "300px", marginTop: "20px" }}
          onChange={handleCountryChange}
          defaultValue="IN"
          options={locations.map((each: any) => ({
            label: each.countryName,
            value: each.countryCode,
          }))}
        />
      </Col>
      <Col span={24}>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: 500, y: 400 }}
        />
      </Col>
      <Button onClick={() => setIsModalOpen(true)} type="primary">
        Add Custom Holidays
      </Button>
      <Modal
        title="Add New Holiday"
        open={isModalOpen}
        closable={false}
        footer={
          <Flex justify="space-between">
            <Button  onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button key="submit" type="primary" onClick={()=>form.submit()}>
              Save
            </Button>
          </Flex>
        }
      >
        <Form onFinish={handleAddCustomForm} form={form} layout="vertical">
          <Form.Item name="name" label="Holiday Name" rules={[{ required: true, message: 'Please enter holiday name' }]}>
            <Input placeholder="Name" />
          </Form.Item>
          <Form.Item name="date" label="Holiday Date" rules={[{ required: true, message: 'Please select a date!' }]}>
            <DatePicker  style={{width:'100%'}}/>
          </Form.Item>
          <Form.Item label="Recurring" name="isRecurring" initialValue={true}>
            <Checkbox checked />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

export default LocationPage;

"use client";
import { fetchPublicHolidays } from "@/app/_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Table,
} from "antd";
import React, { useEffect, useState } from "react";
const Page = () => {
  const [segmentValue, setSegmentValue] = useState<string | number>("active");
  const [selectVisibility, setSelectVisibility] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<any>("IN");
  const [tableData, setTableData] = useState<any>();
  const [modal, setModal] = useState(false);
  const data = [
    {
      name: "India",
    },
  ];
  const { state: appState } = useApplicationContext();
  const { orgId } = appState;
  const fetchHolidays = async (selectedCountry: any) => {
    const holidays = await fetchPublicHolidays(selectedCountry);
    const updatedHolidays = holidays.map((each) => {
      return {
        id:each.id,
        name: each.name,
        date: each.date,
        recurring: true,
      };
    });
    setTableData(updatedHolidays);
  };
  
  useEffect(() => {
    fetchHolidays(selectedCountry);
  }, [selectedCountry]);

  const rowDelect = (rowData: any) => {
    setTableData(tableData.filter((each: any) => each.id != rowData.id));
  };

  const handleAddCustomForm = (values: any) => {
    const { name, date,recurring } = values;
    console.log(recurring,'recurring')
    const newHoliday = {
      id: tableData.length + 1,
      name: name,
      date: date.format("YYYY-MM-DD"),
     recurring:recurring
    };

    console.log(newHoliday)

    const updatedHolidays = [...tableData, newHoliday].sort((a, b) => {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
});
    setTableData(updatedHolidays);
    setModal(false);
  };
  const [form]=Form.useForm();
  return (
    <Row gutter={8}>
      <Col span={24}>
        <Segmented
          value={segmentValue}
          onChange={setSegmentValue}
          options={[
            {
              label: "active",
              value: "active",
              icon: <CheckCircleTwoTone />,
            },
            {
              label: "inactive",
              value: "inactive",
              icon: <CloseCircleTwoTone />,
            },
          ]}
        />
        <Flex vertical>
          {segmentValue === "active" ? (
            <Space direction="vertical">
              <List
                style={{ marginTop: "12px" }}
                bordered
                itemLayout="horizontal"
                dataSource={data}
                renderItem={(item, index) => {
                  return (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          key="edit"
                          // onClick={() => {
                          //   setActiveItem(item);
                          // }}
                        >
                          Edit
                        </Button>,
                        <Button type="link" danger key="disable">
                          Disable
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta avatar={<Avatar />} title={item.name} />
                    </List.Item>
                  );
                }}
              />
              <Button onClick={() => setSelectVisibility(!selectVisibility)}>
                Add new Location
              </Button>
              {selectVisibility && (
                <Flex vertical gap={12}>
                  <Select
                    style={{ width: "120px" }}
                    defaultValue={selectedCountry}
                    onChange={(value) => setSelectedCountry(value)}
                  >
                    <Select.Option value="IN">India</Select.Option>
                    <Select.Option value="DE">Germany</Select.Option>
                    <Select.Option value="US">US</Select.Option>
                    <Select.Option value="NL">Netherlands</Select.Option>
                    <Select.Option value="GB">UK</Select.Option>
                  </Select>
                  <Table
                   sortDirections={["ascend"]}
                    columns={[
                      {
                        key: "name",
                        title: "Name",
                        dataIndex: "name",
                      },
                      {
                        key: "date",
                        title: "Date",
                        dataIndex: "date",
                      },
                      {
                        title: "Recurring",
                        dataIndex: "recurring",
                        key: "isRecurring",
                        render: (r: any, rowData: any) => (
                          <Checkbox
                            checked={rowData.recurring}
                            onChange={(e) => {
                              const newTableData = tableData.map((item: any) =>
                                item.id === rowData.id ? { ...item, recurring: e.target.checked } : item
                              );
                              setTableData(newTableData);
                            }}
                          />
                        ),
                      },
                      {
                        title: "Action",
                        key: "action",
                        render: (rowData: any) => (
                          <Popconfirm
                            title="Sure to delete?"
                            onConfirm={() => rowDelect(rowData)}
                          >
                            <Button type="link" icon={<DeleteOutlined />} />
                          </Popconfirm>
                        ),
                      },
                    ]}
                    dataSource={tableData}
                    pagination={false}
                    scroll={{ y: 240 }}
                  />
                  <Button
                    style={{ width: "160px" }}
                    type="primary"
                    onClick={() => setModal(true)}
                  >
                    Add Custome Holiday
                  </Button>
                  <Space style={{ display: "flex", justifyContent: "end" }}>
                    <Button type="primary" danger onClick={()=>console.log(tableData)}>
                      Save
                    </Button>
                  </Space>
                </Flex>
              )}
            </Space>
          ) : null}
        </Flex>
        <Modal
          title="Add custom holiday"
          open={modal}
          onOk={() => setModal(false)}
          onCancel={() => setModal(false)}
          footer={null}
          afterClose={()=>{form.resetFields()}}
        >
          <Form onFinish={handleAddCustomForm} form={form}>
            <Form.Item name="name" label="Holiday Name">
              <Input placeholder="Name" />
            </Form.Item>
            <Form.Item name="date" label="Holiday Date">
              <DatePicker />
            </Form.Item>
            <Form.Item name="recurring" label="isRecurring" initialValue={true}>
              <Checkbox defaultChecked/>
            </Form.Item>
            <Form.Item style={{textAlign:'end'}} >
              <Button type="primary" htmlType="submit" >
                Add Holiday
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Col>
    </Row>
  );
};
export default Page;

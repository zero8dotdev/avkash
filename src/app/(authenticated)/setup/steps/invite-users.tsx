import React, { useEffect } from "react";
import { Form, Input, Button, Table, Card } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

interface props {
  inviteUsersData: any[];
  setInviteUsersData: (data: any) => void;
}

const InviteUsers: React.FC<props> = ({
  inviteUsersData,
  setInviteUsersData,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({ fields: inviteUsersData });
  }, [inviteUsersData, form]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (v: any, r: any, index: any) => (
        <Form.Item
          name={[index, "name"]}
          rules={[{ required: true, message: "Please enter a name" }]}
        >
          <Input placeholder="Name" />
        </Form.Item>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      render: (v: any, r: any, index: any) => (
        <Form.Item
          name={[index, "email"]}
          rules={[
            { required: true, message: "Please enter an email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="Email" />
        </Form.Item>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (v: any, r: any, index: any) => (
        <MinusCircleOutlined onClick={() => removeField(index)} />
      ),
    },
  ];
  const addField = () => {
    const fields = form.getFieldValue("fields") || [];
    form.setFieldsValue({
      fields: [...fields, { name: "", email: "" }],
    });
  };
  const removeField = (index: any) => {
    const fields = form.getFieldValue("fields") || [];
    const updatedFields = fields.filter((j: any, i: any) => i !== index);
    form.setFieldsValue({ fields: updatedFields });
    setInviteUsersData(updatedFields);
  };
  const onValuesChange = (a: any, allValues: any) => {
    setInviteUsersData(allValues.fields);
  };
  return (
    <Form
      form={form}
      onValuesChange={onValuesChange}
      initialValues={{ fields: inviteUsersData }}
    >
      <Form.List name="fields">
        {(fields, { add, remove }) => (
          <Card>
            <Table
              dataSource={fields}
              columns={columns}
              rowKey="key"
              pagination={false}
            />
            <Form.Item>
              <Button
                type="dashed"
                onClick={addField}
                block
                icon={<PlusOutlined />}
              >
                Add Field
              </Button>
            </Form.Item>
          </Card>
        )}
      </Form.List>
    </Form>
  );
};
export default InviteUsers;

import { updateLeaveType } from "@/app/_actions";
import {
  Avatar,
  Button,
  Checkbox,
  ColorPicker,
  Form,
  Input,
  Modal,
} from "antd";
import { useEffect } from "react";

interface LeaveType {
  // define the leave type here as modeled in the backend
  name: string;
  isActive: boolean;
  color: string;
  leaveTypeId: string;
}

const LeaveTypeEdit = ({
  item,
  onCancel = () => {},
}: {
  item: LeaveType | undefined;
  onCancel: Function;
}) => {
  const visible = !!item;

  console.log(item);

  const onFinish = async (values: any) => {
    const data = await updateLeaveType(values, item?.leaveTypeId);
    if (data) {
      console.log("leave type updated successfully");
    } else {
      console.log("something went wrong");
    }
  };
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && item) {
      form.setFieldsValue({
        name: item.name,
        color: item.color,
        emoji: "https://api.dicebear.com/7.x/miniavs/svg?seed=8",
      });
    }
  }, [visible, item, form]);

  const handleCancel = () => {
    onCancel();
  };

  return visible ? (
    <Modal
      open={true}
      title={`Edit ${item.name} Leave Type`}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          Save
        </Button>,
      ]}
      closable={false}
    >
      <Form onFinish={onFinish} form={form}>
        <Form.Item label="Leave Type name" name="name">
          <Input />
        </Form.Item>
        <Form.Item label="Leave Color" name="color">
          <ColorPicker
            onChange={(_, hex) => form.setFieldValue("color", hex)}
          />
        </Form.Item>
        <Form.Item label="Leave Type Emoji" name="emoji">
          <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=8" />
        </Form.Item>
        <Form.Item label="Enabel in Temas">
          <Checkbox />
        </Form.Item>
      </Form>
    </Modal>
  ) : (
    false
  );
};

export default LeaveTypeEdit;

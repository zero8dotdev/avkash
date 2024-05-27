import { CheckCircleOutlined, CloseSquareOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  ColorPicker,
  Flex,
  Form,
  Input,
  Modal,
  Space,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const LeaveTypesSettings = () => {
  const [teamsData, setTeamData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [leaveTypeData, setLeaveTypeData] = useState<any[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState<any>("k");

  const [form] = Form.useForm();
  const fetchLeaveTypeData = async () => {
    try {
      const { data, error } = await supabase
        .from("LeaveType")
        .select("*")
        .eq("orgId", "01bf568b-12a3-4bae-966b-36409729ab10");
      if (data) {
        setLeaveTypeData(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("Team")
        .select("*")
        .eq("orgId", "01bf568b-12a3-4bae-966b-36409729ab10");

      if (data) {
        setTeamData(data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchData();
    fetchLeaveTypeData();
  }, []);

  const handleEditLeaveType = (name: any) => {
    setIsModalOpen(true);
    setSelectedLeaveType(name);
    console.log(name);
  };
  const handleDisableLeaveType = (leaveType: any) => {
    setSelectedLeaveType(leaveType);
    setIsDisableModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsDisableModalOpen(false);
  };
  const handleOk = () => {
    setIsModalOpen(false);
    form.submit();
  };

  const onFinish = (values: any) => {
    console.log(values);
  };

  return (
    <Card title="Leave Types" className="w-5/12">
      <Space size={12}>
        <Button icon={<CheckCircleOutlined style={{ color: "green" }} />}>
          Active
        </Button>
        <Button icon={<CloseSquareOutlined style={{ color: "red" }} />}>
          In Active
        </Button>
      </Space>
      {leaveTypeData.map((each) => {
        return (
          <Card key={each.leaveTypeId}>
            <Flex justify="space-between">
              <Space>
                <div
                  style={{
                    backgroundColor: each.color === null ? "green" : "red",
                    borderRadius: "50%",
                    height: "25px",
                    width: "25px",
                  }}
                />

                <Typography.Title level={5} className="mt-2">
                  {each.name}
                </Typography.Title>
              </Space>
              <Space>
                <Button onClick={() => handleEditLeaveType(each)}>Edit</Button>
                <Button>Disable</Button>
              </Space>
            </Flex>

            <Modal
              open={isModalOpen}
              title="Edit Leave Type"
              onCancel={handleCancel}
              onOk={handleOk}
            >
              {selectedLeaveType && (
                <Form name={each.name} onFinish={onFinish} form={form}>
                  <Form.Item label="Leave Type Name" name="name">
                    <Input value={selectedLeaveType.name} />
                  </Form.Item>
                  <Form.Item
                    label="Leave Color"
                    name="color"
                    initialValue={"#000"}
                  >
                    <ColorPicker />
                  </Form.Item>
                  <Form.Item
                    label="Enable in teams"
                    name="teamsEnable"
                    valuePropName="checked"
                    initialValue={false}
                  >
                    <Checkbox />
                  </Form.Item>
                </Form>
              )}
            </Modal>
            <Modal
              open={isDisableModalOpen}
              title="Disable Leave Type"
              onCancel={handleCancel}
            >
              {selectedLeaveType && (
                <Typography>
                  Are you sure you want to disable leave type
                  {selectedLeaveType.name}
                </Typography>
              )}
            </Modal>
          </Card>
        );
      })}
    </Card>
  );
};

export default LeaveTypesSettings;

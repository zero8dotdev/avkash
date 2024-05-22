import {
  CheckCircleOutlined,
  CloseSquareOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Form, Input, Modal, Space, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const LeaveTypesSettings = () => {
  const [teamsData, setTeamData] = useState<any[]>([]);
  const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);
  const [isSickModalOpen, setIsSickModalOpen] = useState(false);
  const [isUnpaidModalOpen, setIsUnpaidModalOpen] = useState(false);
  const [isPaidEditModalOpen, setIsPaidEditModalOpen] = useState(false);
  const [isSickEditModalOpen, setIsSickEditModalOpen] = useState(false);
  const [isUnpaidEditModalOpen, setIsUnpaidEditModalOpen] = useState(false);

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
  }, []);

  const handlePaidShowModal = () => {
    setIsPaidModalOpen(true);
  };
  const handleSickShowModal = () => {
    setIsSickModalOpen(true);
  };
  const handleUnpaidShowModal = () => {
    setIsUnpaidModalOpen(true);
  };
  const handleCancel = () => {
    setIsPaidModalOpen(false);
    setIsSickModalOpen(false);
    setIsUnpaidModalOpen(false);
  };

  const handlePaidEditShowModal = () => {
    setIsPaidEditModalOpen(true);
  };
  const handleSickEditShowModal = () => {
    setIsSickEditModalOpen(true);
  };
  const handleUnpaidEditShowModal = () => {
    setIsUnpaidEditModalOpen(true);
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
      <Card>
        <Flex className="p-4 justify-between" gap={5}>
          <Space>
            <div className="bg-blue-900 rounded-full w-6 h-6" />
            <Typography.Title level={5} className="mt-2">
              Paid time Of
            </Typography.Title>
          </Space>
          <Space>
            <Button className="bg-pink-500 text-pink-50" onClick={handlePaidEditShowModal}>Edit</Button>
            <Button
              className="bg-pink-500 text-pink-50"
              onClick={handlePaidShowModal}
            >
              Disable
            </Button>
          </Space>
        </Flex>
        <Modal open={isPaidEditModalOpen} title="Edit Leave Type">
           <Form>
            <Form.Item label="Leave">
            <Input/>
            </Form.Item>

           </Form>


        </Modal>
        <Modal
          title="Are you sure you want ot disable Paid time off leave type?"
          open={isPaidModalOpen}
          onCancel={handleCancel}
        >
          <Typography.Paragraph>
            The following teams will be affected if you disable Paid time of
            leave type. Are you sure?
          </Typography.Paragraph>
          {teamsData.map((each) => {
            return (
              <>
                <h1>{each.name}</h1>
              </>
            );
          })}

        </Modal>
      </Card>
      <Card>
        <Flex className="p-4 justify-between" gap={5}>
          <Space>
            <div className="bg-yellow-500 rounded-full w-6 h-6" />
            <Typography.Title level={5} className="mt-2">
              Sick
            </Typography.Title>
          </Space>

          <Space>
            <Button className="bg-pink-500 text-pink-50" onClick={handleSickEditShowModal}>Edit</Button>
            <Button
              className="bg-pink-500 text-pink-50"
              onClick={handleSickShowModal}
            >
              Disable
            </Button>
          </Space>
        </Flex>
        <Modal
          title="Are you sure you want ot disable sick leave type?"
          open={isSickModalOpen}
          onCancel={handleCancel}
        >
          <Typography.Paragraph>
            The following teams will be affected if you disable Paid time of
            leave type. Are you sure?
          </Typography.Paragraph>
          {teamsData.map((each) => {
            return (
              <>
                <h1>{each.name}</h1>
              </>
            );
          })}
        </Modal>
      </Card>
      <Card>
        <Flex className="p-4 flex-row justify-between" gap={5}>
          <Space>
            <div className="bg-red-500 rounded-full w-6 h-6" />
            <Typography.Title level={5} className="mt-2">
              Unpaid
            </Typography.Title>
          </Space>

          <Space>
            <Button className="bg-pink-500 text-pink-50" onClick={handleUnpaidEditShowModal}>Edit</Button>
            <Button
              className="bg-pink-500 text-pink-50"
              onClick={handleUnpaidShowModal}
            >
              Disable
            </Button>
          </Space>
        </Flex>
        <Modal
          title="Are you sure you want to disable Unpaid leave type?"
          open={isUnpaidModalOpen}
          onCancel={handleCancel}
        >
          <Typography.Paragraph>
            The following teams will be affected if you disable Unpaid leave
            type. Are you sure?
          </Typography.Paragraph>
          {teamsData.map((each) => (
            <h1 key={each.id}>{each.name}</h1>
          ))}
        </Modal>
      </Card>
    </Card>
  );
};

export default LeaveTypesSettings;

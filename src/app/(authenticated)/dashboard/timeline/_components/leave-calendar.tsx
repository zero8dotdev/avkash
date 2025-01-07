"use client";

// import { Scheduler } from "@aldabil/react-scheduler";
import { useCallback, useEffect, useState } from "react";
import { Scheduler } from "@bitnoi.se/react-scheduler";
import { getUsersList } from "@/app/_components/header/_components/actions";
import { useApplicationContext } from "@/app/_context/appContext";
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Drawer,
  Flex,
  Form,
  List,
  Radio,
  Space,
  Typography,
} from "antd";
import { CalendarOutlined, CloseOutlined } from "@ant-design/icons";
import { fetchLeaveTypes } from "@/app/_actions";
import TextArea from "antd/es/input/TextArea";

export default function LeaveCalendar({
  team,
  changeView,
}: {
  team: string | undefined;
  changeView: 0 | 1 | 2;
}) {
  ``;
  const [range, setRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [usersList, setUsersList] = useState<any>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [leaveTypes, setLeaveTypes] = useState<any>([]);
  const [type, setType] = useState<any>(null);

  const values = {
    peopleCount: 15,
    projectsPerYear: 5,
    yearsCovered: 0,
    startDate: undefined,
    maxRecordsPerPage: 50,
    isFullscreen: true,
  };

  const {
    state: { orgId, userId, teamId },
  } = useApplicationContext();

  const handleRangeChange = useCallback((range: any) => {
    setRange(range);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      if (team) {
        const res = await getUsersList(team);
        console.log(res);
        setUsersList(res);
      } else {
        console.log("fetch all organisation users (all team users)");
      }
      const res = await fetchLeaveTypes(orgId);
      setLeaveTypes(res);
    };
    fetchData();
  }, [team, orgId]);

  console.log("leaveTypes", leaveTypes);

  const Data = usersList.map((e: any) => {
    return {
      id: e.userId,
      label: {
        icon: "https://picsum.photos/24",
        title: e.name,
        subtitle: e.role,
      },
      data: [
        {
          id: e.userId,
          startDate: "2024-12-19",
          endDate: "2024-12-30",
          occupancy: 20535,
          bgColor: "rgb(249, 169, 115)",
        },
      ],
    };
  });

  return (
    <div
      style={{
        margin: "20px 0px 20px 0px",
        position: "relative",
        width: "100%",
        height: "500px",
      }}
    >
      <Scheduler
        onItemClick={(data: any) =>
          setSelectedUser(usersList.find((e: any) => e.userId === data.id))
        }
        key={changeView}
        startDate={
          values.startDate
            ? new Date(values.startDate).toISOString()
            : undefined
        }
        onRangeChange={handleRangeChange}
        data={Data}
        isLoading={false}
        config={{
          zoom: changeView,
          filterButtonState: -1,
          maxRecordsPerPage: 10,
          showThemeToggle: false,
          defaultTheme: "light",
        }}
      />
      <Drawer
        open={selectedUser !== null}
        title={
          <Flex gap={12}>
            <Avatar
              size={34}
              style={{ marginTop: "5px", backgroundColor: "#E85A4F" }}
            >
              {selectedUser?.name[0]}
            </Avatar>
            <Flex vertical>
              <Typography.Text strong style={{ margin: "0px", padding: "0px" }}>
                {" "}
                {selectedUser?.name}
              </Typography.Text>
              <a
                style={{
                  fontSize: "12px",
                  textDecoration: "underline",
                  color: "#E85A4F",
                }}
              >
                user profile
              </a>
            </Flex>
          </Flex>
        }
        closable={false}
        autoFocus={false}
        extra={<CloseOutlined onClick={() => setSelectedUser(null)} />}
      >
        <Card
          title="   "
          styles={{
            header: {
              backgroundColor: "#E85A4F",
            },
          }}
        >
          <Space size={10}>
            <CalendarOutlined />
            <Typography.Text strong>Create new {type} Leave</Typography.Text>
          </Space>
          <Flex vertical style={{ marginTop: "10px" }} gap={5}>
            <Typography.Text type="secondary">on behalf of:</Typography.Text>
            <Typography.Text strong>{selectedUser?.name}</Typography.Text>
            <Typography.Text type="secondary">
              {selectedUser?.email}
            </Typography.Text>
          </Flex>
          <Form layout="vertical" onFinish={(e) => console.log(e)}>
            <Form.Item name="leavetype" label="Leave Type">
              <Radio.Group
                onChange={(event) => setType(event.target.value)}
                style={{ width: "100%" }}
              >
                <List
                  bordered
                  dataSource={leaveTypes}
                  renderItem={(item: any) => (
                    <List.Item>
                      <Radio value={item.name}>{item.name}</Radio>
                    </List.Item>
                  )}
                />
              </Radio.Group>
            </Form.Item>
            <Form.Item label="Requested dates" name="dates">
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                format="DD MMM YYYY"
              />
            </Form.Item>
            <Form.Item name="reason" label="Leave request notes">
              <TextArea placeholder="Leave request notes adn description..." />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Drawer>
    </div>
  );
}

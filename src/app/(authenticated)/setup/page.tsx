"use client";

import { Button, Card, Col, Row, Steps, Flex, Space } from "antd";
import { useState } from "react";
import Setting from "./steps/setting";
import LocationPage from "./steps/locationPage";
import NotificationPage from "./steps/notificationPage";
import LeavePolicyPage from "./steps/leavePolicy";
import InviteUsers from "./steps/inviteUsers";

export default function SetupPage() {
  const [current, setCurrent] = useState(0);

  const [settingsData, setSettingsData] = useState({
    startOfWorkWeek: "MONDAY",
    workweek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    timeZone: "Asia/Kolkata",
  });

  const [inviteUsersData, setInviteUsersData] = useState<any[]>([]);
  const [leavePoliciesData, setLeavePoliciesData] = useState([
    {
      name: "paidOf leave",
      isActive: true,
      accurals: true,
      maxLeaves: 10,
      autoApprove: false,
      rollover: false,
      color: "#fff",
      unlimited: true,
    },
    {
      name: "sick leave",
      isActive: true,
      accurals: true,
      maxLeaves: 10,
      autoApprove: false,
      rollover: false,
      color: "#fff",
      unlimited: true,
    },
  ]);
  const [holidaysList, setHolidaysList] = useState<any[]>();
  const [notificatinData, setNotificationData] = useState(
    {
      leaveChange: false,
      dailySummary: false,
      weeklySummary: false,
      sendNtf: ["OWNER"],
    },
  );

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const Done = async () => {};

  const steps = [
    {
      title: "Settings",
      content: (
        <Card>
          <Setting
            {...settingsData}
            update={(values) => setSettingsData({ ...values })}
          />
        </Card>
      ),
    },
    {
      title: "Leave Policy",
      content: (
        <LeavePolicyPage
          leavePoliciesData={leavePoliciesData}
          setLeavePoliciesData={setLeavePoliciesData}
        />
      ),
    },
    {
      title: "Locations",
      content: <LocationPage setHolidaysList={setHolidaysList} />,
    },
    {
      title: "Notifications",
      content: (
        <NotificationPage
        {...notificatinData}
        update={(values)=>setNotificationData({...values})}
        />
      ),
    },
    {
      title: "Invite Users",
      content: (
        <InviteUsers
          inviteUsersData={inviteUsersData}
          setInviteUsersData={setInviteUsersData}
        />
      ),
    },
  ];
  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  return (
    <Row gutter={8} style={{ padding: "64px" }}>
      <Col span={24}>
        <Steps current={current} items={items} />
      </Col>
      <Col span={24} style={{ paddingTop: "32px" }}>
        <Col push={4} span={16}>
          <div>{steps[current].content}</div>
        </Col>
      </Col>
      <Col span={24} style={{ paddingTop: "16px" }}>
        <Col push={4} span={16}>
          <Flex justify="end">
            <Space>
              {current > 0 && <Button onClick={() => prev()}>Previous</Button>}
              {current < steps.length - 1 && (
                <Button onClick={() => next()} type="primary">
                  Next
                </Button>
              )}
              {current === steps.length - 1 && (
                <Button htmlType="submit" onClick={Done} type="primary">
                  Done
                </Button>
              )}
            </Space>
          </Flex>
        </Col>
      </Col>
    </Row>
  );
}

"use client";

import { Button, Col, Row, Steps } from "antd";
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

  const [users, setUsers] = useState<any[]>([]);
  const [leavePolicies, setLeavePolicies] = useState<ILeavePolicyProps[]>([
    {
      name: "Paid Time Off",
      isActive: true,
      accruals: false,
      maxLeaves: 10,
      autoApprove: false,
      rollOver: false,
      unlimited: false,
      accrualFrequency: null,
      accrueOn: null,
      rollOverLimit: null,
      rollOverExpiry: null,
    },
    {
      name: "Sick",
      isActive: true,
      accruals: false,
      maxLeaves: 10,
      autoApprove: false,
      rollOver: false,
      unlimited: false,
      accrualFrequency: null,
      accrueOn: null,
      rollOverLimit: null,
      rollOverExpiry: null,
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
          leavePoliciesData={leavePolicies}
          update={(policies) => {
            setLeavePolicies(policies);
          }}
        />
      ),
    },
    {
      title: "Locations",
      content: (
        <LocationPage
          updateCountryCode={(code: string) => setCountryCode(code)}
          holidaysList={holidaysList}
          update={(values) => setHolidaysList(values)}
        />
      ),
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
        <Card>
          <Users />
        </Card>
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
                <Button
                  htmlType="submit"
                  onClick={onDone}
                  type="primary"
                  loading={loading}
                >
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

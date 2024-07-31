"use client";

import { Button, Card, Col, Row, Steps, Flex, Space } from "antd";
import { useEffect, useRef, useState } from "react";
import Setting from "./steps/setting";
import LocationPage from "./steps/locationPage";
import Notification from "./steps/notification";
import LeavePolicyPage from "./steps/leave-policy";

import { type ILeavePolicyProps } from "../dashboard/settings/_components/leave-policy";
import { Users } from "../dashboard/settings/_components/users";
import { useApplicationContext } from "@/app/_context/appContext";
import {
  completeSetup,
  fetchLeaveTypes,
  fetchPublicHolidays,
} from "@/app/_actions";
const moment = require("moment");

export default function SetupPage() {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const {
    state: { orgId, user, teamId },
    dispatch,
  } = useApplicationContext();

  const [settingsData, setSettingsData] = useState({
    startOfWorkWeek: "MONDAY",
    workweek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    timeZone: "Asia/Kolkata",
  });

  const usersRef = useRef(null);
  const [leavePolicies, setLeavePolicies] = useState<ILeavePolicyProps[]>();

  useEffect(() => {
    (async () => {
      const sampleLeavePolicy = {
        accruals: false,
        maxLeaves: 10,
        autoApprove: false,
        rollOver: false,
        unlimited: false,
        accrualFrequency: null,
        accrueOn: null,
        rollOverLimit: null,
        rollOverExpiry: null,
      };

      const leaveTypes = await fetchLeaveTypes(orgId);
      const leaveTypesArr = leaveTypes?.map(
        ({ name, color, isActive, leaveTypeId }) => ({
          name,
          color,
          isActive,
          leaveTypeId,
          ...sampleLeavePolicy,
        })
      );
      setLeavePolicies(leaveTypesArr);
    })();
  }, [orgId]);

  const [holidaysList, setHolidaysList] = useState<any[]>([]);
  const [notificatinData, setNotificationData] = useState({
    leaveChange: false,
    dailySummary: false,
    weeklySummary: false,
    sendNtf: ["OWNER"],
  });

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const onDone = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const users = usersRef?.current.getUsers();
      const done = await completeSetup(orgId, {
        ...settingsData,
        ...notificatinData,
        leavePolicies: leavePolicies?.map(({ color, name, ...rest }: any) => ({
          ...rest,
        })),
        holidaysList,
        countryCode,
        users,
        teamId,
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const [countryCode, setCountryCode] = useState<string>("IN");
  const fetchHolidays = async (countryCode: string) => {
    const holidays = await fetchPublicHolidays(countryCode);
    const holidayData = holidays.map((each) => ({
      key: each.id,
      name: each.name,
      date: moment(each.date).toISOString(),
      isRecurring: true,
      isCustom: false,
    }));
    setHolidaysList(holidayData);
  };

  useEffect(() => {
    fetchHolidays(countryCode);
  }, [countryCode]);

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
          leavePoliciesData={leavePolicies || []}
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
        <Card>
          <Notification
            {...notificatinData}
            update={(values) => setNotificationData({ ...values })}
          />
        </Card>
      ),
    },
    {
      title: "Invite Users",
      content: (
        <Card>
          <Users ref={usersRef} />
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

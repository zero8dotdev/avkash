"use client";

import { Button, Col, Row, Steps } from "antd";
import { useEffect, useState } from "react";
import Setting from "./steps/setting";
import LocationPage, { holidaysList } from "./steps/locationPage";
import NotificationPage from "./steps/notificationPage";
import LeavePolicyPage from "./steps/leavePolicy";
import InviteUsers from "./steps/inviteUsers";
import { fetchPublicHolidays } from "@/app/_actions";

export default function SetupPage() {
  const [current, setCurrent] = useState(2);
  const [countryCode, setCountryCode] = useState<string>("IN");
  const [settingsData, setSettingsData] = useState({
    startOfWorkWeek: "MONDAY",
    workweek: ["MONDAY", "TUESDAY"],
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
  const [holidaysList, setHolidaysList] = useState<holidaysList[]>([]);
  const [notificatinData, setNotificationData] = useState({
    leaveChange: false,
    dailySummary: false,
    weeklySummary: false,
    sendNtf: ["OWNER"],
  });
  console.log(holidaysList)

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const Done = async () => {};

  const fetchHolidays = async (code: string) => {
    const data = await fetchPublicHolidays(code);
    const newData:any = data.map((each,i) => {
      return {
        key:i,
        name: each.name,
        date: each.date,
        isRecurring: true,
        isCustom: false,
      };
    });
    setHolidaysList(newData);
  };
  useEffect(() => {
    fetchHolidays(countryCode);
  }, [countryCode]);

  const steps = [
    {
      title: "Settings",
      content: (
        <Setting
          {...settingsData}
          update={(values) => setSettingsData({ ...values })}
        />
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
          update={(values) => setNotificationData({ ...values })}
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
        <div>{steps[current].content}</div>
      </Col>
      <Col span={24} style={{ paddingTop: "32px" }}>
        <div>
          {current < steps.length - 1 && (
            <Button
              className="bg-purple-600 mr-3 text-white"
              onClick={() => next()}
            >
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button
              className="bg-purple-600 mr-3 text-white"
              htmlType="submit"
              onClick={Done}
            >
              Done
            </Button>
          )}
          {current > 0 && (
            <Button
              onClick={() => prev()}
              className="bg-purple-600 mr-3 text-white"
            >
              Previous
            </Button>
          )}
        </div>
      </Col>
    </Row>
  );

  // return (
  //   <>
  //     <Steps
  //       current={current}
  //       items={items}
  //       className="border w-3/4"
  //       type="navigation"
  //     />
  //     <Flex vertical className="h-full">
  //       <Flex vertical>
  //         <div className="w-3/4">{steps[current].content}</div>
  //       </Flex>
  //       <div style={{ marginTop: 24 }}>
  //         {current < steps.length - 1 && (
  //           <Button
  //             className="bg-purple-600 mr-3 text-white"
  //             onClick={() => next()}
  //           >
  //             Next
  //           </Button>
  //         )}
  //         {current === steps.length - 1 && (
  //           <Button
  //             className="bg-purple-600 mr-3 text-white"
  //             htmlType="submit"
  //             onClick={Done}
  //           >
  //             Done
  //           </Button>
  //         )}
  //         {current > 0 && (
  //           <Button
  //             onClick={() => prev()}
  //             className="bg-purple-600 mr-3 text-white"
  //           >
  //             Previous
  //           </Button>
  //         )}
  //       </div>
  //     </Flex>
  //   </>
  // );
}

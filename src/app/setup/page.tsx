"use client";
import { Button, Flex, Steps } from "antd";
import moment from "moment-timezone";
import { useEffect, useState } from "react";
import { SettingPage } from "./steps/settings";
import LocationPage from "./steps/locationPage";
import NotificationPage from "./steps/notificationPage";
import LeavePolicyPage from "./steps/leavePolicy";
import InviteUsers from "./steps/inviteUsers";
import { createClient } from "../_utils/supabase/client";

const supabase = createClient();

export default function InitialSettings() {
  const [current, setCurrent] = useState(0);
  const [title, setTitle] = useState("Settings");
  const [timezones, setTimezones] = useState<any[]>([]);
  const [leavePolicyData, setLeavePolicyData] = useState({});

  useEffect(() => {
    const allTimezones = moment.tz.names();
    setTimezones(allTimezones);
  }, []);

  const next = () => {
    setCurrent(current + 1);
    setTitle(steps[current + 1].title);
  };

  const prev = () => {
    setCurrent(current - 1);
    setTitle(steps[current - 1].title);
  };
  const Done = () => {
    console.log("yes iam done");
  };

  const steps = [
    {
      title: "Settings",
      content: <SettingPage timezones={timezones} />,
    },
    {
      title: "Leave Policy",
      content: <LeavePolicyPage />,
    },
    {
      title: "Locations",
      content: <LocationPage />,
    },
    {
      title: "Notifications",
      content: <NotificationPage />,
    },
    {
      title: "Invite Users",
      content: <InviteUsers />,
    },
  ];

  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  return (
    <div className="p-5 bg-white h-screen">
      <Steps
        current={current}
        items={items}
        className="border w-3/4"
        type="navigation"
      />
      <Flex vertical className="h-full">
        <Flex vertical>
          <h1 className="pt-8 pb-8">{title}</h1>
          <div className="w-3/4">{steps[current].content}</div>
        </Flex>

        <div style={{ marginTop: 24 }}>
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
      </Flex>
    </div>
  );
}

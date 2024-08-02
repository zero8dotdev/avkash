"use client";
import { Button, Card, Flex, Space, Steps } from "antd";
import React, { useState } from "react";
import Users from "./steps/users";
import Managers from "./steps/managers";
import Notifications from "../../../../setup/steps/notification";
import { useApplicationContext } from "@/app/_context/appContext";
import { addUsersToNewTeam, createNewTeam } from "@/app/_actions";
import Setting from "@/app/(authenticated)/setup/steps/setting";

const Page = () => {
  const [current, setCurrent] = useState(0);
  const [loader, setLoader] = useState(false);
  const [settingsData, setSettingsData] = useState({
    name: "",
    startOfWorkWeek: "MONDAY",
    workweek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    timeZone: "Asia/Kolkata",
  });
  const [teamUsers, setSTeamUsers] = useState<any[]>([]);
  const [notificatinData, setNotificationData] = useState({
    leaveChange: false,
    dailySummary: false,
    weeklySummary: false,
    sendNtf: ["OWNER"],
  });
  const [managers, SetManagers] = useState<any>(null);
  const steps = [
    {
      title: "Settings",
      content: (
        <Card style={{ width: "60%" }}>
          <Setting
            {...settingsData}
            // @ts-ignore
            update={(values) => setSettingsData({ ...values })}
            isTeamnameVisable={true}
          />
        </Card>
      ),
    },
    {
      title: "Users",
      content: (
        <Card style={{ width: "60%" }}>
          <Users update={(data) => setSTeamUsers(data)} Tusers={teamUsers} />
        </Card>
      ),
    },
    {
      title: "Managers",
      content: (
        <Card style={{ width: "60%" }}>
          <Managers
            users={teamUsers}
            managers={managers}
            update={(data) => SetManagers(data)}
          />
        </Card>
      ),
    },
    {
      title: "Notifications",
      content: (
        <Card style={{ width: "60%" }}>
          <Notifications
            {...notificatinData}
            update={(values) => setNotificationData({ ...values })}
          />
        </Card>
      ),
    },
  ];

  const {
    state: { orgId },
  } = useApplicationContext();
  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  const handleDone = async () => {
    setLoader(true);
    const data = {
      name: settingsData.name,
      isActive: true,
      manager: managers ? managers.userId : null,
      startOfWorkWeek: settingsData.startOfWorkWeek,
      workweek: settingsData.workweek,
      timeZone: settingsData.timeZone,
      notificationLeaveChanged: notificatinData.leaveChange,
      notificationDailySummary: notificatinData.dailySummary,
      notificationWeeklySummary: notificatinData.weeklySummary,
      notificationToWhom: notificatinData.sendNtf[0],
      orgId: orgId,
    };
    const newTeam = await createNewTeam(data, orgId);
    if (newTeam) {
      const addUserToNewTeam = async (user: any) => {
        await addUsersToNewTeam(newTeam[0].teamId, user.userId);
      };
      const data = Promise.all(teamUsers.map((each) => addUserToNewTeam(each)));
      setLoader(false);
    }
  };
  return (
    <Flex vertical style={{ padding: "15px" }} gap={24}>
      <Steps
        current={current}
        items={items}
        style={{
          border: "1px solid  #c3c7c5",
          borderRadius: "50px",
          padding: "15px",
        }}
      />
      <Flex>{steps[current].content}</Flex>
      <Space>
        {current < steps.length - 1 && (
          <Button type="primary" onClick={() => setCurrent(current + 1)}>
            Next
          </Button>
        )}
        {current === steps.length - 1 && (
          <Button type="primary" onClick={() => handleDone()} loading={loader}>
            Done
          </Button>
        )}
        {current > 0 && (
          <Button
            style={{ margin: "0 8px" }}
            onClick={() => setCurrent(current - 1)}
          >
            Previous
          </Button>
        )}
      </Space>
    </Flex>
  );
};

export default Page;

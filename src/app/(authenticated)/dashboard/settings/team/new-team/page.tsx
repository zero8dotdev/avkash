"use client";
import { Button, Flex, Space, Steps } from "antd";
import React, { useEffect, useState } from "react";
import Settings from "./steps/settings";
import LeavePolicies from "./steps/leavePolicy";
import Users from "./steps/users";
import Managers from "./steps/managers";
import Notifications from "./steps/notificationPage";

interface settingProps {
  name:string,
  startOfWorkWeek: string;
  workweek: string[];
  timeZone: string;
}

interface policyProps{
  name:string,
  isActive:boolean,
  accurals:boolean,
  maxLeaves:number,
  autoApprove:boolean,
  rollover:boolean,
  color:string,
  unlimited:boolean
}

const Page = () => {
  const [current, setCurrent] = useState(0);
  const [settings, setSettings] = useState<settingProps[]>([
    {
      name:'',
      startOfWorkWeek: "MONDAY",
      workweek: ["MONDAY", "TUESDAY"],
      timeZone: "Asia/Kolkata",
    },
  ]);
  const [leavePolicies, setLeavePolicies] = useState<policyProps[]>([
    {
      name: "Paid Time Off",
      isActive: true,
      accurals: true,
      maxLeaves: 10,
      autoApprove: false,
      rollover: false,
      color: "#fff",
      unlimited: true,
    },
    {
      name: "Sick leave",
      isActive: true,
      accurals: true,
      maxLeaves: 10,
      autoApprove: false,
      rollover: false,
      color: "#fff",
      unlimited: true,
    },
  ]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [notification,
    setNotification]=useState<any>([
    {
      leaveChange: false,
      dailySummary: false,
      weeklySummary: false,
      sendNtf: ["OWNER"],
    },

  ])
 
  const steps = [
    {
      title: "Settings",
      content: <Settings settings={settings} setSettings={setSettings} />,
    },
    {
      title: "Leave Policy",
      content: <LeavePolicies leavePolicies={leavePolicies} setLeavePolicies={setLeavePolicies}/>,
    },
    
    {
      title: "Users",
      content: <Users selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} />,
    },
    {
      title: "Managers",
      content: <Managers users={selectedUsers}/>,
    },
    {
      title: "Notifications",
      content: <Notifications />,
    },
  ];
  const items = steps.map((item) => ({ key: item.title, title: item.title }));
console.log(selectedUsers,"selected")
  return (
    <Flex vertical style={{ padding: "15px"}} gap={24} >
      <Steps
        current={current}
        items={items}
        style={{
          border: "1px solid  #c3c7c5",
          borderRadius: "50px",
          padding: "15px",
        }}
      />
      <Flex >{steps[current].content}</Flex>
      <Space>
        {current < steps.length - 1 && (
          <Button type="primary" onClick={() => setCurrent(current + 1)}>
            Next
          </Button>
        )}
        {current === steps.length - 1 && (
          <Button
            type="primary"
            onClick={() => console.log("succesfully completed")}
          >
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

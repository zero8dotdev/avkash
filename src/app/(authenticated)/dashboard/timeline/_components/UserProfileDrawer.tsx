import { Avatar, Button, Drawer, Flex, Tabs, Typography } from "antd";
import React from "react";
import type { TabsProps } from "antd";
import LeaveReport from "./userDrawerTabs/leaveReport";
import AllLeavesDrawer from "./allLeavesDrawer";
import LeaveRequest from "./userDrawerTabs/leaveRequest";
import Activity from "./userDrawerTabs/activity";
import Settings from "./userDrawerTabs/settings";
import Overrides from "./userDrawerTabs/overrides";

interface UserProfileDrawerProps {
  userProfileDrawer: boolean;
  setUserProfileDrawer: any;
  user: any;
}

const items: TabsProps["items"] = [
  {
    key: "1",
    label: "Leave Report",
    children: <LeaveReport />,
  },
  {
    key: "2",
    label: "Leave Requests",
    children: <LeaveRequest />,
  },
  {
    key: "3",
    label: "Activity",
    children: <Activity />,
  },
  {
    key: "4",
    label: "Overrides",
    children: <Overrides/>,
  },
  {
    key: "5",
    label: "Settings",
    children: <Settings/>,
  },
];

const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({
  userProfileDrawer,
  setUserProfileDrawer,
  user,
}) => {
  return (
    <Drawer
      open={userProfileDrawer}
      width="100%"
      closable={false}
      footer={
        <Flex>
          <Button onClick={()=>setUserProfileDrawer(false)} type="primary" ghost>Cancel</Button>
        </Flex>
      }
    >
      <Flex gap={18}>
        <Avatar style={{ backgroundColor: "#f56a00" }}>
          {user ? user.name[0].toUpperCase() : null}
        </Avatar>

        <Typography.Title level={4} style={{ margin: "0px" }}>
          {user ? user.name : null}
        </Typography.Title>
      </Flex>
      <Tabs items={items} size="large" />
    </Drawer>
  );
};

export default UserProfileDrawer;

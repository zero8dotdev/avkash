import {
  CalendarFilled,
  EnvironmentFilled,
  NotificationFilled,
  NotificationOutlined,
  SettingFilled,
  SettingOutlined,
  SlackCircleFilled,
  SmileOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Col, Steps } from "antd";
import React from "react";

interface TopStepsProps {
  position: number;
}

const TopSteps: React.FC<TopStepsProps> = ({ position }) => {
  return (
    <Steps
      current={position}
      items={[
        {
          title: "Connect to Slack",
          icon: <SlackCircleFilled />,
        },
        {
          title: "Settings",
          icon: <SettingFilled />,
        },
        {
          title: "Leave Policy",
          icon: <CalendarFilled />,
        },
        {
          title: "Locations",
          icon: <EnvironmentFilled />,
        },
        {
          title: "Notifications",
          icon: <NotificationFilled />,
        },
        {
          title: "Invite Users",
          icon: <UserOutlined />,
        },
      ]}
    />
  );
};

export default TopSteps;

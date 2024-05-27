"use client";
import React from "react";
import { Row, Tabs, Col, Card } from "antd";
import GeneralSettings from "./GeneralSettings";
import BillingSettings from "./BillingSettings";
import LeaveTypesSettings from "./LeaveTypesSettings";
import TeamsSettings from "./TeamsSettings";
import LocationsSettings from "./LocationsSettings";
import LeaveTypes from "./leave-types/page";

import type { TabsProps } from "antd";

const onChange = (key: string) => {
  console.log(key);
};

const TabWrapper = ({
  title,
  children,
}: {
  title: String;
  children: React.ReactElement;
}) => {
  return (
    <Col span={18}>
      <Card title={title}>{children}</Card>;
    </Col>
  );
};

const items: TabsProps["items"] = [
  {
    key: "1",
    label: "General",
    children: (
      <TabWrapper title={"General"}>
        <GeneralSettings />
      </TabWrapper>
    ),
  },
  {
    key: "2",
    label: "Billing",
    children: (
      <TabWrapper title="Billing">
        <BillingSettings />
      </TabWrapper>
    ),
  },
  {
    key: "3",
    label: "Leave Types",
    children: (
      <TabWrapper title="Leave Types">
        <LeaveTypes />
      </TabWrapper>
    ),
  },
  {
    key: "4",
    label: "Teams",
    children: (
      <TabWrapper title="Teams">
        <TeamsSettings />
      </TabWrapper>
    ),
  },
  {
    key: "5",
    label: "Locations",
    children: (
      <TabWrapper title="Locations">
        <LocationsSettings />
      </TabWrapper>
    ),
  },
];

const SettingsPage: React.FC = () => {
  return (
    <Row gutter={8} style={{ paddingTop: "24px" }}>
      <Col span={20} push={4}>
        <Tabs
          tabPosition="left"
          defaultActiveKey="1"
          items={items}
          onChange={onChange}
        />
      </Col>
    </Row>
  );
};

export default SettingsPage;

"use client";
import React from "react";
import { Row, Tabs, Col, Card,Grid,Breakpoint } from "antd";
import LeaveTypes from "./leave-types/page";

import type { TabsProps } from "antd";
import General from "./general/page";
import Billing from "./billing/page";
import Location from "./location/page";
import Team from "./team/page";
import LeavePolicies from "./leave-policy/page";

const { useBreakpoint } = Grid;

const onChange = (key: string) => {
};

const TabWrapper = ({
  title,
  children,
}: {
  title: String;
  children: React.ReactElement;
}) => {
const screens = useBreakpoint();
  return (
     <Col xs={24} md={20} lg={18}>
      <Card title={title}>{children}</Card>
    </Col>
  );
};

const items: TabsProps["items"] =  [
  {
    key: "1",
    label: "General",
    children: (
      <TabWrapper title={"General"}>
        <General />
      </TabWrapper>
    ),
  },
  {
    key: "2",
    label: "Billing",
    children: (
      <TabWrapper title="Billing">
        <Billing />
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
        <Team />
      </TabWrapper>
    ),
  },
  {
    key: "5",
    label: "Locations",
    children: (
      <TabWrapper title="Locations">
        <Location />
      </TabWrapper>
    ),
  },
  {
    key: "6",
    label: "Leave policies",
    children: (
      <TabWrapper title="Leave policies">
        <LeavePolicies />
      </TabWrapper>
    ),
  }
];

const SettingsPage: React.FC = () => {
const screens = useBreakpoint();

  return (
    <Row gutter={{xs:0,lg:8}} >
      <Col xs={24} md={22} lg={20}   push={screens.xs ? 0 : screens.md ? 2 : 4 } className="mx-auto">
        <Tabs
          tabPosition={screens.xs ? 'top' : 'left'}
          defaultActiveKey="1"
          items={items}
          onChange={onChange}
        />
      </Col>
    </Row>
  );
};

export default SettingsPage;

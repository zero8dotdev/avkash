"use client";
import React, { useState } from "react";
import { Tabs } from "antd";
import GeneralSettings from "./GeneralSettings";
import BillingSettings from "./BillingSettings";
import LeaveTypesSettings from "./LeaveTypesSettings";
import TeamsSettings from "./TeamsSettings";
import LocationsSettings from "./LocationsSettings";

import type { TabsProps } from "antd";

const onChange = (key: string) => {
  console.log(key);
};
const items: TabsProps["items"] = [
  {
    key: "1",
    label: "General",
    children: <GeneralSettings />,
  },
  {
    key: "2",
    label: "Billing",
    children: <BillingSettings />,
  },
  {
    key: "3",
    label: "Leave Types",
    children: <LeaveTypesSettings />,
  },
  {
    key: "4",
    label: "Teams",
    children: <TeamsSettings />,
  },
  {
    key: "5",
    label: "Locations",
    children: <LocationsSettings />,
  },
];

const SettingsPage: React.FC = () => {
  return (
    <div className=" bg-white min-h-screen w-screen">
      <Tabs
        defaultActiveKey="1"
        items={items}
        onChange={onChange}
        
        className="w-full p-5"
      />
    </div>
  );
};

export default SettingsPage;

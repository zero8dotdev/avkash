"use client";
import React, { useState } from "react";
import GeneralSettings from "./GeneralSettings";
import BillingSettings from "./BillingSettings";
import LeaveTypesSettings from "./LeaveTypesSettings";
import TeamsSettings from "./TeamsSettings";
import LocationsSettings from "./LocationsSettings";

const SettingsPage: React.FC = () => {
  const tabs = ["General", "Billing", "Leave Types", "Teams", "Locations"];
  const [activeTab, setActiveTab] = useState("General");

  const handleActiveTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col justify-start items-center bg-white min-h-screen">
      <div className="w-[70%] flex">
        <div className="w-1/4">
          <ul>
            {tabs.map((tab) => (
              <li
                key={tab}
                className={
                  activeTab === tab
                    ? "text-red-500"
                    : "text-black font-mono m-1"
                }
              >
                <a href="#" onClick={() => handleActiveTab(tab)}>
                  {tab}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-3/4">
          {activeTab === "General" && <GeneralSettings />}
          {activeTab === "Billing" && <BillingSettings />}
          {activeTab === "Leave Types" && <LeaveTypesSettings />}
          {activeTab === "Teams" && <TeamsSettings />}
          {activeTab === "Locations" && <LocationsSettings />}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

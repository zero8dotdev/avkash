"use client";
import { Button, Flex, Form, Steps } from "antd";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Settings from "./steps/settings";
import LocationPage from "./steps/locationPage";
import NotificationPage from "./steps/notificationPage";
import LeavePolicyPage from "./steps/leavePolicy";
import InviteUsers from "./steps/inviteUsers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);
export default function InitialSettings() {
  const [current, setCurrent] = useState(0);
  const [inviteUsersData, setInviteUsersData] = useState<any[]>([]);
  const [settingsData, setSettingsData] = useState([
    {
      startOfWorkWeek: "MONDAY",
      workweek: ["MONDAY", "TUESDAY"],
      timeZone: "Asia/Kolkata",
    },
  ]);
  const [leavePoliciesData, setLeavePoliciesData] = useState([
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
  ]);
  const [holidaysList, setHolidaysList] = useState<any[]>();
  const [notificatinData, setNotificationData] = useState([
    {
      leaveChange: false,
      dailySummary: false,
      weeklySummary: false,
      sendNtf: ["OWNER"],
    },
  ]);

  const router = useRouter();
  const next = () => {
    setCurrent(current + 1);
  };
  const prev = () => {
    setCurrent(current - 1);
  };
  const Done = async () => {
    const orgId = localStorage.getItem("orgId");
    const teamId = localStorage.getItem("teamId");
    const userId = localStorage.getItem("userId");

    try {
      console.log();
      //settings page
      const { data: updatedOrgData } = await supabase
        .from("Organisation")
        .update(settingsData[0])
        .eq("orgId", orgId);
      //LEAVE POLICY and leave types
      // leave types
      const { data: existingLeaveTypes } = await supabase
        .from("LeaveType")
        .select("*")
        .eq("orgId", orgId);
      if (!existingLeaveTypes || existingLeaveTypes.length === 0) {
        const leaveTypesToInsert = [{ name: "paidOfLeave", orgId }];
        await supabase.from("LeaveType").insert(leaveTypesToInsert);
      }
      //leave policy
      const { data: leavePolicy, error } = await supabase
        .from("LeavePolicy")
        .select("*")
        .eq("orgId", orgId);
      if (existingLeaveTypes !== null && leavePolicy?.length === 0) {
        const leavePolicyToinsert = [
          {
            leaveTypeId: existingLeaveTypes[0].leaveTypeId,
            unlimited: leavePoliciesData[0].unlimited,
            maxLeaves: leavePoliciesData[0].maxLeaves,
            accurals: leavePoliciesData[0].accurals,
            rollOver: leavePoliciesData[0].rollover,
            orgId: orgId,
            autoApprove: leavePoliciesData[0].autoApprove,
          },
        ];
        const { data, error } = await supabase
          .from("LeavePolicy")
          .insert(leavePolicyToinsert);
        if (data) {
          console.log("inserted data successfully");
        } else {
          console.log(error);
        }
      }

      // holidays list
      const { data: existingHolidaysData } = await supabase
        .from("Holiday")
        .select("*")
        .eq("orgId", orgId);
      if (!existingHolidaysData || existingHolidaysData.length == -0) {
        const holidaysToInsert = holidaysList?.map((holiday: any) => ({
          name: holiday.name,
          date: holiday.date,
          isRecurring: holiday.isRecurring,
          orgId,
        }));
        const { data, error } = await supabase
          .from("Holiday")
          .insert(holidaysToInsert);
        if (data) {
          console.log("holidays list inserted successfully");
        } else {
          console.log(error);
        }
      }

      //notifications
      console.log(notificatinData);
      const { data: updatedNotificationData } = await supabase
        .from("Organisation")
        .update({
          notificationDailySummary: notificatinData[0].dailySummary,
          notificationLeaveChanged: notificatinData[0].leaveChange,
          notificationToWhom: notificatinData[0].sendNtf[0],
          notificationWeeklySummary: notificatinData[0].weeklySummary,
        })
        .eq("orgId", orgId);

      //invite users
      console.log(inviteUsersData);
      const usersData = inviteUsersData?.map((user: any) => ({
        name: user.name,
        email: user.email,
        teamId: teamId,
      }));

      const { data } = await supabase.from("User").insert(usersData);

      router.push("/dashboard/timeline");
    } catch (error) {
      console.log(error);
    }
  };
  const steps = [
    {
      title: "Settings",
      content: (
        <Settings
          settingsData={settingsData}
          setSettingsData={setSettingsData}
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
      content: <LocationPage setHolidaysList={setHolidaysList} />,
    },
    {
      title: "Notifications",
      content: (
        <NotificationPage
          notificationData={notificatinData}
          setNotificationData={setNotificationData}
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
    <>
      <Steps
        current={current}
        items={items}
        className="border w-3/4"
        type="navigation"
      />
      <Flex vertical className="h-full">
        <Flex vertical>
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
    </>
  );
}

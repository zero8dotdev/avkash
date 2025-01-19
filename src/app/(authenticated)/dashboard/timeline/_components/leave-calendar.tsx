"use client";

// import { Scheduler } from "@aldabil/react-scheduler";
import { useCallback, useEffect, useState } from "react";
import { Scheduler } from "@elonsteve/calendar";
import { useApplicationContext } from "@/app/_context/appContext";

export default function LeaveCalendar({
  users,
  changeView,
  onChangeUser,
}: {
  users: any[];
  changeView: 0 | 1 | 2;
  onChangeUser: Function;
}) {
  const [range, setRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });

  const values = {
    peopleCount: 15,
    projectsPerYear: 5,
    yearsCovered: 0,
    startDate: undefined,
    maxRecordsPerPage: 50,
    isFullscreen: true,
  };

  const {
    state: { orgId, userId, teamId },
  } = useApplicationContext();

  const handleRangeChange = useCallback((range: any) => {
    setRange(range);
  }, []);
  const Data = users.map((e: any) => {
    return {
      id: e.userId,
      label: {
        icon: e.picture,
        title: e.name,
        subtitle: e.Team.name,
      },
      data: e.Leave.map((leave: any) => ({
        id: leave.leaveId,
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate),
        bgColor: `#${leave.LeaveType.color}`, // Apply the color from the LeaveType
        status: leave.isApproved
      })),
    };
  });

  return (
    <div
      style={{
        margin: "20px 0px 20px 0px",
        position: "relative",
        width: "100%",
        height: "500px",
      }}
    >
      <Scheduler
        onItemClick={(data: any) =>
          onChangeUser(users.find((e: any) => e.userId === data.id))
        }
        key={changeView}
        startDate={
          values.startDate
            ? new Date(values.startDate).toISOString()
            : undefined
        }
        onRangeChange={handleRangeChange}
        data={Data}
        isLoading={false}
        config={{
          zoom: changeView,
          filterButtonState: -1,
          maxRecordsPerPage: 10,
          showThemeToggle: false,
          defaultTheme: "light",
          showTooltip: false,
        }}
      />
    </div>
  );
}

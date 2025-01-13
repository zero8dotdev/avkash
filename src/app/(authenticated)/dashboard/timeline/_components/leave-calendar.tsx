"use client";

// import { Scheduler } from "@aldabil/react-scheduler";
import { useCallback, useEffect, useState } from "react";
import { Scheduler } from "@bitnoi.se/react-scheduler";
import {
  getUsersList,
  getUsersListWithTeam,
} from "@/app/_components/header/_components/actions";
import { useApplicationContext } from "@/app/_context/appContext";
import { fetchAllOrgUsers } from "@/app/_actions";

export default function LeaveCalendar({
  users,
  changeView,
  onChangeUser,
}: {
  users: any[];
  changeView: 0 | 1 | 2;
  onChangeUser: Function;
}) {
  ``;
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
        icon: "https://picsum.photos/24",
        title: e.name,
        subtitle: e.Team.name,
      },
      data: [
        {
          id: e.userId,
          startDate: new Date("2024-12-19"),
          endDate: new Date("2024-12-30"),
          occupancy: 20535,
          bgColor: "rgb(249, 169, 115)",
          title: "Leave",
        },
      ],
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
        }}
      />
    </div>
  );
}

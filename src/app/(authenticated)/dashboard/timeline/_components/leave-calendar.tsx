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
  team,
  changeView,
  onChangeUser,
}: {
  team: string | undefined;
  changeView: 0 | 1 | 2;
  onChangeUser: Function;
}) {
  ``;
  const [range, setRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [usersList, setUsersList] = useState<any>([]);
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
  useEffect(() => {
    const fetchData = async () => {
      if (team) {
        const res = await getUsersListWithTeam(team);
        setUsersList(res);
      } else {
        const res = await fetchAllOrgUsers(orgId, true);
        setUsersList(res);
      }
    };
    fetchData();
  }, [team, orgId]);

  const Data = usersList.map((e: any) => {
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
          startDate: "2024-12-19",
          endDate: "2024-12-30",
          occupancy: 20535,
          bgColor: "rgb(249, 169, 115)",
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
          onChangeUser(usersList.find((e: any) => e.userId === data.id))
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

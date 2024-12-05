"use client";

// import { Scheduler } from "@aldabil/react-scheduler";
import { useCallback, useState } from "react";
import { Scheduler } from "@bitnoi.se/react-scheduler";

export default function LeaveCalendar(props: any) {
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

  const handleRangeChange = useCallback((range: any) => {
    setRange(range);
  }, []);

  const data: any = [
    {
      id: "f6e7c0ce-6ec3-40f6-be37-7de22aaebca5",
      label: {
        icon: "https://picsum.photos/24",
        title: "Yaswanth",
        subtitle: "Vizag",
      },
      data: [
        {
          id: "cf9440e7-281e-4ec5-b87c-86f605673da3",
          startDate: "2024-12-19",
          endDate: "2024-12-30",
          occupancy: 20535,
          // title: "Bicycle inasmuch",
          // subtitle: "AI",
          // description: "compressing Norway hacking Funk whereas",
          bgColor: "rgb(249, 169, 115)",
        },
        {
          id: "cf9440e7-281e-4ec5-b87c-86f605673db2",
          startDate: "2024-12-03",
          endDate: "2024-12-04",
          occupancy: 20535,
          // title: "test1",
          // subtitle: "AI",
          // description: "testing",
          bgColor: "rgb(54, 75, 120)",
        },
        {
          id: "e18454a2-ec98-4081-a241-0638af474459",
          startDate: "2024-12-03",
          endDate: "2024-12-03",
          occupancy: 7491,
          // title: "Bicycle inasmuch",
          // subtitle: "infix",
          // description: "Digitized website Northeast Electric Hyundai",
          bgColor: "rgb(167, 231, 19)",
        },
      ],
    },
  ];
  return (
    <div style={{margin: "10px 10px", position: "relative", width: "100%", height:"60%"}}>
      <Scheduler
        startDate={
          values.startDate
            ? new Date(values.startDate).toISOString()
            : undefined
        }
        onRangeChange={handleRangeChange}
        data={data}
        isLoading={false}
        config={{
          zoom: 0,
          filterButtonState: -1,
          maxRecordsPerPage: 10,
          showThemeToggle: false,
          defaultTheme: "light",
        }}
      />
    </div>
  );
}

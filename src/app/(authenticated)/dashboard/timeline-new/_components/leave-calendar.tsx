"use client";

import { Scheduler } from "@aldabil/react-scheduler";

export default function LeaveCalendar(props: any) {
  return (
    <div
      style={{
        width: "100%",
        border: "1px solid transparent",
        borderRadius: "5px",
        overflow: "hidden",
      }}
    >
      <Scheduler
        height={400}
        view="month"
        // events={formattedLeaves}
        editable={false}
        deletable={true}
        day={null}
        week={null}
        agenda={false}
        alwaysShowAgendaDays={true}
      />
    </div>
  );
}

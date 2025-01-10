// import React, { useState, useEffect, useCallback } from "react";
// import { Modal, Tabs, Typography } from "antd";
// import LeaveReport from "./leave-report";
// import Settings from "./settings";
// import LeaveRequest from "./leave-request";
// import { getLeaves, getLeaveSummaryByUser } from "../_actions";

// const UserModal = ({ selectedUser, update }: { selectedUser: any; update: Function }) => {
//   const [activeTab, setActiveTab] = useState("leave-report"); // Initial active tab
//   const [leaveReportData, setLeaveReportData] = useState<{ key: any; leaveType: any; taken: any; planned: any; total: any; remaining: string | number; available: string | number; }[] | null>(null); // Data for Leave Report
//   const [leaveRequestData, setLeaveRequestData] = useState<{ type: any; startDate: any; endDate: any; leaveRequestNote: any; status: any; color: any; }[] | null>(null); // Data for Leave Requests
//   const [loading, setLoading] = useState(false); // Loading state

//   // Function to fetch Leave Report data
//   const fetchLeaveReportData = useCallback(async () => {
//     setLoading(true);
//     const data = await getLeaveSummaryByUser(selectedUser?.userId); // Replace with actual data fetching function
//     setLeaveReportData(data);
//     setLoading(false);
//   }, [selectedUser?.userId]);

//   // Function to fetch Leave Request data
//   const fetchLeaveRequestData = useCallback(async () => {
//     setLoading(true);
//     const data = await getLeaves(selectedUser?.userId); // Replace with actual data fetching function
//     console.log("LLLsgdfhxcvbbbbbxczvbzxbzxbLLLL",data)
//     setLeaveRequestData(data);
//     setLoading(false);
//   }, [selectedUser?.userId]);

//   // Fetch data when tab changes
//   useEffect(() => {
//     if (activeTab === "leave-report") {
//       fetchLeaveReportData();
//     } else if (activeTab === "leave-requests") {
//       fetchLeaveRequestData();
//     }
//   }, [activeTab, selectedUser, fetchLeaveReportData, fetchLeaveRequestData]); // Run effect when tab or selectedUser changes

//   // Handle tab change
//   const handleTabChange = (key: string) => {
//     setActiveTab(key); // Set active tab to trigger data fetching
//   };

//   return (
//     <Modal
//       open={selectedUser !== null}
//       title={<Typography.Title level={4}>{selectedUser?.name}</Typography.Title>}
//       width={2000}
//       style={{ top: "65px" }}
//       onCancel={() => update()}
//       footer={null}
//       styles={{ body: { height: 800 } }}
//     >
//       <Tabs activeKey={activeTab} onChange={handleTabChange}>
//         <Tabs.TabPane key="leave-report" tab="Leave Report">
//           <LeaveReport user={selectedUser} data={leaveReportData} loading={loading} />
//         </Tabs.TabPane>
//         <Tabs.TabPane key="leave-requests" tab="Leave Requests">
//           <LeaveRequest user={selectedUser} data={leaveRequestData} loading={loading} />
//         </Tabs.TabPane>
//         {/* <Tabs.TabPane key="activity" tab="Activity">
//           <Activity user={selectedUser} data={leaveRequestData} loading={loading} />
//         </Tabs.TabPane>
//         <Tabs.TabPane key="overrides" tab="Overrides">
//           <Overrides user={selectedUser} data={leaveRequestData} loading={loading} />
//         </Tabs.TabPane> */}
//         <Tabs.TabPane key="settings" tab="Settings">
//           <Settings user={selectedUser} />
//         </Tabs.TabPane>
//       </Tabs>
//     </Modal>
//   );
// };

// export default UserModal;

import React, { useState } from "react";
import { Modal, Tabs, Typography } from "antd";
import useSWR from "swr";
import LeaveReport from "./leave-report";
import Settings from "./settings";
import LeaveRequest from "./leave-request";
import { getLeaves, getLeaveSummaryByUser } from "../_actions";

// Define fetcher functions for SWR
const leaveSummaryFetcher = (userId: string) => getLeaveSummaryByUser(userId);
const leaveRequestsFetcher = (userId: string) => getLeaves(userId);

const UserModal = ({
  selectedUser,
  update,
}: {
  selectedUser: any;
  update: Function;
}) => {
  const [activeTab, setActiveTab] = useState("leave-report");

  // SWR hooks for data fetching
  const { data: leaveReportData, isLoading: isLeaveReportLoading } = useSWR(
    // Only fetch when tab is active and we have a userId
    activeTab === "leave-report" && selectedUser?.userId
      ? [`leave-summary-${selectedUser.userId}`, selectedUser.userId]
      : null,
    ([_, userId]) => leaveSummaryFetcher(userId)
  );

  const { data: leaveRequestData, isLoading: isLeaveRequestLoading } = useSWR(
    activeTab === "leave-requests" && selectedUser?.userId
      ? [`leave-requests-${selectedUser.userId}`, selectedUser.userId]
      : null,
    ([_, userId]) => leaveRequestsFetcher(userId)
  );

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // Determine loading state based on active tab
  const isLoading =
    activeTab === "leave-report" ? isLeaveReportLoading : isLeaveRequestLoading;

  return (
    <Modal
      open={selectedUser !== null}
      title={
        <Typography.Title level={4}>{selectedUser?.name}</Typography.Title>
      }
      width={2000}
      style={{ top: "65px" }}
      onCancel={() => {
        setActiveTab("leave-report")
        update();
      }}
      footer={null}
      styles={{ body: { height: 800 } }}
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <Tabs.TabPane key="leave-report" tab="Leave Report">
          <LeaveReport
            user={selectedUser}
            data={leaveReportData}
            loading={isLoading}
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="leave-requests" tab="Leave Requests">
          <LeaveRequest
            user={selectedUser}
            data={leaveRequestData}
            loading={isLoading}
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="settings" tab="Settings">
          <Settings user={selectedUser} />
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};

export default UserModal;

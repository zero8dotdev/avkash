'use client';

import useSWR from 'swr';
import { Tabs, Card } from 'antd';
import { useState, useEffect, useMemo } from 'react';
import { useApplicationContext } from '@/app/_context/appContext';
import LeaveRequest from '../../users/_components/leave-request';
import LeaveReport from '../../users/_components/leave-report';
import { getLeaves, getLeaveSummaryByUser } from '../../users/_actions';
import TodayLeave from './today-leave';
import PlannedLeave from './planned-leave';
import PendingLeave from './pending-leave';

export default function LeavePreview() {
  const { state } = useApplicationContext();
  const { user, role, userId } = state;

  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    if (role && !activeTab) {
      setActiveTab(role === 'USER' ? 'your-requests' : 'today'); // this will update active tab only after role is available
    }
  }, [role, activeTab]);

  // SWR Fetchers
  const { data: leaveRequestData, isLoading: isLeaveRequestLoading } = useSWR(
    activeTab === 'your-requests' && userId
      ? [`leave-requests-${userId}`, userId]
      : null,
    ([_, userId]) => getLeaves(userId)
  );

  const { data: leaveReportData, isLoading: isLeaveReportLoading } = useSWR(
    activeTab === 'your-report' && userId
      ? [`leave-summary-${userId}`, userId]
      : null,
    ([_, userId]) => getLeaveSummaryByUser(userId)
  );

  // Define Tabs
  const userTabs = [
    {
      key: 'your-requests',
      label: 'Your Leave Requests',
      children: (
        <Card>
          <LeaveRequest
            user={user}
            data={leaveRequestData}
            loading={isLeaveRequestLoading}
          />
        </Card>
      ),
    },
    {
      key: 'your-report',
      label: 'Your Report',
      children: (
        <Card>
          <LeaveReport
            user={user}
            data={leaveReportData}
            loading={isLeaveReportLoading}
          />
        </Card>
      ),
    },
  ];

  const managerTabs = [
    {
      key: 'today',
      label: 'Today',
      children: (
        <Card>
          <TodayLeave />
        </Card>
      ),
    },
    {
      key: 'planned',
      label: 'Planned',
      children: (
        <Card>
          <PlannedLeave />
        </Card>
      ),
    },
    {
      key: 'pending',
      label: 'Pending Approval',
      children: (
        <Card>
          <PendingLeave />
        </Card>
      ),
    },
  ];

  return (
    <div className="leave-preview-container">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={role === 'USER' ? userTabs : managerTabs}
        className="custom-tabs"
      />
    </div>
  );
}

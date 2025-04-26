'use client';

import React, { useEffect, useState } from 'react';
import { MdOutlineSick } from 'react-icons/md';
import { FcLeave } from 'react-icons/fc';
import { FaRegCalendarAlt } from 'react-icons/fa';
import { useApplicationContext } from '@/app/_context/appContext';
import { getPlannedLeavesByOrg } from '../_actions';

export default function PlannedLeavesTab() {
  const [plannedLeaves, setPlannedLeaves] = useState<any[]>([]);

  const {
    state: { orgId },
  } = useApplicationContext();

  useEffect(() => {
    const fetchLeaves = async () => {
      if (!orgId) return;
      const leaves = await getPlannedLeavesByOrg(orgId);
      setPlannedLeaves(leaves);
    };
    fetchLeaves();
  }, [orgId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-400';
    }
  };

  const getLeaveIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sick':
        return <span className=" text-xl">🤒</span>;
      case 'paid time off':
        return <span className=" text-xl">🏖️</span>;
      case 'unpaid':
        return <span className="text-xl">📅</span>;
      default:
        return <span className="text-xl">📅</span>;
    }
  };
  return (
    <div className="mt-2">
      {plannedLeaves.length === 0 ? (
        <p className="text-gray-500 font-bold">No Planned Leaves</p>
      ) : (
        plannedLeaves.map((leave) => (
          <div
            key={leave.leaveId}
            className="flex justify-between gap-4 rounded-md shadow-lg align-start p-2 border-l-8 pl-4 mb-1"
            style={{ borderColor: `#${leave?.leaveType?.color ?? '9ca3af'}` }}
          >
            <div className="gap-2">
              <p className="flex gap-2 items-center font-medium">
                {getLeaveIcon(leave?.leaveType?.name)}
                <span>{leave?.user?.name}</span>
              </p>
              <p
                className="text-md font-semibold"
                style={{ color: `#${leave?.leaveType?.color ?? '9ca3af'}` }}
              >
                {leave?.leaveType?.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(leave?.startDate)} - {formatDate(leave?.endDate)} (
                {leave?.workingDays} {leave?.workingDays === 1 ? 'day' : 'days'}
                )
              </p>
              {leave?.reason && (
                <p className="text-sm text-gray-400 italic">
                  Reason: {leave?.reason}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span
                className={`text-sm font-semibold capitalize ${getStatusColor(leave.isApproved)}`}
              >
                {leave?.managerComment} | {leave.isApproved}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

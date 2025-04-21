'use client';

import React, { useEffect, useState } from 'react';
import { MdOutlineSick } from 'react-icons/md';
import { FcLeave } from 'react-icons/fc';
import { FaRegCalendarAlt } from 'react-icons/fa';
import { useApplicationContext } from '@/app/_context/appContext';
import { getTodayLeavesByOrg } from '../_actions';

type TodayLeave = {
  leaveId: string;
  startDate: string;
  endDate: string;
  duration: string;
  reason: string | null;
  createdOn: string;
  user: { userId: string; name: string };
  leaveType: { leaveTypeId: string; name: string; color?: string };
};

export default function TodayTab() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const {
    state: { orgId },
  } = useApplicationContext();

  useEffect(() => {
    const fetchTodayLeaves = async () => {
      try {
        const data = await getTodayLeavesByOrg(orgId);
        setLeaves(data);
      } catch (err) {
        console.error('Error loading today’s leaves:', err);
      }
    };
    fetchTodayLeaves();
  }, [orgId]);
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
    <div className="mt-4">
      {leaves.length === 0 ? (
        <p className="text-gray-500">No leaves today.</p>
      ) : (
        leaves.map((leave) => (
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
                {formatDate(leave?.startDate)} - {formatDate(leave?.endDate)}
              </p>
              {leave.reason && (
                <p className="text-sm text-gray-400 italic">
                  Reason: {leave?.reason}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Format date to readable string
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

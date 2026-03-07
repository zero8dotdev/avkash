'use client';

import React from 'react';
import { CalendarOutlined } from '@ant-design/icons';

const LeaveRequest = ({
  user,
  data,
}: {
  user: any;
  data: any;
  loading: any;
}) => {
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
  return (
    <div>
      {!data || data.length === 0 ? (
        <p className="text-gray-500 text-center">No Leave Requests</p>
      ) : (
        data.map((item: any) => (
          <div
            key={item.id}
            className="flex justify-between gap-4 rounded-md shadow-lg align-start p-2 border-l-8 pl-4 mb-2 "
            style={{ borderColor: `#${item.color}` }}
          >
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between items-center">
                <p className="flex gap-2 items-center font-medium text-gray-700">
                  {getLeaveIcon(item.type)}
                  <span>{item.type}</span>
                </p>
                <span
                  className={`text-sm font-semibold capitalize ${getStatusColor(item.status)}`}
                >
                  {`${item?.managerComment ?? ''} | ${item.status}`}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {formatDate(item.startDate)} - {formatDate(item.endDate)}
              </p>
              {item.leaveRequestNote && (
                <p className="text-sm text-gray-400 italic">
                  Reason: {item.leaveRequestNote}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default LeaveRequest;

// Format date to readable string
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

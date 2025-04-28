'use client';

import React, { useEffect, useState } from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { MdOutlineSick } from 'react-icons/md';
import { FcLeave } from 'react-icons/fc';
import { FaRegCalendarAlt } from 'react-icons/fa';
import { useApplicationContext } from '@/app/_context/appContext';
import { getPendingLeavesByOrg, updateLeaveStatus } from '../_actions';

type Leave = {
  leaveId: string;
  startDate: string;
  endDate: string;
  duration: string;
  shift: string;
  reason: string | null;
  managerComment: string | null;
  workingDays: number | null;
  createdOn: string;
  user: { userId: string; name: string };
  leaveType: { leaveTypeId: string; name: string; color: string };
};

export default function TodayTab() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(
    null
  );
  const [comment, setComment] = useState('');
  const {
    state: { orgId },
  } = useApplicationContext();

  useEffect(() => {
    const fetchLeaves = async () => {
      const pendingLeaves = await getPendingLeavesByOrg(orgId);
      setLeaves(pendingLeaves);
    };
    fetchLeaves();
  }, [orgId]);

  const handleOpenModal = (leave: Leave, type: 'APPROVED' | 'REJECTED') => {
    setSelectedLeave(leave);
    setActionType(type);
    setComment('');
  };

  const handleConfirmAction = async () => {
    if (!selectedLeave || !actionType) return;
    await updateLeaveStatus(selectedLeave.leaveId, actionType, comment);
    setLeaves((prev) =>
      prev.filter((l) => l.leaveId !== selectedLeave.leaveId)
    );
    setSelectedLeave(null);
    setActionType(null);
    setComment('');
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
    <div>
      {leaves.length === 0 ? (
        <p className=" text-gray-500 font-bold mt-2">No Pending Approvals</p>
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
                {formatDate(leave?.startDate)} - {formatDate(leave?.endDate)} (
                {leave?.workingDays} {leave?.workingDays <= 1 ? 'day' : 'days'})
              </p>{' '}
              {leave.reason && (
                <p className="text-sm text-gray-400 italic">
                  Reason: {leave?.reason}
                </p>
              )}
            </div>
            <div className="flex gap-2 items-center mr-4">
              <button
                onClick={() => handleOpenModal(leave, 'APPROVED')}
                className="text-xs border px-2 py-1 border-green-500 text-green-500 rounded hover:bg-green-500 hover:text-white"
              >
                Approve <CheckOutlined />
              </button>
              <button
                onClick={() => handleOpenModal(leave, 'REJECTED')}
                className="text-xs border px-2 py-1 border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white"
              >
                Reject <CloseOutlined />
              </button>
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md w-[90%] max-w-md">
            <h3 className="text-lg font-semibold mb-2">
              {actionType === 'APPROVED' ? 'Approve' : 'Reject'} Leave for{' '}
              {selectedLeave.user.name}
            </h3>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter a comment (optional)"
              className="w-full border rounded-md p-2 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedLeave(null);
                  setActionType(null);
                  setComment('');
                }}
                className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-1 rounded text-white ${
                  actionType === 'APPROVED'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
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

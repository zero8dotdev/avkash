import React, { useEffect, useState } from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

export default function TodayTab() {
  const [approvedLeaves, setApprovedLeaves] = useState<
    { id: string; reason: string; createdOn: string }[]
  >([]);

  useEffect(() => {
    // Simulate fetching approved leaves for today
    const fetchLeaves = async () => {
      const leaves = await getApprovedLeavesForToday(); // Replace with actual API call
      setApprovedLeaves(leaves);
    };
    fetchLeaves();
  }, []);

  return (
    <div className="">
      <div
        key="1"
        className=" flex justify-between gap-4 rounded-sm shadow-lg  align-start p-2 border-l-4 border-blue-500 pl-4 mb-1"
      >
        <div className="gap-2">
          <p className="flex gap-2">
            {' '}
            <p className="">Naman Tripathi </p> |{' '}
            <p className="text-gray-500">Full Day</p>{' '}
          </p>
          <p className="text-md font-semibold text-grey-700">Sick</p>
          <p className="text-sm text-gray-500">11 Sep - 12 Sep</p>
        </div>
        <div className="flex gap-4 items-center mr-4 align-end justify-end text-align-right">
          <button className=" border-2 items-center h-9 px-2 border-green-500 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition ">
            Approve <CheckOutlined />
          </button>
          <button className=" border-2 h-9 px-2 border-red-500 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition ">
            Reject {<CloseOutlined />}{' '}
          </button>
        </div>
      </div>
      <div
        key="1"
        className=" flex justify-between gap-4 rounded-sm shadow-lg  align-start p-2 border-l-4 border-blue-500 pl-4 mb-1"
      >
        <div className="gap-2">
          <p className="flex gap-2">
            {' '}
            <p className="">Naman Tripathi </p> |{' '}
            <p className="text-gray-500">Full Day</p>{' '}
          </p>
          <p className="text-md font-semibold text-grey-700">Sick</p>
          <p className="text-sm text-gray-500">11 Sep - 12 Sep</p>
        </div>
        <div className="flex gap-4 items-center mr-4 align-end justify-end text-align-right">
          <button className=" border-2 items-center h-9 px-2 border-green-500 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition ">
            Approve <CheckOutlined />
          </button>
          <button className=" border-2 h-9 px-2 border-red-500 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition ">
            Reject {<CloseOutlined />}{' '}
          </button>
        </div>
      </div>
    </div>
  );
}

// Dummy function (Replace with API call)
async function getApprovedLeavesForToday() {
  return [
    { id: '1', reason: 'Medical Leave', createdOn: '2025-02-28' },
    { id: '2', reason: 'Personal Work', createdOn: '2025-02-28' },
  ];
}

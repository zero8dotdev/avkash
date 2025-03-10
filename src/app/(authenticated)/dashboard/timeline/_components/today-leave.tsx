import React, { useEffect, useState } from 'react';

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
        className=" rounded-sm shadow-lg  align-start p-2 border-l-4 border-blue-500 pl-4 mb-1"
      >
        <div className="flex gap-2">
          {' '}
          <p className="">Naman Tripathi </p> |{' '}
          <p className="text-gray-500">Full Day</p>{' '}
        </div>
        <p className="text-md font-semibold text-grey-700">Sick</p>
        <p className="text-sm text-gray-500">11 Sep - 12 Sep</p>
      </div>
      <div
        key="2"
        className=" rounded-sm shadow-lg  align-start p-2 border-l-4 border-pink-500 pl-4 mb-1"
      >
        <p>Shahrukh Tripathi</p>
        <p className="text-md font-semibold text-gray-700">Marriage</p>
        <p className="text-sm text-gray-500">12 Sep - 14 Sep</p>
      </div>
      <div
        key="3"
        className=" rounded-sm shadow-lg  align-start p-2 border-l-4 border-pink-500 pl-4 mb-1"
      >
        <p>Batman Tripathi</p>
        <p className="text-md font-semibold text-gray-700">Marriage</p>
        <p className="text-sm text-gray-500">12 Sep - 14 Sep</p>
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

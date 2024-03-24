const TeamSettings = () => {
  return (
    <div className="text-gray-700 flex flex-col justify-start items-start border-x border-y border-gray-400 p-4 rounded-md gap-8">
      <div className="flex flex-col items-start gap-4 w-[100%]">
        <h1 className="font-bold text-black text-2xl">Locations</h1>
        <div className="inline-flex">
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l">
            Acitve
          </button>
          <button className="bg-gray-200 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r">
            InActive
          </button>
        </div>

        <table className="table-auto border-x border-y border-gray-100 shadow-lg shadow-slate-100 rounded-md w-[100%]">
          <thead>
            <tr className="h-10">
              <th className="pl-1"><td>TEAM</td></th>
              <th className=""><td>MANAGER</td></th>
              <th className=""><td>No.Of USERS</td></th>
              <th className=""><td>STATUS</td></th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-10">
              <td className=" pl-1">zero8.dev</td>
              <td className=" ">Ashutosh Tripathi</td>
              <td className=" ">7</td>
              <td className=" ">
                <div className="inline-flex gap-px">
                  <button className="bg-green-300 text-green-800 rounded-full px-2">
                    <small className="px-1">acitve</small>
                  </button>
                  <button className="bg-blue-200 text-blue-900 rounded-full px-2">
                    <small className="px-1">default</small>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button className="text-white bg-red-500 self-end p-1 rounded-lg">
        Add New Team
      </button>
    </div>
  );
};

export default TeamSettings;

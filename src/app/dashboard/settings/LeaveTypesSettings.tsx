const LeaveTypesSettings = () => {
  return (
    <div className="text-gray-700 flex flex-col justify-start items-start border-x border-y border-gray-400 p-4 rounded-md gap-8">
      <div className="flex flex-col items-start gap-4 w-[100%]">
        <h1 className="font-bold text-black text-2xl">Leave Types</h1>
        <div className="inline-flex">
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l">
            Acitve
          </button>
          <button className="bg-gray-200 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r">
            InActive
          </button>
        </div>

        <div className="flex justify-between w-[98%] border-x border-y border-gray-100 px-4 py-4 rounded-lg shadow-md shadow-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <p className="font-bold">Paid time off</p>
          </div>
          <div className="flex gap-2 text-red-500 underline">
            <a href="#">
              <small>Edit</small>
            </a>
            <a href="#">
              <small>disable</small>
            </a>
          </div>
        </div>
        <div className="flex justify-between w-[98%] border-x border-y border-gray-100 px-4 py-4 rounded-lg shadow-md shadow-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-pink-300 rounded-full"></div>
            <p className="font-bold">sick</p>
          </div>
          <div className="flex gap-2 text-red-500 underline">
            <a href="#">
              <small>Edit</small>
            </a>
            <a href="#">
              <small>disable</small>
            </a>
          </div>
        </div>

        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded-md">
          Add Leave Type
        </button>
        <small>To set a leave policy (ie. number of days off), go to the Leave Policy settings under <span className="text-red-500">teams</span> </small>
      </div>
      <button className="text-white bg-red-500 self-end p-1 rounded-lg">
        Save
      </button>
    </div>
  );
};

export default LeaveTypesSettings;

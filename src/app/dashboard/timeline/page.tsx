import UserListItem from "./_components/UserListitem";

export default function Timeline() {
  return (
    <div className="flex flex-col mx-3">
      <div className="flex justify-between alignborder-2 my-2">
        <div>
          <button className="p-4 bg-sky-500 hover:bg-sky-700 mr-2">
            Add Leave
          </button>
          <button className="p-4 bg-white border-rose-400 hover:bg-sky-100 ">
            Navigate to today
          </button>
        </div>
        <div>
          <select className="p-2 p-x-3 cursor-pointer border-sky-500 ">
            <option key="1">Team One</option>
            <option key="2">Team Two</option>
          </select>
        </div>
        <div>
          <button className="p-2 border-2 hover:bg-sky-100 border-sky-300 ">
            Month
          </button>
          <button className="p-2 border-2 hover:bg-sky-100 ">Year</button>
        </div>
      </div>
      <div className="h-96 border-2"></div>
      <div className="h-auto border-2 my-2 flex justify-between align-middle">
        <button className="p-4 bg-sky-500 hover:bg-sky-700 mr-2">
          Add Leave
        </button>
        <a href="#" className="p-2 text-sky-500 border-2">
          Calendar Feed
        </a>
      </div>
      <div className="border-2 min-h-10">
        <div className="flex">
          <div className="p-2 border-b-2 border-sky-500 cursor-pointer mr-1">
            Today
          </div>
          <div className="p-2 border-b-2 border-sky-500 cursor-pointer mr-1">
            Planned
          </div>
          <div className="p-2 border-b-2 border-sky-500 cursor-pointer mr-1">
            Pending Approval
          </div>
        </div>
        <div className="my-3">
          {/* <div className="px-2">There are no leave requests.</div> */}
          <UserListItem />
        </div>
      </div>
    </div>
  );
}

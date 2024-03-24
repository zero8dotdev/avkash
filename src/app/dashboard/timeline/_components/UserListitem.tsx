import Image from "next/image";

export default function UserListItem({
  userName = "",
  userProfilePicture = "",
  leaveType = "",
  leaveStatus = "",
  leaveRange = "",
}) {
  return (
    <div className="hover:bg-slate-200 cursor-pointer transition-colors rounded-md min-h-16 border-2 border-l-sky-500 border-l-4 border-gray-200 flex justify-between items-center px-2">
      <div className="flex space-x-1 items-center">
        <Image
          className="rounded-full"
          width="48"
          height="48"
          src={userProfilePicture}
          alt={userName}
        />
        <span className="">{userName}</span>
      </div>
      <div className="flex flex-col">
        <div>{leaveType}</div>
        <div className="text-gray-500">{leaveRange}</div>
      </div>
      <div className="flex flex-col text-green-500">{leaveStatus}</div>
    </div>
  );
}

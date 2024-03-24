import Image from "next/image";
import React from "react";

interface User {
  name: string;
  role: string;
  team: string;
  leavesNo: number;
  lastLeave: string;
}

interface UserCardProps {
  user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <div className="p-4 border  flex flex-row">
      <Image
        height={48}
        width={48}
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkAQP9TuNF8Haa3dGgNGwG8svris3fZq784g&usqp=CAU"
        className="rounded-full h-12 mr-5"
        alt="User avatar"
      />
      <div className="flex flex-row  w-full justify-between">
        <div className="flex flex-col">
          <h5 className="text-pink-500 font-bold">
            {user.name}{" "}
            <span className="text-sm text-gray-400">({user.role})</span>
          </h5>
          <p className="text-sm text-gray-400">{user.team}</p>
        </div>
        <div className="flex flex-col">
          <h5>{user.leavesNo} paid time off taken in year 2024</h5>
          <p className="text-sm text-gray-400">
            Last leave on {user.lastLeave}
          </p>
        </div>
        <div className="flex flex-col">
          <button className="p-2">&gt;</button>
        </div>
      </div>
    </div>
  );
};

const users: User[] = [
  {
    name: "Ashutosh",
    role: "Owner",
    team: "Zero8.dev",
    leavesNo: 1,
    lastLeave: "Feb 7 2024",
  },
  {
    name: "Kesava",
    role: "User",
    team: "Zero8.dev",
    leavesNo: 2,
    lastLeave: "Feb 1 2024",
  },
  {
    name: "Yashwanth",
    role: "User",
    team: "Zero8.dev",
    leavesNo: 1,
    lastLeave: "Feb 7 2024",
  },
  {
    name: "Gnaneshwar",
    role: "User",
    team: "Zero8.dev",
    leavesNo: 3,
    lastLeave: "Jan 7 2024",
  },
  {
    name: "Rohith",
    role: "User",
    team: "Zero8.dev",
    leavesNo: 1,
    lastLeave: "Jan 7 2024",
  },
  {
    name: "Sri hari",
    role: "User",
    team: "Zero8.dev",
    leavesNo: 5,
    lastLeave: "Feb 7 2024",
  },
  {
    name: "Preeti",
    role: "User",
    team: "Zero8.dev",
    leavesNo: 1,
    lastLeave: "Feb 7 2024",
  },
];

const Users: React.FC = () => {
  return (
    <div className="flex flex-col pr-60 pt-10 pl-60 ">
      <h1 className="font-bold text-2xl">Users</h1>
      <div className=" mt-5 mb-5 flex flex-row justify-between">
        <div className=" flex flex-row p-2  rounded-md">
          <h1 className="flex w-32 p-2 rounded-md mr-6 border h-10">
            All Teams
          </h1>
          <input
            placeholder="Search Users in all teams"
            className="rounded-md p-2 flex border h-10"
          />
        </div>
        <div className="flex flex-row p-2 rounded-md">
          <button className="border  mr-6 p-2 rounded-md h-10">
            Download Report
          </button>
          <button className="bg-blue-300 p-2 rounded-md h-10">
            Invite Users
          </button>
        </div>
      </div>
      <div className="flex flex-col">
        {users.map((user, index) => (
          <UserCard key={index} user={user} />
        ))}
      </div>
    </div>
  );
};

export default Users;

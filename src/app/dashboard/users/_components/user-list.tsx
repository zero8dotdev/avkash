"use client";

import { useApplicationContext } from "@/app/_context/appContext";
import { List } from "antd";

const UserList = ({ users }: { users: any[] }) => {
  const { state } = useApplicationContext();

  console.log("testing context values", state);

  return <List dataSource={users}></List>;
};

export default UserList;

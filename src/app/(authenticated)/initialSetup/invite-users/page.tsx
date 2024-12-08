"use client";
import { Card } from "antd";
import React, { useRef } from "react";
import { Users } from "../../dashboard/settings/_components/users";

const Page = () => {
  const ref = useRef(null);
  return (
    <Card>
      <Users ref={ref} />
    </Card>
  );
};

export default Page;

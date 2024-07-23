import { Avatar, Steps } from "antd";
import React from "react";

const Activity = () => {
  return (
    <>
      <Steps
        direction="vertical"
        items={[
          {
            title: "Step 1",
            description: "this is keshav",
            icon: <Avatar style={{ backgroundColor: "#f56a00" }}>DK</Avatar>,
            status: 'finish',
          },
          {
            title: "Step 2",
            description: "this is keshav",
            icon: <Avatar style={{ backgroundColor: "#f56a00" }}>DK</Avatar>,
            status: 'finish',
          },
          {
            title: "Step 3",
            description: "this is keshav",
            icon: <Avatar style={{ backgroundColor: "#f56a00" }}>DK</Avatar>,
            status: 'finish',
          },
          {
            title: "Step 1",
            description: "this is keshav",
            icon: <Avatar style={{ backgroundColor: "#f56a00" }}>DK</Avatar>,
            status: 'finish',
          },
          {
            title: "Step 2",
            description: "this is keshav",
            icon: <Avatar style={{ backgroundColor: "#f56a00" }}>DK</Avatar>,
            status: 'finish',
          },
          {
            title: "Step 3",
            description: "this is keshav",
            icon: <Avatar style={{ backgroundColor: "#f56a00" }}>DK</Avatar>,
            status: 'finish',
          },
        ]}
      />
    </>
  );
};

export default Activity;

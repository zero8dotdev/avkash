"use client";
import { Menu, Tabs } from "antd";
import { useRouter } from "next/navigation";
import React, { useEffect, useTransition } from "react";
import { start } from "repl";

const SideMenu = ({ position }: { position: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const prefetchRoutes = [
      "/general",
      "/billing",
      "/leave-types",
      "/team",
      "/location",
    ];

    prefetchRoutes.forEach((route) => {
      router.prefetch(route);
    });
  }, [router]);
  return (
    <Tabs
      activeKey={position}
      onChange={(key) => startTransition(() => router.push(`${key}`))}
      type="card"
      items={[
        {
          label: "General",
          key: "general",
          children: "",
        },
        {
          label: "Billing",
          key: "billing",
          children: "",
        },
        {
          label: "Leave Types",
          key: "leave-types",
          children: "",
        },
        {
          label: "Teams",
          key: "team",
          children: "",
        },
        {
          label: "Locations",
          key: "location",
          children: "",
        },
      ]}
      tabPosition="left"
    />
  );
};

export default SideMenu;

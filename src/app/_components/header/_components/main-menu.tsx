"use client";

import { Menu } from "antd";
import { DashboardTwoTone, SettingTwoTone } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useRouter, usePathname } from "next/navigation";

type MenuItem = Required<MenuProps>["items"][number];
const menuItems: MenuItem[] = [
  {
    label: "Timeline",
    key: "timeline",
    icon: <DashboardTwoTone />,
  },
  {
    label: "Settings",
    key: "settings",
    icon: <SettingTwoTone />,
  },
];

export default function MainMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const handleMenuItemClick: MenuProps["onClick"] = (e) => {
    router.push(`/dashboard/${e.key}`);
  };

  if (pathname.startsWith("/dashboard")) {
    return (
      <Menu onClick={handleMenuItemClick} mode="horizontal" items={menuItems} />
    );
  } else {
    return null;
  }
}

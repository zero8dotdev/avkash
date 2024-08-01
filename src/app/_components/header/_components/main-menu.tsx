"use client";

import { Menu } from "antd";
import {
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useRouter, usePathname } from "next/navigation";

type MenuItem = Required<MenuProps>["items"][number];
const menuItems: MenuItem[] = [
  {
    label: "Timeline",
    key: "timeline",
    icon: <DashboardOutlined />,
  },
  {
    label: "Settings",
    key: "settings",
    icon: <SettingOutlined />,
  },
  {
    label: "Users",
    key: "users",
    icon: <UserOutlined />,
  },
];

export default function MainMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const handleMenuItemClick: MenuProps["onClick"] = (e) => {
    router.push(`/dashboard/${e.key}`);
  };
  // TODO: render the menu items (settings and Users) only for owner
  if (pathname.startsWith("/dashboard")) {
    return (
      <Menu onClick={handleMenuItemClick} mode="horizontal" items={menuItems} />
    );
  } else {
    return null;
  }
}

// // "use client";

// // import { Menu } from "antd";
// // import {
// //   DashboardOutlined,
// //   SettingOutlined,
// //   UserOutlined,
// // } from "@ant-design/icons";
// // import type { MenuProps } from "antd";
// // import { useRouter, usePathname } from "next/navigation";
// // import { useApplicationContext } from "@/app/_context/appContext";

// // type MenuItem = Required<MenuProps>["items"][number];
// // const menuItems: MenuItem[] = [
// //   {
// //     label: "Timeline",
// //     key: "timeline",
// //     icon: <DashboardOutlined />,
// //   },
// //   {
// //     label: "Settings",
// //     key: "orgsettings/general",
// //     icon: <SettingOutlined />,
// //   },
// //   {
// //     label: "Users",
// //     key: "users",
// //     icon: <UserOutlined />,
// //   },
// // ];

// // export default function MainMenu() {
// //   const router = useRouter();
// //   const pathname = usePathname();
// //   const { state } = useApplicationContext();

// //   const handleMenuItemClick: MenuProps["onClick"] = (e) => {
// //     router.push(`/dashboard/${e.key}`);
// //   };
// //   // TODO: render the menu items (settings and Users) only for owner
// //   if (pathname.startsWith("/dashboard")) {
// //     return (
// //       <Menu onClick={handleMenuItemClick} mode="horizontal" items={menuItems} />
// //     );
// //   } else {
// //     return null;
// //   }
// // }

// // "use client";

// // import { Menu } from "antd";
// // import {
// //   DashboardOutlined,
// //   SettingOutlined,
// //   UserOutlined,
// // } from "@ant-design/icons";
// // import type { MenuProps } from "antd";
// // import { useRouter, usePathname } from "next/navigation";
// // import { useApplicationContext } from "@/app/_context/appContext";

// // type MenuItem = Required<MenuProps>["items"][number];

// // const menuItems: MenuItem[] = [
// //   {
// //     label: "Timeline",
// //     key: "timeline",
// //     icon: <DashboardOutlined />,
// //   },
// //   {
// //     label: "Settings",
// //     key: "orgsettings/general",
// //     icon: <SettingOutlined />,
// //   },
// //   {
// //     label: "Users",
// //     key: "users",
// //     icon: <UserOutlined />,
// //   },
// // ];

// // export default function MainMenu() {
// //   const router = useRouter();
// //   const pathname = usePathname();
// //   const { state } = useApplicationContext();

// //   const handleMenuItemClick: MenuProps["onClick"] = (e) => {
// //     router.push(`/dashboard/${e.key}`);
// //   };

// //   // Filter menu items based on role
// //   const filteredMenuItems =
// //     state.role === "USER"
// //       ? menuItems.filter((item) => item?.key === "timeline")
// //       : menuItems;

// //   if (pathname.startsWith("/dashboard")) {
// //     return (
// //       <div
// //         style={{
// //           display: "flex",
// //           justifyContent: "center", // Center the menu horizontally
// //           alignItems: "center", // Center the menu vertically (if needed)
// //           width: "90%", // Ensure the container spans the full width
// //         }}
// //       >
// //         <Menu
// //           onClick={handleMenuItemClick}
// //           mode="horizontal"
// //           items={filteredMenuItems}
// //           style={{ width: "auto", minWidth:"110px" }}
// //         />
// //       </div>
// //     );
// //   } else {
// //     return null;
// //   }
// // }


// "use client";

// import { Menu } from "antd";
// import {
//   DashboardOutlined,
//   SettingOutlined,
//   UserOutlined,
// } from "@ant-design/icons";
// import type { MenuProps } from "antd";
// import { useRouter, usePathname } from "next/navigation";
// import { useApplicationContext } from "@/app/_context/appContext";

// type MenuItem = Required<MenuProps>["items"][number];

// const menuItems: MenuItem[] = [
//   {
//     label: "Timeline",
//     key: "timeline",
//     icon: <DashboardOutlined />,
//   },
//   {
//     label: "Settings",
//     key: "orgsettings/general",
//     icon: <SettingOutlined />,
//   },
//   {
//     label: "Users",
//     key: "users",
//     icon: <UserOutlined />,
//   },
// ];

// export default function MainMenu() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const { state } = useApplicationContext();

//   const handleMenuItemClick: MenuProps["onClick"] = (e) => {
//     router.push(`/dashboard/${e.key}`);
//   };

//   // Don't render the menu until role is initialized
//   if (!state.role) {
//     return null; // Or a loading indicator if needed
//   }

//   // Filter menu items based on role
//   const filteredMenuItems =
//     state.role === "USER"
//       ? menuItems.filter((item) => item?.key === "timeline")
//       : menuItems;

//   if (pathname.startsWith("/dashboard")) {
//     return (
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "center", // Center the menu horizontally
//           alignItems: "center", // Center the menu vertically (if needed)
//           width: "90%", // Ensure the container spans the full width
//         }}
//       >
//         <Menu
//           onClick={handleMenuItemClick}
//           mode="horizontal"
//           items={filteredMenuItems}
//           style={{ width: "auto", minWidth: "110px" }}
//         />
//       </div>
//     );
//   } else {
//     return null;
//   }
// }


"use client";

import { Menu } from "antd";
import {
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useRouter, usePathname } from "next/navigation";
import { useApplicationContext } from "@/app/_context/appContext";

type MenuItem = Required<MenuProps>["items"][number];

const menuItems: MenuItem[] = [
  {
    label: "Timeline",
    key: "timeline",
    icon: <DashboardOutlined />,
  },
  {
    label: "Settings",
    key: "orgsettings/general",
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
  const { state } = useApplicationContext();

  const handleMenuItemClick: MenuProps["onClick"] = (e) => {
    router.push(`/dashboard/${e.key}`);
  };

  // Don't render the menu until role is initialized
  if (!state.role) {
    return null; // Or a loading indicator if needed
  }

  // Filter menu items based on role
  const filteredMenuItems =
    state.role === "USER"
      ? menuItems.filter((item) => item?.key === "timeline")
      : menuItems;

  // Determine the current menu item based on the pathname
  const currentKey = pathname.replace("/dashboard/", ""); // Extract the key from the URL

  if (pathname.startsWith("/dashboard")) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center", // Center the menu horizontally
          alignItems: "center", // Center the menu vertically (if needed)
          width: "90%", // Ensure the container spans the full width
        }}
      >
        <Menu
          onClick={handleMenuItemClick}
          mode="horizontal"
          items={filteredMenuItems}
          selectedKeys={[currentKey]} // Highlight the current menu item
          style={{ width: "auto", minWidth: "110px" }}
        />
      </div>
    );
  } else {
    return null;
  }
}

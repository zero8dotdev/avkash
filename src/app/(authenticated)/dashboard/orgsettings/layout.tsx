// // import { Col, ConfigProvider, Flex, Row } from "antd";

// // export default async function SettingsLayout({
// //   children,
// // }: Readonly<{ children: React.ReactNode }>) {
// //   return (
// //     <ConfigProvider
// //       theme={{
// //         components: {
// //           Tabs: {
// //             colorBorder: "transparent",
// //             inkBarColor: "transparent",
// //             cardBg: "transparent",
// //             fontSize: 15,
// //           },
// //         },
// //       }}
// //     >
// //       <Row style={{ paddingLeft:"100px" }}>
// //         <Col span={24} style={{ justifyContent: "center" }}>
// //           {children}
// //         </Col>
// //       </Row>
// //     </ConfigProvider>
// //   );
// // }

// 'use client'

// import { Col, ConfigProvider, Row } from "antd";
// import { useRouter } from "next/navigation";
// import { useApplicationContext } from "@/app/_context/appContext";
// import { useEffect } from "react";

// export default function SettingsLayout({
//   children,
// }: Readonly<{ children: React.ReactNode }>) {
//   const { state } = useApplicationContext(); // Assuming role is in context
//   const router = useRouter();

//   useEffect(() => {
//     // Redirect if the user is not allowed to access
//     if (state.role !== "OWNER") {
//       router.push("/unauthorized"); // Or redirect to login if needed
//     }
//   }, [state.role, router]);

//   // Show nothing or a spinner until the role check is complete
//   if (state.role !== "OWNER") {
//     return null; // Replace with a loading indicator if necessary
//   }

//   return (
//     <ConfigProvider
//       theme={{
//         components: {
//           Tabs: {
//             colorBorder: "transparent",
//             inkBarColor: "transparent",
//             cardBg: "transparent",
//             fontSize: 15,
//           },
//         },
//       }}
//     >
//       <Row style={{ paddingLeft: "100px" }}>
//         <Col span={24} style={{ justifyContent: "center" }}>
//           {children}
//         </Col>
//       </Row>
//     </ConfigProvider>
//   );
// }

'use client';

import { Col, ConfigProvider, Row } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import { useApplicationContext } from '@/app/_context/appContext';
import { useEffect } from 'react';

const PROTECTED_ROUTES = [
  '/dashboard/orgsettings/leave-types',
  '/dashboard/orgsettings/general',
  '/dashboard/orgsettings/billing',
];

export default function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { state } = useApplicationContext(); // Assuming role is in context
  const router = useRouter();
  const pathname = usePathname(); // Get the current route

  useEffect(() => {
    // Check if the current route is protected and the user is not authorized
    if (PROTECTED_ROUTES.includes(pathname) && state.role !== 'OWNER') {
      router.push('/unauthorized'); // Redirect to unauthorized page
    }
  }, [state.role, router, pathname]);

  // Render nothing or a spinner until role validation is complete
  if (PROTECTED_ROUTES.includes(pathname) && state.role !== 'OWNER') {
    return null; // Replace with a loading spinner if needed
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Tabs: {
            colorBorder: 'transparent',
            inkBarColor: 'transparent',
            cardBg: 'transparent',
            fontSize: 15,
          },
        },
      }}
    >
      <Row style={{ paddingLeft: '100px' }}>
        <Col span={24} style={{ justifyContent: 'center' }}>
          {children}
        </Col>
      </Row>
    </ConfigProvider>
  );
}

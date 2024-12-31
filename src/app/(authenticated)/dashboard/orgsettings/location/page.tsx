// "use client";

// import { useApplicationContext } from "@/app/_context/appContext";
// import {
//   Avatar,
//   Button,
//   Card,
//   Col,
//   Flex,
//   List,
//   Row,
//   Space,
//   Typography,
// } from "antd";

// import { useEffect, useState } from "react";
// import Flag from "react-world-flags";
// import LocationPage from "@/app/(authenticated)/setup/steps/locationPage";
// import moment from "moment-timezone";
// import { createClient } from "@/app/_utils/supabase/client";
// import SideMenu from "../_components/menu";
// import { fetchOrg, fetchPublicHolidays, updateHolidaysList } from "../_actions";

// const Page = () => {
//   const [location, setLocation] = useState<string>();
//   const [holidaysList, setHolidaysList] = useState<any[]>([]);
//   const [isChangeLocation, setIsChangeLocation] = useState<boolean>(false);
//   const [countryCode, setCountryCode] = useState<string>();
//   const [loading, setLoading] = useState<boolean>(false);

//   const { state: appState } = useApplicationContext();
//   const { orgId } = appState;

//   const fetchLocation = async (orgId: string) => {
//     const orgData = await fetchOrg(orgId);
//     console.log("orgData", orgData);
//     const { location } = orgData;
//     setLocation(location[0]);
//     setCountryCode(location[0]);
//   };

//   useEffect(() => {
//     fetchLocation(orgId);
//   }, [orgId]);

//   const handleChangeLocation = () => {
//     setIsChangeLocation(true);
//   };

//   const fetchHolidays = async (countryCode: any) => {
//     const holidays = await fetchPublicHolidays(countryCode);
//     const holidayData = holidays.map((each) => ({
//       key: each.id,
//       name: each.name,
//       date: moment(each.date).toISOString(),
//       isRecurring: true,
//       isCustom: false,
//     }));
//     setHolidaysList(holidayData);
//   };

  // useEffect(() => {
  //   fetchHolidays(countryCode);
  // }, [countryCode]);

//   const updateHolidays = async () => {
//     setLoading(true);
//     try {
//       const updatedOrgLocation = await updateHolidaysList(
//         holidaysList,
//         orgId,
//         countryCode
//       );

//       const supabase = createClient();
//       const { data, error } = await supabase
//         .from("Organisation")
//         .update({ location: countryCode })
//         .eq("orgId", orgId)
//         .select();

//       if (error) {
//         console.log(error);
//       }
//       setLocation(countryCode);
//       setIsChangeLocation(false);
//     } catch (error) {
//       console.log(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const locations = [
//     {
//       countryCode: "IN",
//       countryName: "India",
//     },
//     {
//       countryCode: "DE",
//       countryName: "Germany",
//     },
//     {
//       countryCode: "GB",
//       countryName: "United Kingdom",
//     },
//     {
//       countryCode: "US",
//       countryName: "United States",
//     },
//     {
//       countryCode: "NL",
//       countryName: "Netherlands",
//     },
//   ];

//   const code = locations.filter((each) => location === each.countryCode);

//   return (
//     <Row style={{ padding: "80px" }}>
//       <Col span={3}>
//         <SideMenu position="location" />
//       </Col>
//       <Col span={16}>
//         <Card title="Location Settings">
//           <List
//             style={{ margin: "12px" }}
//             bordered
//             itemLayout="horizontal"
//             dataSource={code}
//             renderItem={(item, index) => {
//               return (
//                 <List.Item>
//                   <List.Item.Meta
//                     avatar={
//                       <Avatar style={{ background: "none" }}>
//                         {" "}
//                         <Flag
//                           code={item.countryCode}
//                           style={{ width: "50px", height: "50px" }}
//                           alt={item.countryName}
//                         />
//                       </Avatar>
//                     }
//                     title={
//                       <Typography.Title level={4}>
//                         {item.countryName}
//                       </Typography.Title>
//                     }
//                   />
//                 </List.Item>
//               );
//             }}
//           />
//         </Card>
//         <Button
//           onClick={() => handleChangeLocation()}
//           type="primary"
//           style={{ marginTop: "15px" }}
//         >
//           Change Location
//         </Button>
//         {isChangeLocation && (
//           <>
//             {countryCode && (
//               <Flex vertical style={{ width: "100%" }}>
//                 <Col span={24}>
//                   <LocationPage
//                     updateCountryCode={(code: string) => setCountryCode(code)}
//                     holidaysList={holidaysList}
//                     update={(values) => setHolidaysList(values)}
//                     countryCode={countryCode}
//                   />
//                 </Col>

//                 <Flex gap={8} justify="flex-end" style={{ width: "100%" }}>
//                   <Space>
//                     <Button
//                       style={{ marginRight: "5px" }}
//                       danger
//                       onClick={() => setIsChangeLocation(false)}
//                     >
//                       Cancel
//                     </Button>
//                     <Button
//                       type="primary"
//                       onClick={() => updateHolidays()}
//                       loading={loading}
//                     >
//                       save
//                     </Button>
//                   </Space>
//                 </Flex>
//               </Flex>
//             )}
//           </>
//         )}
//       </Col>
//     </Row>
//   );
// };
// export default Page;

"use client";

import { useApplicationContext } from "@/app/_context/appContext";
import {
  Avatar,
  Button,
  Card,
  Col,
  Flex,
  List,
  Row,
  Space,
  Typography,
} from "antd";

import { useEffect, useState } from "react";
import Flag from "react-world-flags";
import LocationPage from "@/app/(authenticated)/setup/steps/locationPage";
import moment from "moment-timezone";
import { createClient } from "@/app/_utils/supabase/client";
import SideMenu from "../_components/menu";
import { fetchOrg, fetchPublicHolidays, updateHolidaysList } from "../_actions";

const Page = () => {
  const [locations, setLocations] = useState<string[]>([]);
  const [holidaysList, setHolidaysList] = useState<any[]>([]);
  const [isChangeLocation, setIsChangeLocation] = useState<boolean>(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { state: appState } = useApplicationContext();
  const { orgId } = appState;

  const fetchLocation = async (orgId: string) => {
    const orgData = await fetchOrg(orgId);
    console.log("orgData", orgData);
    const { location } = orgData;
    setLocations(location);
  };

  useEffect(() => {
    fetchLocation(orgId);
  }, [orgId]);

  const handleAddLocation = () => {
    setIsChangeLocation(true);
    setSelectedCountryCode(null); // Start with no selected country
  };

  const fetchHolidays = async (countryCode: string) => {
    const holidays = await fetchPublicHolidays(countryCode);
    const holidayData = holidays.map((each) => ({
      key: each.id,
      name: each.name,
      date: moment(each.date).toISOString(),
      isRecurring: true,
      isCustom: false,
    }));
    setHolidaysList(holidayData);
  };

  useEffect(() => {
    if (selectedCountryCode) {
      fetchHolidays(selectedCountryCode);
    }
  }, [selectedCountryCode]);

  const updateHolidays = async () => {
    setLoading(true);
    try {
      const updatedOrgLocation = await updateHolidaysList(
        holidaysList,
        orgId,
        selectedCountryCode
      );

      const supabase = createClient();
      const { data, error } = await supabase
        .from("Organisation")
        .update({ location: locations }) // Save the updated array
        .eq("orgId", orgId)
        .select();

      if (error) {
        console.log(error);
      }

      setIsChangeLocation(false);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const countryList = [
    {
      countryCode: "IN",
      countryName: "India",
    },
    {
      countryCode: "DE",
      countryName: "Germany",
    },
    {
      countryCode: "GB",
      countryName: "United Kingdom",
    },
    {
      countryCode: "US",
      countryName: "United States",
    },
    {
      countryCode: "NL",
      countryName: "Netherlands",
    },
  ];

  const selectedLocations = countryList.filter((each) =>
    locations.includes(each.countryCode)
  );

    // Filter out already selected locations
    const availableLocations = countryList.filter(
      (each) => !locations.includes(each.countryCode)
    );

  return (
    <Row style={{ padding: "80px" }}>
      <Col span={3}>
        <SideMenu position="location" />
      </Col>
      <Col span={16}>
        <Card title="Location Settings">
          <List
            style={{ margin: "12px" }}
            bordered
            itemLayout="horizontal"
            dataSource={selectedLocations}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar style={{ background: "none" }}>
                      <Flag
                        code={item.countryCode}
                        style={{ width: "50px", height: "50px" }}
                        alt={item.countryName}
                      />
                    </Avatar>
                  }
                  title={
                    <Typography.Title level={4}>
                      {item.countryName}
                    </Typography.Title>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
        <Button
          onClick={handleAddLocation}
          type="primary"
          style={{ marginTop: "15px" }}
        >
          Add Location
        </Button>
        {isChangeLocation && (
          <Flex vertical style={{ width: "100%" }}>
            <Col span={24} style={{ marginBottom: "15px" }}>
              <LocationPage
                updateCountryCode={(code: string) => setSelectedCountryCode(code)}
                holidaysList={holidaysList}
                update={(values) => setHolidaysList(values)}
                countryCode={selectedCountryCode}
                // availableLocations={availableLocations} // Pass only available locations  //note: we need to filter the available locations in the component
              />
            </Col>
            <Flex gap={8} justify="flex-end" style={{ width: "100%" }}>
              <Space>
                <Button
                  style={{ marginRight: "5px" }}
                  danger
                  onClick={() => setIsChangeLocation(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={updateHolidays}
                  loading={loading}
                >
                  Save
                </Button>
              </Space>
            </Flex>
          </Flex>
        )}
      </Col>
    </Row>
  );
};

export default Page;

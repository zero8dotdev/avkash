"use client";

import { useApplicationContext } from "@/app/_context/appContext";
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  List,
  Popover,
  Row,
  Space,
  Tooltip,
  Typography,
} from "antd";

import { useEffect, useState } from "react";
import Flag from "react-world-flags";
import LocationPage from "@/app/(authenticated)/setup/steps/locationPage";
import moment from "moment-timezone";
import { createClient } from "@/app/_utils/supabase/client";
import SideMenu from "../_components/menu";
import {
  fetchOrg,
  fetchPublicHolidays,
  updateHolidaysList,
  updateOrgLocations,
} from "../_actions";
import useSWR from "swr";

const Page = () => {
  const [locations, setLocations] = useState<string[]>([]);
  const [holidaysList, setHolidaysList] = useState<any[]>([]);
  const [isChangeLocation, setIsChangeLocation] = useState<boolean>(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);

  const { state: appState } = useApplicationContext();
  const { orgId } = appState;

  // const fetchLocation = async (orgId: string) => {
  //   const orgData = await fetchOrg(orgId);
  //   console.log("orgData", orgData);
  //   const { location } = orgData;
  //   setLocations(location);
  // };
  const fetchorg = async (orgId: string) => {
    const org = orgId.split("*")[1];
    const orgData = await fetchOrg(org);
    const { location } = orgData;
    setLocations(location);
    // if (error) {
    //   throw new Error("Failed to fetch organization data");
    // }
    return orgData;
  };

  const {
    data: orgData,
    error: orgError,
    mutate,
  } = useSWR(`orgLocations*${orgId}`, fetchorg);

  const handleAddLocation = () => {
    setIsChangeLocation(true);
    setSelectedCountryCode(null);
  };

  // const fetchHolidays = async (countryCode: string) => {
  //   const holidays = await fetchPublicHolidays(countryCode);
  //   const holidayData = holidays.map((each) => ({
  //     key: each.id,
  //     name: each.name,
  //     date: moment(each.date).toISOString(),
  //     isRecurring: true,
  //     isCustom: false,
  //   }));
  //   setHolidaysList(holidayData);
  // };

  // useEffect(() => {
  //   if (selectedCountryCode) {
  //     fetchHolidays(selectedCountryCode);
  //   }
  // }, [selectedCountryCode]);

  const fetcherPublicHolidays = (countryCode: string) =>
    fetchPublicHolidays(countryCode);

  const { data, error, isLoading } = useSWR(
    selectedCountryCode ? ["fetchHolidays", selectedCountryCode] : null,
    ([, countryCode]) => fetcherPublicHolidays(countryCode),
    {
      onSuccess: (data) => {
        const transformedData = data.map((each: any) => ({
          key: each.id,
          name: each.name,
          date: moment(each.date).toISOString(),
          isRecurring: true,
          isCustom: false,
        }));
        setHolidaysList(transformedData);
      },
    }
  );

  const updateHolidays = async () => {
    setLoading(true);
    try {
      if (!holidaysList.length || !locations || !selectedCountryCode) {
        throw new Error(
          "Missing required data for updating holidays or locations"
        );
      }

      const updatedOrgHolidays = await updateHolidaysList(
        holidaysList,
        orgId,
        selectedCountryCode
      );

      if (updatedOrgHolidays) {
        await updateOrgLocations(locations, selectedCountryCode, orgId);
      }

      setIsChangeLocation(false);
      setSelectedCountryCode(null);
      setHolidaysList([]);
    } catch (error) {
      console.error("Error in updateHolidays:", error);
    } finally {
      mutate();
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
  console.log("selectedCountryCode", selectedCountryCode, locations);
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
            locale={{
              emptyText: (
                <Empty
                  description="No locations selected"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </Card>
        <Tooltip>
          <Button
            onClick={handleAddLocation}
            type="primary"
            style={{ marginTop: "15px", marginBottom: "15px" }}
            disabled={availableLocations.length === 0}
          >
            Add Location
          </Button>
        </Tooltip>
        {isChangeLocation && (
          <Flex vertical style={{ width: "100%" }}>
            <Col span={24} style={{ marginBottom: "15px" }}>
              <LocationPage
                updateCountryCode={(code: string) =>
                  setSelectedCountryCode(code)
                }
                holidaysList={holidaysList}
                update={(values) => setHolidaysList(values)}
                countryCode={selectedCountryCode}
                availableLocations={availableLocations} // Pass only available locations  //note: we need to filter the available locations in the component
              />
            </Col>
            <Flex gap={8} justify="flex-end" style={{ width: "100%" }}>
              <Space>
                <Button
                  style={{ marginRight: "5px" }}
                  danger
                  onClick={() => {
                    setIsChangeLocation(false);
                    setSelectedCountryCode(null);
                    setHolidaysList([]);
                  }}
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

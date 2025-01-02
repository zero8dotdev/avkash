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
  Modal,
  Popover,
  Row,
  Space,
  Tooltip,
  Typography,
} from "antd";

import { useState } from "react";
import Flag from "react-world-flags";
import moment from "moment-timezone";
import SideMenu from "../_components/menu";
import {
  fetchOrg,
  fetchPublicHolidays,
  updateHolidaysList,
  updateOrgLocations,
} from "../_actions";
import useSWR from "swr";
import LocationPage from "../_components/locations";
import { EditOutlined } from "@ant-design/icons";

const Page = () => {
  const [locations, setLocations] = useState<string[]>([]);
  const [holidaysList, setHolidaysList] = useState<any[]>([]);
  const [locationMode, setLocationMode] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const { state: appState } = useApplicationContext();
  const { orgId } = appState;

  const fetchorg = async (orgId: string) => {
    const org = orgId.split("*")[1];
    const orgData = await fetchOrg(org);
    const { location } = orgData;
    setLocations(location);

    return orgData;
  };

  const {
    data: orgData,
    error: orgError,
    mutate,
  } = useSWR(`orgLocations*${orgId}`, fetchorg);

  const handleAddLocation = () => {
    setLocationMode("create");
    setSelectedCountryCode(null);
  };

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

  console.log("holidaysList", holidaysList);

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

      setLocationMode(null);
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
  return (
    <Row style={{ padding: "80px" }}>
      <Col span={3}>
        <SideMenu position="location" />
      </Col>
      <Col span={16}>
        <Card
          title="Location Settings"
          extra={
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
          }
        >
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
                <Flex gap={10}>
                  <Button
                    icon={
                      <EditOutlined
                        onClick={() => {
                          setLocationMode("edit");
                          setSelectedCountryCode(item.countryCode);
                        }}
                      />
                    }
                  />
                  <Button>Delete</Button>
                </Flex>
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

        <Modal
          open={locationMode === "create" || locationMode === "edit"}
          footer={null}
          onCancel={() => {
            setLocationMode(null), setSelectedCountryCode(null);
          }}
          title={locationMode}
          width={1000}
        >
          <Flex vertical style={{ width: "100%" }}>
            <Col span={24} style={{ marginBottom: "15px" }}>
              <LocationPage
                locationMode={locationMode}
                updateCountryCode={(code: string) =>
                  setSelectedCountryCode(code)
                }
                holidaysList={holidaysList}
                update={(values) => setHolidaysList(values)}
                countryCode={selectedCountryCode}
                availableLocations={availableLocations}
              />
            </Col>
            <Flex gap={8} justify="flex-end" style={{ width: "100%" }}>
              <Space>
                <Button
                  style={{ marginRight: "5px" }}
                  danger
                  onClick={() => {
                    setLocationMode(null);
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
        </Modal>
      </Col>
    </Row>
  );
};

export default Page;

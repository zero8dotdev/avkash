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
  Row,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { useState } from "react";
import Flag from "react-world-flags";
import SideMenu from "../_components/menu";
import {
  deleteOrgLocations,
  fetchOrg,
  fetchOrgHolidays,
  updateHolidaysList,
  updateOrgLocations,
} from "../_actions";
import useSWR from "swr";
import LocationPage from "../_components/locations";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import moment from "moment-timezone";

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

  const fetchOrgData = async (orgId: string) => {
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
  } = useSWR(`orgLocations*${orgId}`, fetchOrgData);

  const handleAddLocation = () => {
    setLocationMode("create");
    setSelectedCountryCode(null); // Start dropdown empty
    setHolidaysList([]);
  };

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
    { countryCode: "IN", countryName: "India" },
    { countryCode: "DE", countryName: "Germany" },
    { countryCode: "GB", countryName: "United Kingdom" },
    { countryCode: "US", countryName: "United States" },
    { countryCode: "NL", countryName: "Netherlands" },
  ];

  const selectedLocations = countryList.filter((each) =>
    locations?.includes(each.countryCode)
  );

  const availableLocations = countryList.filter(
    (each) => !locations?.includes(each.countryCode)
  );

  const fetchLocationDetails = async (countryCode: string) => {
    try {
      const locationDetails = await fetchOrgHolidays(orgId, countryCode);
      const transformedHolidays = locationDetails?.map((holiday) => ({
        key: holiday.holidayId,
        name: holiday.name,
        date: moment(holiday.date).toISOString(),
        isRecurring: holiday.isRecurring,
        isCustom: holiday.isCustom,
      }));
      setHolidaysList(transformedHolidays);
    } catch (error) {
      console.error("Error fetching location details:", error);
    }
  };

  const handleEdit = async (countryCode: string) => {
    await fetchLocationDetails(countryCode);
    setLocationMode("edit");
    setSelectedCountryCode(countryCode);
  };
  return (
    <Row style={{ padding: "80px", overflow: "hidden" }}>
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
                disabled={availableLocations?.length === 0}
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
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    handleEdit(item.countryCode);
                  }}
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

        <Modal
          open={locationMode === "create" || locationMode === "edit"}
          footer={null}
          onCancel={() => {
            setLocationMode(null), setSelectedCountryCode(null);
          }}
          title={locationMode === "create" ? "Add New Holiday" : "Edit Holiday"}
          width={1000}
        >
          <LocationPage
            locationMode={locationMode}
            updateCountryCode={(code: string) => setSelectedCountryCode(code)}
            holidaysList={holidaysList}
            update={(values) => setHolidaysList(values)}
            countryCode={selectedCountryCode}
            availableLocations={availableLocations}
          />
          <Flex gap={8} justify="flex-end" style={{ width: "100%" }}>
            <Space>
              <Button
                danger
                onClick={() => {
                  setLocationMode(null);
                  setSelectedCountryCode(null);
                  setHolidaysList([]);
                }}
              >
                Cancel
              </Button>
              <Button type="primary" onClick={updateHolidays} loading={loading}>
                Save
              </Button>
            </Space>
          </Flex>
        </Modal>
      </Col>
    </Row>
  );
};

export default Page;

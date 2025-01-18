"use client";
import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tooltip,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  LeftOutlined,
  SmileOutlined,
  SolutionOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { fetchOrg, fetchPublicHolidays } from "@/app/_actions";
import { Card } from "antd";
import { useRouter } from "next/navigation";
import TopSteps from "../_componenets/steps";
import {
  fetchHolidaysData,
  fetchTeamGeneralData,
  insertHolidays,
  updateInitialsetupState,
  updateLocation,
} from "../_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import useSWR from "swr";
import Flag from "react-world-flags";
import {
  fetchOrgHolidays,
  updateHolidaysList,
  updateOrgLocations,
} from "../../dashboard/orgsettings/_actions";
import moment from "moment-timezone";
import LocationPage from "../../dashboard/orgsettings/_components/locations";

export interface holidaysList {
  key: string;
  name: string;
  date: string;
  isRecurring: boolean;
  isCustom: boolean;
}

const Location = () => {
  const [holidaysList, setHolidaysList] = useState<any[]>([]);
  const [locationMode, setLocationMode] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const { state: appState } = useApplicationContext();
  const { orgId, userId, teamId } = appState;
  const router = useRouter();

  const fetchOrgData = async (orgId: string) => {
    const org = orgId.split("*")[1];
    const orgData = await fetchOrg(org);
    const { location } = orgData;
    setLocations(location || []);
    return orgData;
  };

  const {
    data: orgData,
    error: orgError,
    mutate: orgMutate,
  } = useSWR(`orgLocations*${orgId}`, fetchOrgData);

  const handleAddLocation = () => {
    setLocationMode("create");
    setSelectedCountryCode(null); // Start dropdown empty
    setHolidaysList([]);
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
  const availableLocations = countryList.filter(
    (each) => !locations?.includes(each.countryCode)
  );

  const handleEdit = async (countryCode: string) => {
    await fetchLocationDetails(countryCode);
    setLocationMode("edit");
    setSelectedCountryCode(countryCode);
  };

  const updateHolidays = async () => {
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
        await updateOrgLocations(locations, selectedCountryCode, orgId, teamId);
      }

      setLocationMode(null);
      setSelectedCountryCode(null);
      setHolidaysList([]);
      orgMutate();
    } catch (error) {
      console.error("Error in updateHolidays:", error);
    }
  };

  const handlenext = async () => {
    try {
      setLoading(true);
      const status = await updateInitialsetupState(orgId, "4");
      if (status) {
        router.push(
          new URL(
            "/initialsetup/notifications ",
            window?.location.origin
          ).toString()
        );
      } else {
        throw new Error("Failed to update initial setup state");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 10000);
    }
  };

  const handlePrevious = () => {
    router.push(
      new URL("/initialsetup/leave-policy", window?.location.origin).toString()
    );
  };

  return (
    <Row
      style={{
        padding: "50px 50px 180px 20px",
        height: "100%",
      }}
    >
      <TopSteps position={3} />
      <Col span={16} push={4}>
        <Card
          title="Locations"
          extra={
            orgData?.location?.length === 0 || orgData?.location === null  ? ( // Check if the org has no locations
              <Tooltip title="Add Location">
                <Button
                  onClick={handleAddLocation}
                  type="primary"
                  style={{ marginTop: "15px", marginBottom: "15px" }}
                >
                  Add Location
                </Button>
              </Tooltip>
            ) : null // Hide the button if at least one location exists
          }
          style={{
            margin: "25px 0px 25px 0px",
            minHeight: "300px",
            overflow: "auto",
          }}
        >
          <List
            loading={loading}
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
                  description="No location added yet"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </Card>
        <Flex justify="space-between">
          <Button danger icon={<LeftOutlined />} onClick={handlePrevious}>
            Previous
          </Button>
          <Button type="primary" onClick={handlenext}>
            Next
          </Button>
        </Flex>
      </Col>
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
            <Button type="primary" onClick={updateHolidays}>
              Save
            </Button>
          </Space>
        </Flex>
      </Modal>
    </Row>
  );
};

export default Location;

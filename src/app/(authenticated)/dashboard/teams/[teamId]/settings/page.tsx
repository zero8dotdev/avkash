"use client";
import { Button, Card, Col, Form, Input, Row, Select, message } from "antd";
import React, { useEffect, useMemo } from "react";
import TeamSettingsTabs from "../_components/team-settings-tabs";
import TeamSettings from "@/app/(authenticated)/initialsetup/_componenets/team-settings";
import useSWR from "swr";
import { useApplicationContext } from "@/app/_context/appContext";
import { fetchTeamGeneralData, updateTeamGeneralData, fetchLocations } from "../_actions";
import { useParams } from "next/navigation";

// Default locations for name lookup
const defaultLocations = [
  { countryCode: "IN", countryName: "India" },
  { countryCode: "DE", countryName: "Germany" },
  { countryCode: "GB", countryName: "United Kingdom" },
  { countryCode: "US", countryName: "United States" },
  { countryCode: "NL", countryName: "Netherlands" },
];

const Page = () => {
  const [form] = Form.useForm();
  const { state: appState } = useApplicationContext();
  const { orgId } = appState;
  const { teamId } = useParams() as { teamId: string };

  // Fetch team data
  const fetcher = async (key: string) => {
    const team = key.split("*")[1];
    return await fetchTeamGeneralData(team);
  };

  const { data: teamData, error, mutate, isValidating: teamdataLoading } = useSWR(
    `teamsettings*${teamId}`,
    fetcher
  );

  // Fetch locations
  const locationFetcher = async (key: string) => {
    const org = key.split("*")[1];
    return await fetchLocations(org);
  };

  const {
    data: fetchedLocations,
    error: locationError,
    isValidating: locationLoading,
  } = useSWR(`locations*${orgId}`, locationFetcher);

  // Map fetched locations to include names
  const structuredLocations = useMemo(() => {
    return fetchedLocations?.location.map((code: string) => {
      const match = defaultLocations.find(
        (loc) => loc.countryCode === code
      );
      return {
        label: match ? match.countryName : code, // Fallback to code if name not found
        value: code,
      };
    });
  }, [fetchedLocations]);

  useEffect(() => {
    if (teamData) {
      form.setFieldsValue({
        teamName: teamData.name,
        location: teamData.location,
        startOfWorkWeek: teamData.startOfWorkWeek,
        workweek: teamData.workweek,
        timeZone: teamData.timeZone,
      });
    }
  }, [teamData, form]);

  const handleSubmit = async (values: any) => {
    try {
      await updateTeamGeneralData(teamId, values); // Update backend data
      mutate({ ...teamData, ...values }); // Update local cache
      message.success("Team settings updated successfully!");
    } catch (err) {
      console.error("Update failed: ", err);
      message.error("Failed to update team settings.");
    }
  };

  if (error || locationError) return <p>Error loading data.</p>;

  return (
    <Row>
      <Col span={3}>
        <TeamSettingsTabs position="settings" />
      </Col>
      <Col span={16}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            teamName: teamData?.name,
            location: teamData?.location || "",
          }}
        >
          <Card title="Team Settings" loading={teamdataLoading || locationLoading}>
            <Form.Item
              label="Team Name"
              name="teamName"
              rules={[
                { required: true, message: "Please input your team name!" },
              ]}
            >
              <Input placeholder="Team name" />
            </Form.Item>
            <TeamSettings form={form} data={teamData} />
            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: "Please select a location!" }]}
            >
              <Select
                showSearch
                options={structuredLocations}
                placeholder="Select location"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Form.Item>
          </Card>
        </Form>
      </Col>
    </Row>
  );
};

export default Page;

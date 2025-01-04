"use client";
import { Button, Card, Col, Form, Row } from "antd";
import React from "react";
import TeamSettingsTabs from "../_components/team-settings-tabs";
import Notification from "@/app/(authenticated)/dashboard/teams/[teamId]/_components/notification";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { fetchTeamGeneralData, updateTeamNotifications } from "../_actions";

const Page = () => {

  const { teamId } = useParams() as { teamId: string };
  // Fetch team data
  const fetcher = async (key: string) => {
    const team = key.split("*")[1];
    return await fetchTeamGeneralData(team);
  };

  const {
    data: team,
    error,
    mutate,
    isValidating: teamLoading,
  } = useSWR(`teamNotifications*${teamId}`, fetcher);

  const handleFormSubmit = async (values: any) => {
    try {
      await updateTeamNotifications(teamId, values);
      mutate({...team, ...values}, false);
    } catch (err) {
      console.error("Failed to update notifications:", err);
    }
  };

  return (
    <Row>
      <Col span={3}>
        <TeamSettingsTabs position="notifications" />
      </Col>
      <Col span={16}>
        <Card title="Team Notifications">
          <Form   initialValues={team} onFinish={handleFormSubmit}>
            <Notification />
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Page;

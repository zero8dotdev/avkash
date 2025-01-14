"use client";

import { Avatar, Button, Card, Col, List, Row } from "antd";
import React from "react";
import TeamSettingsTabs from "../_components/team-settings-tabs";
import { useParams } from "next/navigation";
import { fetchTeamUsersData } from "../_actions";
import useSWR from "swr";
import { clear } from "console";

const Page = () => {
  const { teamId } = useParams() as { teamId: string };
  // Fetch team data
  const fetcher = async (key: string) => {
    const team = key.split("*")[1];
    return await fetchTeamUsersData(team);
  };

  const {
    data: users,
    error,
    mutate,
    isValidating: managersLoading,
  } = useSWR(`teamUsers*${teamId}`, fetcher);


  return (
    <Row>
      <Col span={3}>
        <TeamSettingsTabs position="users" />
      </Col>
      <Col span={16}>
        <Card title="Team Users">
          <List
            bordered
            dataSource={users}
            renderItem={(item) => (
              <List.Item style={{ cursor: "pointer" }}>
                <List.Item.Meta
                  avatar={
                    <Avatar style={{ backgroundColor: "#227b83" }}>
                      {" "}
                      {item.name
                        .split(" ")
                        .map((word: any) => word[0])
                        .join("")
                        .toUpperCase()}{" "}
                    </Avatar>
                  }
                  title={item?.name}
                  description={item?.email}
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default Page;

"use client";
import { useApplicationContext } from "@/app/_context/appContext";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Flex,
  List,
  Row,
  Segmented,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import TeamTableActive from "./teamTable";
import SideMenu from "../_components/menu";
import useSWR from "swr";
import { fetchTeamsData, updateTeamData } from "../_actions";

const Team = () => {
  const [segmentValue, setSegmentValue] = useState<string | number>("active");
  const [teams, setTeams] = useState<any>();

  const { state: appState } = useApplicationContext();
  const { orgId } = appState;

  const fetchteams = async (orgId: string) => {
    const org = orgId.split("*")[1];
    const teams = await fetchTeamsData(org);
    return teams;
  };

  const {
    data: orgData,
    error: orgError,
    mutate,
  } = useSWR(`orgTeams*${orgId}`, fetchteams, {
    onSuccess: (data) => setTeams(data),
  });

  const activeTeams = teams?.filter((team: any) => team.status === true);
  const inActiveTeams = teams?.filter((team: any) => team.status == false);

  const handleDisable = async (teamData: any) => {
    await updateTeamData(false, teamData.teamId);
    mutate();
    setSegmentValue("inactive");
  };

  const handleEnable = async (teamData: any) => {
    await updateTeamData(true, teamData.teamId);
    mutate();
    setSegmentValue("active");
  };

  return (
    <Row gutter={8} style={{ padding: "80px" }}>
      <Col span={3}>
        <SideMenu position="team" />
      </Col>
      <Col span={16}>
        <Card
          title={
            <Typography.Title level={4} style={{ marginTop: "25px" }}>
              Teams
            </Typography.Title>
          }
          extra={
            <Button
              type="primary"
              style={{ border: "1px solid blue", marginTop: "12px" }}
            >
              Add new team
            </Button>
          }
          styles={{ header: { border: "none" } }}
        >
          <Segmented
            value={segmentValue}
            onChange={setSegmentValue}
            options={[
              {
                label: "active",
                value: "active",
                icon: <CheckCircleTwoTone />,
              },
              {
                label: "inactive",
                value: "inactive",
                icon: <CloseCircleTwoTone />,
              },
            ]}
          />
          <Flex vertical style={{ marginTop: "12px" }}>
            {segmentValue === "active" ? (
              <TeamTableActive
                teams={activeTeams}
                status={segmentValue}
                onDisable={handleDisable}
                onEnable={handleEnable}
              />
            ) : (
              <TeamTableActive
                teams={inActiveTeams}
                status={segmentValue}
                onDisable={handleDisable}
                onEnable={handleEnable}
              />
            )}
          </Flex>
        </Card>
      </Col>
    </Row>
  );
};

export default Team;

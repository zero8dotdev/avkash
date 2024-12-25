"use client";
import { fetchTeamsData, updateTeamData } from "@/app/_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { Col, Flex, List, Row, Segmented } from "antd";
import { useEffect, useState } from "react";
import TeamTableActive from "./teamTable";
import SideMenu from "../_components/menu";

const Team = () => {
  const [segmentValue, setSegmentValue] = useState<string | number>("active");
  const [teams, setTeams] = useState<any>();

  const { state: appState } = useApplicationContext();
  const { orgId } = appState;

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchTeamsData(orgId);

      setTeams(data);
    };
    fetchData();
  }, [orgId]);

  const activeTeams = teams?.filter((team: any) => team.status === true);
  const inActiveTeams = teams?.filter((team: any) => team.status == false);

  const handleDisable = async (teamData: any) => {
    await updateTeamData(false, teamData.teamId);
    setTeams((prevTeams: any) =>
      prevTeams.map((team: any) =>
        team.teamId === teamData.teamId ? { ...team, status: false } : team
      )
    );
  };

  const handleEnable = async (teamData: any) => {
    await updateTeamData(true, teamData.teamId);
    setTeams((prevTeams: any) =>
      prevTeams.map((team: any) =>
        team.teamId === teamData.teamId ? { ...team, status: true } : team
      )
    );
  };

  return (
    <Row gutter={8} style={{ padding: "80px" }}>
      <Col span={3}>
        <SideMenu position="team" />
      </Col>
      <Col span={16}>
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
        <Flex vertical>
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
      </Col>
    </Row>
  );
};

export default Team;

"use client";

import { fetchTeamsData } from "@/app/_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { Col, Flex, Row, Segmented } from "antd";
import { useEffect, useState } from "react";
import TeamTable from "./teamTable";

const Team = () => {
  const [segmentValue, setSegmentValue] = useState<string | number>("active");
  const [teams, setTeams] = useState<any>();
  const { state: appState } = useApplicationContext();
  const { orgId } = appState;

  useEffect(() => {
    const fetchData = async () => {
      const tableData = await fetchTeamsData(orgId);
      setTeams(tableData);
    };
    fetchData();
  }, [orgId]);

  return (
    <Row gutter={8}>
      <Col span={24}>
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
            <>
              <TeamTable teams={teams} />
            </>
          ) : null}
        </Flex>
      </Col>
    </Row>
  );
};

export default Team;

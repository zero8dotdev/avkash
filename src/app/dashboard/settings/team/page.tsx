"use client";
import { fetchTeamsData } from "@/app/_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import { Col, Flex, List, Row, Segmented } from "antd";
import { useEffect, useState } from "react";
import TeamTableActive from "./teamTable";

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
 console.log(teams)
  const activeTeams=teams?.filter((team:any)=>team.status===true)
  const inActiveTeams=teams?.filter((team:any)=>team.status==false)
  
  console.log(activeTeams)

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
            
              <TeamTableActive teams={activeTeams} status={segmentValue} />
          
          ) : <TeamTableActive teams={inActiveTeams} status={segmentValue}/>}
        </Flex>
        
         
      </Col>
    </Row>
  );
};

export default Team;

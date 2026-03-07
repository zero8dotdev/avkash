'use client';

import { Avatar, Card, Col, List, Row } from 'antd';
import React from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import TeamSettingsTabs from '../_components/team-settings-tabs';
import { fetchTeamManagersData } from '../_actions';

const Page = () => {
  const { teamId } = useParams() as { teamId: string };
  // Fetch team data
  const fetcher = async (key: string) => {
    const team = key.split('*')[1];
    return await fetchTeamManagersData(team);
  };

  const {
    data: managers,
    error,
    mutate,
    isValidating: managersLoading,
  } = useSWR(`teamManagers*${teamId}`, fetcher);
  return (
    <Row>
      <Col span={3}>
        <TeamSettingsTabs position="managers" />
      </Col>
      <Col span={16}>
        <Card title="Team Managers">
          <List
            bordered
            dataSource={managers}
            renderItem={(item) => (
              <List.Item style={{ cursor: 'pointer' }}>
                <List.Item.Meta
                  avatar={<Avatar src={item?.picture} />}
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

'use client';

import {
  Avatar,
  Button,
  Card,
  Col,
  Flex,
  Input,
  List,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import React, { useState } from 'react';
import { CaretRightOutlined } from '@ant-design/icons';
import useSWR from 'swr';
import { useApplicationContext } from '@/app/_context/appContext';
import UserModal from './_components/user-modal';
import {
  fetchOrgTeamsData,
  fetchOrgUsersData,
  fetchTeamUsersData,
} from './_actions';

const capitalize = require('capitalize');

interface User {
  name: string;
  role: string;
  teamName: string;
  picture?: string;
}

const Page = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { state: appState } = useApplicationContext();
  const { orgId, role, teamId: userTeamId } = appState; // Assuming `role` and `teamId` are in appState

  // Fetch Teams
  const Teamsfetcher = async (orgId: string) => {
    const org = orgId.split('*')[1];
    const data = await fetchOrgTeamsData(org);
    return data;
  };

  useSWR(`orgTeams*${orgId}`, Teamsfetcher, {
    onSuccess: (data) => {
      // Filter teams if the user is not an OWNER (non-owners should not see "All Teams")
      const filteredTeams =
        role === 'OWNER'
          ? data
          : data.filter((team: any) => team.teamId === userTeamId);

      setTeams(filteredTeams ?? []);

      // Set default selected team for non-owners or "All Teams" for owners
      if (role === 'OWNER') {
        setSelectedTeam('All Teams'); // Set "All Teams" by default for owners
      } else if (role !== 'OWNER' && filteredTeams.length > 0) {
        setSelectedTeam(filteredTeams[0].teamId); // Default to user's team for non-owners
      }
    },
  });

  // Fetch Users
  const Usersfetcher = async (key: string) => {
    const [, orgId, teamId] = key.split('*');
    if (teamId === 'All Teams') {
      return await fetchOrgUsersData(orgId);
    }
    return await fetchTeamUsersData(teamId);
  };

  useSWR(`TeamUsers*${orgId}*${selectedTeam}`, Usersfetcher, {
    onSuccess: (data) => {
      setUsers(data ?? []);
      setFilteredUsers(data ?? []);
    },
  });

  // Handle Team Selection
  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
  };

  // Handle Search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const filtered = users.filter((user: any) =>
      user.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  return (
    <Row>
      <Col span={16} push={3} style={{ marginTop: '80px' }}>
        <Card title="Users">
          <Flex gap={15} justify="space-between" style={{ width: '100%' }}>
            <Space size={15}>
              <Select
                placeholder="Select team"
                style={{ width: '100%' }}
                onChange={handleTeamChange}
                value={selectedTeam}
                disabled={role !== 'OWNER'} // Disable select for non-owners
              >
                {/* Show "All Teams" only for owners */}
                {role === 'OWNER' && (
                  <Select.Option key="All Teams" value="All Teams">
                    All Teams
                  </Select.Option>
                )}
                {teams.map(({ teamId, name }: any) => (
                  <Select.Option key={teamId} value={teamId}>
                    {name}
                  </Select.Option>
                ))}
              </Select>
              <Input.Search
                placeholder="Search users"
                style={{ width: '100%' }}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </Space>
            <Space size={15}>
              <Button>Download Report</Button>
              <Button type="primary">Invite Users</Button>
            </Space>
          </Flex>
          <List
            dataSource={filteredUsers}
            style={{ marginTop: '15px' }}
            renderItem={(user, index) => {
              return (
                <Card
                  style={{ marginBottom: '10px' }}
                  bodyStyle={{ padding: '0px 15px' }}
                >
                  <List.Item
                    actions={[
                      <Button
                        key="list-loadmore-edit"
                        size="small"
                        type="link"
                        icon={<CaretRightOutlined />}
                        onClick={() => setSelectedUser(user)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={`${user?.picture}`} />}
                      title={
                        <p style={{ margin: 0, padding: 0 }}>
                          {user?.name}
                          <span
                            style={{
                              paddingLeft: '5px',
                              color: '#ccc',
                              fontWeight: 'normal',
                            }}
                          >
                            ({capitalize(user?.role)})
                          </span>
                        </p>
                      }
                      description={user?.teamName}
                    />
                  </List.Item>
                </Card>
              );
            }}
          />
        </Card>
      </Col>
      <UserModal
        selectedUser={selectedUser}
        update={() => setSelectedUser(null)}
      />
    </Row>
  );
};

export default Page;

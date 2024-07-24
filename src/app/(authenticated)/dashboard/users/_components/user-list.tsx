"use client";

import { fetchAllOrgUsers, fetchTeamMembers } from "@/app/_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import { createClient } from "@/app/_utils/supabase/client";
import { CaretRightOutlined } from "@ant-design/icons";
import { Avatar, List, Row, Col, Select, Card, Space, Button } from "antd";
import Search from "antd/es/input/Search";
import { useEffect, useState, useCallback } from "react";
const capitalize = require("capitalize");

const UserList = () => {
  const { state: appState } = useApplicationContext();
  const { orgId, teams } = appState;

  const teamMap = teams.reduce(
    (accumulator: { [key: string]: string }, team) => {
      const { teamId, name } = team;
      accumulator[teamId] = name;
      return accumulator;
    },
    {}
  );

  const [select, setSelect] = useState("0");

  const [members, setMembers] = useState<
    Array<{ userId: string; name: string; role: string; teamId: string }>
  >([]);
  const [searchResults, setSearchResults] = useState<
    Array<{ userId: string; name: string; role: string; teamId: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async (orgId: string, teamId?: string) => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("User")
        .select("*")
        .eq("orgId", orgId);

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const users = await fetchAllOrgUsers(orgId, false);
      setMembers(users);
      setLoading(false);
      setSelect("0");
    })();
  }, [fetchUsers, orgId, teams]);

  const teamChangeHandler = async (teamId: string) => {
    setSelect(teamId);
    setLoading(true);
    const members =
      teamId === "0"
        ? await fetchAllOrgUsers(orgId, false)
        : await fetchTeamMembers(teamId);
    setMembers(members);
    setLoading(false);
  };

  return (
    <Row gutter={8}>
      <Col span={12} push={6}>
        <Card title="Users">
          <Space style={{ marginBottom: "8px" }}>
            <Select
              placeholder="Select team"
              style={{ width: "100px" }}
              value={select}
              onChange={teamChangeHandler}
            >
              <Select.Option key="0" value="0">
                All Teams
              </Select.Option>
              {teams.map(({ teamId, name }) => (
                <Select.Option key={teamId} value={teamId}>
                  {name}
                </Select.Option>
              ))}
            </Select>
            <Search
              allowClear
              onSearch={(value) => {
                const filtered = members?.filter((member) => {
                  return member.name.includes(value) ? true : false;
                });
                setSearchResults(filtered);
              }}
            />
          </Space>
          <List
            loading={loading}
            dataSource={searchResults.length > 0 ? searchResults : members}
            bordered
            renderItem={(user, index) => {
              return (
                <List.Item
                  actions={[
                    <Button
                      key="list-loadmore-edit"
                      size="small"
                      type="link"
                      href={`users/${user.userId}`}
                      icon={<CaretRightOutlined />}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`}
                      />
                    }
                    title={
                      <p style={{ margin: 0, padding: 0 }}>
                        {user.name}
                        <span
                          style={{
                            paddingLeft: "5px",
                            color: "#ccc",
                            fontWeight: "normal",
                          }}
                        >
                          ({capitalize(user.role)})
                        </span>
                      </p>
                    }
                    description={teamMap[user.teamId]}
                  ></List.Item.Meta>
                </List.Item>
              );
            }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default UserList;

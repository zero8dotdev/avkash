"use client";
import { MoreOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Drawer,
  Dropdown,
  Flex,
  MenuProps,
  Space,
  Table,
  Tabs,
  Tag,
} from "antd";
import Link from "next/link";
import { useState } from "react";
import TeamSettings from "./[teamId]/settings/page";
import LeavePolicyPage from "./[teamId]/leavePolicy/page";
import NotificationPage from "./[teamId]/notifications/page";
import Users from "./[teamId]/users/page";
import Managers from "./[teamId]/managers/page";

const tabItems = [
  {
    key: "1",
    label: "settings",
    children: <TeamSettings />,
  },
  {
    key: "2",
    label: "leave-policy",
    children: <LeavePolicyPage />,
  },
  {
    key: "3",
    label: "notifications",
    children: <NotificationPage />,
  },
  {
    key: "4",
    label: "users",
    children: <Users />,
  },
  {
    key: "5",
    label: "managers",
    children: <Managers />,
  },
];
interface props{
  teams:any,
  status:any,
 
}
interface Props {
  teams: any;
  status: any;
  onDisable: (teamData: any) => void;
  onEnable: (teamData: any) => void;
}

const TeamTableActive:React.FC<Props> = ({ teams, status,onDisable,onEnable}) => {
  const [drawerVisibility, setDrawerVisibility] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>();
  const dataSource = teams?.map((team: any) => ({
    key: team.name,
    name: team.name,
    manager: team.manager,
    users: team.users,
    status: team.status === true ? "Active" : "disabled",
    teamId: team.teamId,
  }));
  const items: MenuProps["items"] = [
    {
      label: (
        <Space onClick={() => setDrawerVisibility(true)}>Team settings</Space>
      ),
      key: 0,
    },
    {
      label: (
        <Space
          style={{ width: "100%" }}
          onClick={() => onDisable(selectedTeam)}
        >
          Disable
        </Space>
      ),
      key: 1,
    },
  ];
  return (
    <Flex gap={12} vertical>
      <Table
      scroll={{x:true}}
        columns={[
          {
            title: "NAME",
            dataIndex: "name",
            key: "name",
            render: (text, rowData) => (
              <Link
                href={`/dashboard/settings/team/${rowData.teamId}/settings`}
                passHref
                style={{ color: "#f52242" }}
              >
                {text}
              </Link>
            ),
          },
          {
            title: "MANGERS",
            dataIndex: "manager",
            key: "manager",
          },
          {
            title: "No.USERS",
            dataIndex: "users",
            key: "users",
          },
          {
            title: "STATUS",
            dataIndex: "status",
            key: "status",
            render: (text, rowData) => {
              return (
                <Tag color={text === "Active" ? "green" : "red"}>{text}</Tag>
              );
            },
          },
          {
            title: "",
            dataIndex: "action",
            key: "action",
            render: (text, rowData) =>
              rowData.status === "Active" ? (
                <Dropdown
                  menu={{ items }}
                  onOpenChange={() => setSelectedTeam(rowData)}
                >
                  <Avatar
                    icon={<MoreOutlined />}
                    style={{ background: "none", color: "#000" }}
                  />
                </Dropdown>
              ) : (
                <Button type="link" onClick={() => onEnable(rowData)} color="green">
                  Enable
                </Button>
              ),
          },
        ]}
        dataSource={dataSource}
        pagination={false}
      />
      <Space>
       
          <Button type="link" href="team/new-team" style={{border:'1px solid blue',marginTop:'12px'}}>
            Add new team
          </Button>
       
      </Space>

      <Drawer
        open={drawerVisibility}
        width="100%"
        footer={
          <Button type="primary" onClick={() => setDrawerVisibility(false)}>
            Cancel
          </Button>
        }
        closable={false}
      >
        <Card  title="Team Settings" >
          <Flex justify="center" align="center" style={{height:'500px'}}>
          <Tag  color="success" style={{width:'15%',height:'10%',fontSize:'25px',display:'flex',justifyContent:'center',alignItems:'center'}}>Coming Soon</Tag>
          </Flex>
          

        </Card>
      </Drawer>
    </Flex>
  );
};

export default TeamTableActive;

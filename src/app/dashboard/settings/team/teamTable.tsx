import { MoreOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Menu, MenuProps, Table } from "antd";
import Link from "next/link";

const TeamTable = (teams: any) => {
  const dataSource = teams.teams?.map((team: any) => ({
    key: team.name,
    name: team.name,
    manager: team.manager,
    users: team.users,
    status: team.status,
    teamId: team.teamId,
  }));

  interface MenuItem {
    key: string;
    label: string;
  }

  const items: MenuItem[] = [
    {
      key: "1",
      label: "settings",
    },
    {
      key: "2",
      label: "leave-policy",
    },
    {
      key: "3",
      label: "notifications",
    },
    {
      key: "4",
      label: "users",
    },
    {
      key: "5",
      label: "managers",
    },
  ];
  return (
    <Table
      columns={[
        {
          title: "NAME",
          dataIndex: "name",
          key: "name",
          render: (text, rowData) => (
            <Link
              href={`/dashboard/settings/team`}
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
        },
        {
          title: "",
          dataIndex: "action",
          key: "action",
          render: (text, rowData) => (
            <Dropdown
              overlay={
                <Menu>
                  {items.map((item) => (
                    <Menu.Item key={item?.key}>
                      <Link
                        href={`settings/team/${rowData.teamId}/${item.label}`}
                      >
                        {item?.label}
                      </Link>
                    </Menu.Item>
                  ))}
                </Menu>
              }
            >
              <Avatar
                icon={<MoreOutlined />}
                style={{ background: "none", color: "#000" }}
              />
            </Dropdown>
          ),
        },
      ]}
      dataSource={dataSource}
      pagination={false}
    />
  );
};

export default TeamTable;

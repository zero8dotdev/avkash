"use client";
import { MoreOutlined } from "@ant-design/icons";
import { Button, Flex, Space, Table, Tag, Typography } from "antd";
import { useRouter } from "next/navigation";

// const tabItems = [
//   {
//     key: "1",
//     label: "settings",
//     children: <TeamSettings />,
//   },
//   {
//     key: "2",
//     label: "leave-policy",
//     children: <LeavePolicyPage />,
//   },
//   {
//     key: "3",
//     label: "notifications",
//     children: <NotificationPage />,
//   },
//   {
//     key: "4",
//     label: "users",
//     children: <Users />,
//   },
//   {
//     key: "5",
//     label: "managers",
//     children: <Managers />,
//   },
// ];

interface Props {
  teams: any;
  status: any;
  onDisable: (teamData: any) => void;
  onEnable: (teamData: any) => void;
}

const TeamTableActive: React.FC<Props> = ({ teams, onDisable, onEnable }) => {
  const router = useRouter();
  const dataSource = teams?.map((team: any) => ({
    key: team.name,
    name: team.name,
    manager: team.manager,
    users: team.users,
    status: team.status === true ? "Active" : "disabled",
    teamId: team.teamId,
  }));
  return (
    <Flex gap={12} vertical>
      <Table
        scroll={{ x: true }}
        columns={[
          {
            title: "NAME",
            dataIndex: "name",
            key: "name",
            render: (text, rowData) => (
              <Typography.Text
                strong
                style={{ cursor: "pointer", color: "#227b83" }}
              >
                {text}
              </Typography.Text>
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
                <Button
                  type="link"
                  onClick={() => onDisable(rowData)}
                  color="green"
                >
                  Disable
                </Button>
              ) : (
                <Button
                  type="link"
                  onClick={() => onEnable(rowData)}
                  color="green"
                >
                  Enable
                </Button>
              ),
          },
        ]}
        dataSource={dataSource}
        pagination={false}
        onRow={(record) => ({
          onClick: () => {
            router.push(`/dashboard/teams/${record.teamId}/settings`);
          },
        })}
      />
      <Space>
        <Button
          type="link"
          href="settings/team/new-team"
          style={{ border: "1px solid blue", marginTop: "12px" }}
        >
          Add new team
        </Button>
      </Space>
    </Flex>
  );
};

export default TeamTableActive;

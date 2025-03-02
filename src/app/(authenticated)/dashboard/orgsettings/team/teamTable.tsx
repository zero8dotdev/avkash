import { MoreOutlined } from '@ant-design/icons';
import { Button, Flex, Space, Table, Tag, Typography } from 'antd';
import { useRouter } from 'next/navigation';

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
    managers: team.managers?.join(', ') || 'No managers', // Join manager names as a comma-separated string
    users: team.users,
    status: team.status === true ? 'Active' : 'disabled',
    teamId: team.teamId,
  }));

  const handleButtonClick = (e: React.MouseEvent, teamData: any) => {
    // Prevent the event from bubbling up and triggering the row click
    e.stopPropagation();
    if (teamData.status === 'Active') {
      onDisable(teamData);
    } else {
      onEnable(teamData);
    }
  };

  return (
    <Flex gap={12} vertical>
      <Table
        scroll={{ x: true }}
        columns={[
          {
            title: 'NAME',
            dataIndex: 'name',
            key: 'name',
            render: (text, rowData) => (
              <Typography.Text
                strong
                style={{ cursor: 'pointer', color: '#227b83' }}
              >
                {text}
              </Typography.Text>
            ),
          },
          {
            title: 'MANAGERS',
            dataIndex: 'managers',
            key: 'managers',
          },
          {
            title: 'No. USERS',
            dataIndex: 'users',
            key: 'users',
          },
          {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            render: (text, rowData) => {
              return (
                <Tag color={text === 'Active' ? 'green' : 'red'}>{text}</Tag>
              );
            },
          },
          {
            title: '',
            dataIndex: 'action',
            key: 'action',
            render: (text, rowData) => (
              <Button
                type="link"
                onClick={(e) => handleButtonClick(e, rowData)} // Handle the click here
                color="green"
              >
                {rowData.status === 'Active' ? 'Disable' : 'Enable'}
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
    </Flex>
  );
};

export default TeamTableActive;

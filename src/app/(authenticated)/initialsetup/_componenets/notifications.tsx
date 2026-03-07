'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Flex,
  Form,
  List,
  Row,
  Switch,
  Typography,
} from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useApplicationContext } from '@/app/_context/appContext';
import useSWR from 'swr';
import TopSteps from './steps';
import {
  fetchTeamGeneralData,
  updateInitialsetupState,
  updateTeamNotificationsSettings,
} from '../_actions';

const { Item } = Form;
const { Group } = Checkbox;

const Notifications = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const {
    state: { orgId, userId, teamId },
  } = useApplicationContext();
  const [loading, setLoading] = useState(false);

  const fetcher = async (key: string) => {
    const team = key.split('*')[1];
    return await fetchTeamGeneralData(team);
  };

  const {
    data: team,
    error,
    mutate,
    isValidating: teamLoading,
  } = useSWR(`teamNotifications*${teamId}`, fetcher);
  // Handle form initial values once team data is fetched
  useEffect(() => {
    if (team) {
      form.setFieldsValue({
        leaveChanged: team.notificationLeaveChanged,
        dailySummary: team.notificationDailySummary,
        weeklySummary: team.notificationWeeklySummary,
        sendntw: team.notificationToWhom || ['OWNER'], // Default to OWNER if no value
      });
    }
  }, [team, form]); // Only update when team data is available

  const handlenext = async () => {
    const formValues = form.getFieldsValue();
    try {
      setLoading(true);
      const data = await updateTeamNotificationsSettings(teamId, {
        ...formValues,
      });
      if (!data) {
        throw new Error('Failed to update team notification settings');
      }

      const status = await updateInitialsetupState(orgId, '5');
      if (status) {
        router.push(
          new URL(
            '/initialsetup/invite-users',
            window?.location.origin
          ).toString()
        );
      } else {
        throw new Error('Failed to update initial setup state');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 10000);
    }
  };

  const handlePrevious = () => {
    router.push(
      new URL('/initialsetup/locations', window?.location.origin).toString()
    );
  };

  return (
    <Row style={{ padding: '50px 50px 180px 20px', height: '100%' }}>
      <TopSteps position={4} />
      <List loading={loading} style={{ width: '100%' }}>
        <Col span={16} push={4}>
          <Card
            style={{
              margin: '25px 0px 25px 0px',
              minHeight: '300px',
              overflow: 'auto',
            }}
          >
            <Form
              form={form}
              name="notifications"
              layout="vertical"
              size="small"
              style={{ marginTop: '25px', width: '70%' }}
            >
              <Flex justify="space-between">
                <Typography.Text>Leave Changed</Typography.Text>
                <Flex gap={15}>
                  <Item name="leaveChanged" valuePropName="checked">
                    <Switch />
                  </Item>
                  <Typography.Text>
                    Send a notification whenever leave is approved or deleted.
                  </Typography.Text>
                </Flex>
              </Flex>
              <Flex justify="space-between">
                <Typography.Text>Daily Summary</Typography.Text>
                <Flex gap={15}>
                  <Item name="dailySummary" valuePropName="checked">
                    <Switch />
                  </Item>
                  <Typography.Text style={{ marginRight: '95px' }}>
                    Send a report of upcoming work days leave
                  </Typography.Text>
                </Flex>
              </Flex>
              <Flex justify="space-between">
                <Typography.Text>Weekly Summary</Typography.Text>
                <Flex gap={15}>
                  <Item name="weeklySummary" valuePropName="checked">
                    <Switch />
                  </Item>
                  <Typography.Text style={{ marginRight: '118px' }}>
                    Send a report of upcoming weeks leave
                  </Typography.Text>
                </Flex>
              </Flex>

              <Item label="Send notifications to" name="sendntw">
                <Group>
                  <Checkbox value="OWNER">Owner</Checkbox>
                  <Checkbox value="MANAGER">Managers</Checkbox>
                </Group>
              </Item>
            </Form>
          </Card>
          <Flex justify="space-between">
            <Button danger icon={<LeftOutlined />} onClick={handlePrevious}>
              Previous
            </Button>
            <Button type="primary" onClick={handlenext}>
              Next
            </Button>
          </Flex>
        </Col>
      </List>
    </Row>
  );
};

export default Notifications;

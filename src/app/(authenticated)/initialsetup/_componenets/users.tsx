'use client';

import { fetchAllUsersFromChatApp } from '@/app/_actions';
import { useApplicationContext } from '@/app/_context/appContext';
import { DeleteOutlined } from '@ant-design/icons';
import {
  Row,
  Col,
  Flex,
  Button,
  List,
  Switch,
  Avatar,
  Form,
  Tooltip,
} from 'antd';
import Item, { Meta } from 'antd/es/list/Item';
import Search from 'antd/es/transfer/search';
import { forwardRef, useImperativeHandle, useState } from 'react';

export const Users = forwardRef(function Users(props, ref) {
  const [users, setUsers] = useState<any[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => ({
    getUsers: () => {
      return users?.map(
        ({ id, profile: { image_48, real_name, email } }: any) => {
          return {
            slackId: id,
            name: real_name,
            email,
            isProrate: !!form.getFieldValue(`user[${id}]`),
          };
        }
      );
    },
  }));

  const {
    state: { orgId },
  } = useApplicationContext();

  const onClickInviteUsers = async () => {
    try {
      setLoading(true);
      const _users = await fetchAllUsersFromChatApp(orgId);
      setUsers(_users);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = (id: string) => {
    const filteredUsers = users?.filter((user) => user.id !== id);
    setUsers(filteredUsers);
  };

  return (
    <Flex vertical gap={8}>
      <Row gutter={8}>
        <Col span={12}>
          <Search placeholder="Search users." onChange={(value) => {}} />
        </Col>
        <Col span={12}>
          <Flex justify="end">
            <Button onClick={onClickInviteUsers} loading={loading}>
              Fetch Slack users
            </Button>
          </Flex>
        </Col>
      </Row>
      <Row gutter={8}>
        <Col span={24}>
          <Form
            name="userList"
            form={form}
            initialValues={{
              user: users?.reduce((acc, user) => {
                acc[user.id] = false; // Default value for prorate switch
                return acc;
              }, {}),
            }}
          >
            <List
              size="small"
              dataSource={users}
              loading={loading}
              locale={{ emptyText: 'All users are already added' }} // Custom empty message
              renderItem={(
                { id, profile: { image_48, real_name, email } },
                index
              ) => {
                return (
                  <Item
                    extra={[
                      <Flex
                        key="extras"
                        justify="center"
                        align="center"
                        gap={32}
                      >
                        <Tooltip title="Prorate">
                          <Form.Item
                            style={{
                              margin: 0,
                              padding: 0,
                              display: 'flex',
                              gap: '8px',
                            }}
                            key="prorate"
                            name={`user[${id}]`}
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                        </Tooltip>
                        <Button
                          key="delete"
                          size="small"
                          type="dashed"
                          danger
                          onClick={() => {
                            deleteUser(id);
                          }}
                          icon={<DeleteOutlined />}
                        />
                      </Flex>,
                    ]}
                  >
                    <Meta
                      title={real_name}
                      avatar={<Avatar src={image_48} />}
                      description={email}
                    />
                  </Item>
                );
              }}
            />
          </Form>
        </Col>
      </Row>
    </Flex>
  );
});

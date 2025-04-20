import { fetchAllUsersFromChatApp } from '@/app/_actions';
import { useApplicationContext } from '@/app/_context/appContext';
import { DeleteOutlined, CheckOutlined } from '@ant-design/icons';
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
  Divider,
} from 'antd';
import Item, { Meta } from 'antd/es/list/Item';
import Search from 'antd/es/transfer/search';
import { forwardRef, useImperativeHandle, useState } from 'react';

export const Users = forwardRef(function Users(props, ref) {
  const [existedUsers, setExistedUsers] = useState<any[]>(); // Print these with a tag of pre-existence
  const [newUsers, setNewUsers] = useState<any[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();
  useImperativeHandle(ref, () => ({
    getUsers: () => {
      const users = [...(existedUsers || []), ...(newUsers || [])];
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
      const _users = await fetchAllUsersFromChatApp(orgId); // fetches {nonExistingUsers,existedUsers}
      console.log('Fetched users:', _users);
      // Separate existed and new users based on the fetched data
      const existed = _users?.existedUsers?.data?.map((user: any) => ({
        id: user.userId,
        profile: {
          image_48: user.picture,
          real_name: user.name,
          email: user.email,
        },
      }));

      const newUsers = _users?.nonExistingUsers?.map((user: any) => ({
        id: user.id,
        profile: {
          image_48: user.profile?.image_48,
          real_name: user?.real_name,
          email: user.profile?.email,
        },
      }));

      setExistedUsers(existed || []);
      setNewUsers(newUsers || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = (id: string) => {
    setExistedUsers((prev) => (prev || []).filter((user) => user.id !== id));
    setNewUsers((prev) => (prev || []).filter((user) => user.id !== id));
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
              user: existedUsers?.reduce((acc, user) => {
                acc[user.id] = false; // Default value for prorate switch
                return acc;
              }, {}),
            }}
          >
            {(newUsers?.length ?? 0) > 0 && (
              <List
                size="small"
                dataSource={newUsers}
                loading={loading}
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
            )}
            <Divider style={{ margin: '4px 0' }} />
            <List
              size="small"
              dataSource={existedUsers}
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
                        {/* <Tooltip title="Prorate">
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
                        </Tooltip> */}
                        <Tooltip title="Already Added!">
                          <Button
                            key="confirm"
                            size="small"
                            type="dashed"
                            style={{ color: 'green', borderColor: 'green' }}
                            icon={<CheckOutlined />}
                          />
                        </Tooltip>
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

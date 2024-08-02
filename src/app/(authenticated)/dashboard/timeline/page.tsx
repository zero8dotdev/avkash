"use client";

import { Flex } from "antd";

import TeamSelect from "./_components/team-select";
import Teams from "./_components/teams";
import LeavePreview from "./_components/leave-preview";
import LeaveCalendar from "./_components/leave-calendar";
import { useState } from "react";
import AddLeave from './_components/add-leave'

export default function Page() {
  const [team, setTeam] = useState<string | undefined>(undefined);

  return (
    <Flex vertical gap={12}>
      <Flex gap={8} align="center" justify="space-between">
        <AddLeave team={team}/>
        <TeamSelect
          changeTeam={(team: string) => {
            setTeam(team);
          }}
        />
      </Flex>
      <Flex gap={8}>
        <Flex
          style={{ height: "200px", width: "100%", padding: "10px" }}
          vertical
        >
          {user ? (
            <>
              <Typography.Title level={5}>Selected User</Typography.Title>
              <Card style={{ width: "100%" }}>
                <Space
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Space direction="vertical">
                    <Typography.Text>{user.name}</Typography.Text>
                    <Typography.Paragraph>{user.email}</Typography.Paragraph>
                  </Space>
                  <Space>
                    <Button
                      onClick={() => setDrawerVisible(true)}
                      disabled={!canAddLeave(user)}
                    >
                      Add leave
                    </Button>
                    <Button onClick={() => setAllLeaveDrawerVisible(true)}>
                      View all leaves
                    </Button>
                  </Space>
                </Space>
              </Card>
            </>
          ) : (
            <p>You have not selected any users yet. </p>
          )}
        </Flex>
      </Modal>
      {/* <Drawer
        closable={false}
        title={
          <Flex gap={18}>
            <Avatar style={{ backgroundColor: "#f56a00" }}>
              {user ? user.name[0].toUpperCase() : null}
            </Avatar>
            <Space.Compact direction="vertical" block>
              <Typography.Title level={4} style={{ margin: "0px" }}>
                {user ? user.name : null}
              </Typography.Title>

              <Typography.Link
                underline={true}
                color="magenta"
                onClick={() => setUserProfileDrawer(true)}
              >
                user profile
              </Typography.Link>
            </Space.Compact>
          </Flex>
        }
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        <Card headStyle={{ backgroundColor: "#4A7696" }} title={<div />}>
          <Typography.Title level={4}>Create new {leaveType}</Typography.Title>
          <Typography.Paragraph disabled={true}>
            On behalf of:
          </Typography.Paragraph>
          <Typography.Title level={5} style={{ lineHeight: "0px" }}>
            {user?.name}
          </Typography.Title>
          <Typography.Paragraph disabled={true}>
            {user?.email}
          </Typography.Paragraph>
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Leave type:"
              name="leaveType"
              initialValue="paid of leave"
            >
              <Radio.Group
                onChange={(e: any) => setLeaveType(e.target.value)}
                value={leaveType}
              >
                <Space direction="vertical">
                  {leavetypes ? (
                    leavetypes.map((each) => (
                      <Radio key={each.leavetypeid} value={each.name}>
                        {each.name}
                      </Radio>
                    ))
                  ) : (
                    <Typography.Paragraph>
                      No leave types available for this organization.
                    </Typography.Paragraph>
                  )}
                </Space>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              label="Requested dates:"
              name="dates"
              rules={[
                {
                  required: true,
                  message: "Please select start and end dates",
                },
              ]}
            >
              <DatePicker.RangePicker />
            </Form.Item>
            <Form.Item
              label="Leave request notes:"
              name="leaveRequestNote"
              initialValue=""
            >
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item
              label="Approve this leave?"
              name="approve"
              initialValue={false}
              valuePropName="checked"
            >
              <Switch disabled={!canApprove(user)} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Drawer> */}
      <UserProfileDrawer
        userProfileDrawer={userProfileDrawer}
        setUserProfileDrawer={setUserProfileDrawer}
        user={user}
      />
      <AllLeavesDrawer
        user={user}
        allLeaveDrawerVisible={allLeaveDrawerVisible}
        setAllLeaveDrawerVisible={setAllLeaveDrawerVisible}
      />
      <ShowCalendarURL userId={userId} teamId={teamId} orgId={orgId} />
      <Tabs
        items={[
          {
            key: "1",
            label: "Today",
            children: "Today",
          },
          {
            key: "2",
            label: "Planned",
            children: "Planned",
          },
          {
            key: "3",
            label: "Pending approval",
            children: "pending approval",
          },
        ]}
      />
    </Flex>
  );
};

export default Timeline;

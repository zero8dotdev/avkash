"use client";
import { fetchAllTeams, fetchleaveTypes, fetchTeamUsers, updateLeaveTypeBasedOnOrg } from "@/app/_actions";
import { Avatar, Button, Flex, List, Modal, Space, Typography } from "antd";
import React, { useEffect, useState } from "react";

interface LeaveType {
  name: string;
  isActive: boolean;
  color: string;
  leaveTypeId: string;
}

interface LeaveTypeDisableProps {
  item: LeaveType | undefined;
  onCancel: () => void;
  orgId: string;
  update:(
    data:any
  )=>void
}

const LeaveTypeDisable: React.FC<LeaveTypeDisableProps> = ({
  item,
  onCancel,
  orgId,
  update
}) => {
  const [teams, setTeams] = useState<any>();
  const [loader,setLoader]=useState<boolean>(false);
  const [teamUsers, setTeamUsers] = useState<{ [teamId: string]: any[] }>({});


  const visible = !!item;


  const handleDisable = async () => {
    setLoader(true)
    await updateLeaveTypeBasedOnOrg(false, orgId, item?.leaveTypeId);
    const data = await fetchleaveTypes(orgId);
    update(data)
    setLoader(false)

    onCancel()
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchAllTeams(orgId);
      
      setTeams(data);
      if(data){
        const usersPromises = data.map(async (team: any) => {
          const users = await fetchTeamUsers(team.teamId);
          return { teamId: team.teamId, users };
        });
  
        const usersData = await Promise.all(usersPromises);
        const usersMap = usersData.reduce((acc: any, { teamId, users }: any) => {
          acc[teamId] = users;
          return acc;
        }, {});
  
        setTeamUsers(usersMap);

      }
      
    };
    fetchData();
  }, [orgId]);

  
  return visible ? (
    <Modal
      width="38%"
      centered={true}
      open={true}
      title={`Are you sure you want to disable ${item.name} leave type?`}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="disable" loading={loader} type="primary" danger onClick={handleDisable}>
          Disable
        </Button>,
      ]}
    >
      <Typography.Paragraph>
        The foloowing teams will be affected if you disable {item.name} leave
        type. Are you sure?
      </Typography.Paragraph>
      <List
        style={{ marginTop: "12px" }}
        bordered
        itemLayout="horizontal"
        dataSource={teams}
        size="small"
        renderItem={(item: any, index) => {
          const users = teamUsers[item.teamId] || [];
          const maxAvatar=5
          const displayedUsers=users.slice(0,maxAvatar)
          const addtitionalUserCount=users.length-maxAvatar
          return (
            <List.Item 
            actions={[
              <Flex key={index}>
              
              {displayedUsers.map((user: any, i: number) => (
                    <Avatar key={i} style={{ backgroundColor: 'pink', marginRight: '4px' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  ))}
                  {addtitionalUserCount > 0 && (
                    <Typography.Text style={{marginTop:'5px'}}>{`+${addtitionalUserCount} more`}</Typography.Text>
                  )}
              </Flex>
              
            ]}
            >
              <List.Item.Meta
                
                title={
                  <Typography.Paragraph style={{ color: "#E71E9A",}}>
                    {item.name}
                  </Typography.Paragraph>
                }
              />
            </List.Item>
          );
        }}
      />
    </Modal>
  ) : (
    false
  );
};

export default LeaveTypeDisable;

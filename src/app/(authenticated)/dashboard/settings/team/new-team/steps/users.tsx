"use client";
import { fetchAllOrgUsers} from "@/app/_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import {
  Avatar,
  Button,
  Card,

  Flex,
  List,

  Select,
 
  Typography,
} from "antd";
import Paragraph from "antd/es/typography/Paragraph";
import { useEffect, useState } from "react";
interface Props{
  Tusers:any[]
  update: (values: any) => void;
}
const Users:React.FC<Props> = ({update,Tusers}) => {
  
  const [users, setUsers] = useState<any[]>([]);
 
  const [selectedValue,setSelectedValue]=useState<any>(null)
  
  const {
    state: { orgId, teams },
  } = useApplicationContext();

  useEffect(() => {
    (async () => {
      const users = await fetchAllOrgUsers(orgId, true);
      setUsers(users);
    })();
  }, [orgId]);

  const onSelectUser = async (userId: string) => {
    
    const user = users.filter((each) => each.userId === userId);
    const isAvailable=Tusers.filter((each)=>each.userId===user[0].userId)
    setSelectedValue(userId)
    if(isAvailable.length===0){
      update([...Tusers, user[0]]);

    }
    
    
  };
  

  const removeUser=(userId:string)=>{
    const newSelectedUsers=Tusers.filter((user)=>user.userId!==userId)
    update(newSelectedUsers)
    
  }

  return (
    <Card style={{ width: "80%" }}>
      <Select placeholder="select users" style={{ width: "40%" }} onSelect={(e) => onSelectUser(e)} value={selectedValue}>
        {users.map((each, index) => (
          <Select.Option key={index} value={each.userId}>
            {each.name}
            <span style={{ marginLeft: "5px", color: "#7acbcc" }}>
              {each.email}
            </span>
          </Select.Option>
        ))}
      </Select>
      <List
        dataSource={Tusers}
        renderItem={(user, i) => {
          const {Team}=user
          console.log(Team)
          return (
            <List.Item
              actions={[
                <>
                  <Button danger onClick={()=>removeUser(user.userId)}>Remove</Button>
                </>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar style={{marginTop:'7px',backgroundColor:'	#22bb33'}}>{user.name.charAt(0).toUpperCase()}</Avatar>}
                title={
                  <Flex gap={8}>
                    <Typography.Paragraph
                      style={{ fontWeight: 600, margin: "0px" }}
                    >
                      {user.name}
                    </Typography.Paragraph>{" "}
                    <span>{user.email}</span>
                  </Flex>
                }
                description={<Paragraph style={{color:'#f0ad4e',margin:'0px'}}>User will be removed from team {user.Team.name} and added to this team</Paragraph>}
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};
export default Users;

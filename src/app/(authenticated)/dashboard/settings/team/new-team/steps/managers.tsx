"use client";
import {
  Avatar,
  Button,
  Card,

  Flex,
  List,

  Select,
 
  Typography,
} from "antd";
interface Props{
  users:any[]
  update: (values: any) => void;
  managers:any
}
const Managers:React.FC<Props> = ({users,update,managers}) => {
    console.log(users)
  
  const onSelectUser = async (userId: string) => {
    const user = users.filter((each) => each.userId === userId);
    update({...user[0]});
    
  };
  

  const removeUser=(userId:string)=>{
    const newSelectedUsers=users.filter((user)=>user.userId!==userId)
    update(newSelectedUsers)
    
  }

  return (
    <Card style={{ width: "80%" }}>
      <Flex gap={8} vertical>
     
      {users.length!==0?
       <Select placeholder="Select manager" style={{ width: "40%" }} onSelect={(e) => onSelectUser(e)}>
       {users.map((each, index) => (
         <Select.Option key={index} value={each.userId}>
           {each.name}
           <span style={{ marginLeft: "5px", color: "#7acbcc" }}>
             {each.email}
           </span>
         </Select.Option>
       ))}
     </Select>
    :<Typography.Title level={4} style={{color:'#ffcc00'}}>Select atleast one use in previous user step.Then select Manger for your team!</Typography.Title>
      }
      
     {managers?
       <List bordered>
       <List.Item
              actions={[
                <>
                  <Button danger onClick={()=>removeUser(managers.userId)}>Remove</Button>
                </>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar style={{backgroundColor:'	#22bb33'}}>{managers.name.charAt(0).toUpperCase()}</Avatar>}
                title={
                  <Flex gap={8} style={{marginTop:'2px'}}>
                    <Typography.Paragraph
                      style={{ fontWeight: 600, margin: "0px" }}
                    >
                      {managers.name}
                    </Typography.Paragraph>{" "}
                    <span>{managers.email}</span>
                  </Flex>
                }
                
              />
            </List.Item>
      </List>
      :null

    }
      </Flex>
    </Card>
  );
};
export default Managers;


import { fetchAllActivities } from "@/app/_actions"
import { Avatar, Steps } from "antd"

export  default async function  Activity({ user }: { user: any }){
  const activities=await fetchAllActivities(user.userId,user.teamId,user.orgId)
  const items=activities?.map((each)=>{

    return {
      title:each.changedOn,
      status:"finish",
      icon: <Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=1`}/>,
    }
  })

    return (
        <>
       <Steps
       direction="vertical"
       />
        </>
    )

}
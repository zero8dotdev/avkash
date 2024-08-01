
import { Avatar, Steps } from "antd"


export  default async function  Activity({ user }: { user: any }){
    return (
        <>
       <Steps
       direction="vertical"
            items={[
                {
                  title: 'Login',
                  status: 'finish',
                  icon: <Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=1`}/>,
                  
                },
                {
                  title: 'Verification',
                  status: 'finish',
                  icon: <Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=1`}/>,
                },
                
              ]}
       />
        </>
    )

}
"use client"
import { CalendarOutlined,  } from "@ant-design/icons";
import { List, Space} from "antd";

export default function LeaveRequests({ user }: { user: any }){

    
     const data:any[]=user.Leave

    const calculateDays = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24)) + 1;
    
        return diffDays;
    };

    
return (
    <List
    dataSource={data}
    
    renderItem={(item, index) => (
        <List.Item style={{
            borderLeft: `8px solid #f28179`,
            borderTopLeftRadius:'5px',
            paddingLeft:'8px',
            marginBottom:'5px'
            
          }}
          extra={<Space >
            <span style={{margin:'10px'}}>{item.reason}</span>

          </Space>}
          >
          <List.Item.Meta
            
            title={<Space><CalendarOutlined/>{item.leaveType}</Space>}
            description={`${item.startDate}-${item.endDate} (${(calculateDays(item.startDate,item.endDate))} working day)`}
          />
        </List.Item>
      )}
    />
)}
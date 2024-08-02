"use client"


import { Card, Flex, Space, Typography } from 'antd';
import React, { useEffect } from 'react'


const leaves = [
    {
      type: "paid time off",
      approve: "PENDING",
      color: "red",
      start:"16.6.2024",
      end:"20.6.2024"
    },
    {
      type: "sick leave",
      approve: "APPROVE",
      color: "blue",
      start:"18.6.2024",
      end:"25.6.2024"
    },
    {
      type: "paid time off",
      approve: "PENDING",
      color: "red",
      start:"16.6.2024",
      end:"20.6.2024"
    },
    {
      type: "sick leave",
      approve: "APPROVE",
      color: "blue",
      start:"18.6.2024",
      end:"25.6.2024"
    }
  ];

 


const LeaveRequest = () => {
    
  return (
    <>
      {leaves.map((each, i) => {
        return (
          <Card style={{ borderLeft: `5px solid ${each.color}`,marginBottom:'5px'}} bodyStyle={{padding:'10px'}} key={i}>
            <Flex justify="space-between" style={{ width: "100%" }}>
              <Space direction="vertical">
              <Typography.Paragraph style={{fontSize:'18px',margin:'0px'}}>{each.type}</Typography.Paragraph>
              <Typography.Text style={{margin:'0px'}}>{each.start}-{each.end}</Typography.Text>
              </Space>
              <Typography.Text type="success">{each.approve}</Typography.Text>
            </Flex>
            
          </Card>
        );
      })}
    </>
  )
}

export default LeaveRequest

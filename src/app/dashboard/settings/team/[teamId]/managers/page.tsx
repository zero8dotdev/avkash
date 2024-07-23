"use client"

import { Card, List, Select } from 'antd'
import React, { useState } from 'react'


const users=['keshav','ashuthosh','yashwanth']
const Managers = () => {
  const [user,setUser]=useState<any[]>([]);

const onChange=(value:any)=>{
  setUser([...user,value])
}

  return (
    <Card title="teamname-users">
    <Select style={{width:'100%'}} onChange={onChange}>
        {users.map((i,index)=>{
          return <Select.Option key={index} value={i}>{i}</Select.Option>
        })}
      </Select>
      {
      user.length!==0 ?
      (
        <List
        dataSource={user}
        renderItem={(i) => <List.Item style={{paddingLeft:'10px'}}>{i}
        <List.Item.Meta>Edit0</List.Item.Meta></List.Item>}
      />
      ):null
      }

     
    </Card>
  )

}

export default Managers

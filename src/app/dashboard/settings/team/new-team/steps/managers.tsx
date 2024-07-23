"use client "
import { Card, Select } from 'antd'
import React, { useState } from 'react'

interface props{
  users:any[]
}


const Managers:React.FC<props> = ({users}) => {
  const [isDisable,setIsDisable]=useState(false)

  const handleOnSelect=()=>{
    setIsDisable(true)
  }

  return (
    <Card style={{width:'50%'}}>
      <Select onSelect={handleOnSelect} disabled={isDisable} style={{width:'50%'}}>
        {
          users.map((each:any,index)=><Select.Option key={index} >{each.name}</Select.Option>)
        }
      </Select>
    </Card>
  )
}

export default Managers

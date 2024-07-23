import { Checkbox, Flex, Form, Select } from 'antd'
import React from 'react'


const teams=[
    {
        id:1,
        name:'team1',

    },
    {
        id:2,
        name:'team2',

    }
]
const Settings = () => {
  return (
    <Flex>
      <Form layout='vertical'>
         <Form.Item label="Team" style={{width:'100px'}}>
            <Select>
                <Select.Option>All Teams</Select.Option>
               {teams.map((each,i)=>{
                return <Select.Option key={i}>{each.name}</Select.Option>
               })}
            </Select>
         </Form.Item>
         <Form.Item>
            <Checkbox>Manager</Checkbox>
            <Checkbox>Admin</Checkbox>
            <Checkbox>Owner</Checkbox>
         </Form.Item>

      </Form>
    </Flex>
  )
}

export default Settings

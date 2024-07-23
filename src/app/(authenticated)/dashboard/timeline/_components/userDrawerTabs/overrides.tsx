import { Checkbox, Flex, Form, Typography } from 'antd'
import React from 'react'

const Overrides = () => {
  return (
    <Flex>
        <Typography.Paragraph>Overrides <span style={{color:'red'}}>let you set a users leave policy on a per-person level</span>,instead of inheritin it from their team.</Typography.Paragraph>
        <Form layout='vertical'>
            <Form.Item>
                <Checkbox>Monday</Checkbox>
                <Checkbox>Tuesday</Checkbox>
                <Checkbox>Wednesday</Checkbox>
                <Checkbox>Thursday</Checkbox>
                <Checkbox>Friday</Checkbox>
                <Checkbox>Saturday</Checkbox>
                <Checkbox>Sunday</Checkbox>
            </Form.Item>
        </Form>
    </Flex>
  )
}

export default Overrides

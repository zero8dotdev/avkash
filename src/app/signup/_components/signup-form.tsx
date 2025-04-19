'use client';

import { signUpAction } from '@/app/_actions';
import { Form, Input, Button, Flex, Card } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignUpForm({ user }: { user: any }) {
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const router = useRouter();

  const userEmail = user?.email;
  const userName = user?.user_metadata.full_name;
  const userCompany = userEmail?.split('@')[1] || '';

  useEffect(() => {
    form.setFieldsValue({
      name: userName,
      company_name: userCompany,
      email: userEmail,
      team_name: userCompany,
    });
  }, [form, userCompany, userEmail, userName]);

  const onFinish = async (values: any) => {
    setIsSaving(true);
    try {
      const data = await signUpAction({
        ...values,
        slackUserId: user?.user_metadata.sub,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsSaving(false);
      router.replace('/initialsetup/settings');
    }
  };

  return (
    <Flex gap={8} justify="center" align="center" style={{ minHeight: '80vh' }}>
      <Card title="Create your Organisation">
        <Form
          form={form}
          layout="vertical"
          className="w-96"
          onFinish={onFinish}
        >
          <Form.Item label="Your Name" name="name" initialValue={userName}>
            <Input type="text" placeholder="Your name" />
          </Form.Item>
          <Form.Item
            label="Company Name"
            name="team_name"
            initialValue={userCompany}
          >
            <Input type="text" placeholder="Company name" disabled />
          </Form.Item>
          {/* <Form.Item
            label="Team Name"
            name="team_name"
            initialValue={"Default"}
          >
            <Input type="text" placeholder="Default team name"></Input>
          </Form.Item> */}
          <Form.Item label="Work Email" name="email" initialValue={userEmail}>
            <Input
              type="text"
              placeholder="yourname@yourcompany.com"
              disabled
            />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" block type="primary" loading={isSaving}>
              Sign up
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Flex>
  );
}

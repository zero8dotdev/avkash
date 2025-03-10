'use client';

import { signUpAction, fetchOrgUsingDomain } from '@/app/_actions';
import { Form, Input, Button, Flex, Card } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// User reaches the signup form only if they do not exist in the DB.
export default function SignUpForm({ user }: { user: any }) {
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const router = useRouter();

  const userEmail = user?.email;
  const userName = user?.user_metadata?.full_name;
  const userCompany = userEmail?.split('@')[1] || '';

  console.log('User:', user);

  useEffect(() => {
    form.setFieldsValue({
      name: userName,
      company_name: userCompany,
      email: userEmail,
      team_name: userCompany,
    });
  }, [form, userCompany, userEmail, userName]);

  console.log('Fine till here');

  const onFinish = async (values: any) => {
    console.log('OnFinish triggered', values);
    setIsSaving(true);

    try {
      const emailDomain = values.email.split('@')[1];
      console.log('Email Domain:', emailDomain);
      const isSlackAdmin = user?.user_metadata?.is_admin;
      // Fetch organization using domain
      const org = await fetchOrgUsingDomain(emailDomain);
      console.log('Fetched Org:', org);

      if (!org) {
        console.log(' No existing organization found, signing up new user...');

        await signUpAction({
          ...values,
          slackUserId: user?.user_metadata.sub,
          isAdmin: isSlackAdmin,
        });

        router.replace(
          isSlackAdmin ? '/initialsetup/connect-slack' : '/you-are-not-admin'
        );
      } else {
        console.log(
          ' Organisation already exists, redirecting to ask-for-invitation.'
        );
        router.replace('/ask-for-invitation');
      }
    } catch (error) {
      console.error(' Error in onFinish:', error);
    } finally {
      setIsSaving(false);
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
          onFinishFailed={(errorInfo) =>
            console.log('Form submission failed:', errorInfo)
          }
        >
          <Form.Item label="Your Name" name="name" initialValue={userName}>
            <Input type="text" placeholder="Your name" />
          </Form.Item>
          <Form.Item
            label="Company Name"
            name="team_name"
            initialValue={userCompany}
          >
            <Input type="text" placeholder="Company name" />
          </Form.Item>
          <Form.Item label="Work Email" name="email" initialValue={userEmail}>
            <Input type="text" placeholder="yourname@yourcompany.com" />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" block type="primary" loading={isSaving}>
              Sign Up
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Flex>
  );
}

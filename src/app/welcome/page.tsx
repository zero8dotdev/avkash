"use client";

import { Form, Input, Button } from "antd";
import { useRouter } from "next/navigation";
import { useApplicationContext } from "../_context/appContext";
import { createClient } from "../_utils/supabase/client";
import { useEffect } from "react";

const supabase = createClient();

export default function Welcome() {
  const router = useRouter();
  const [form] = Form.useForm();
  // const [authState] = useAuthState();

  // console.log(authState?.user.user_metadata);

  const { state, dispatch } = useApplicationContext();
  const { orgId, teamId, userId, user } = state;
  const userEmail = user?.user_metadata.email
  const userName = user?.user_metadata.full_name
  const userCompany = userEmail?.split('@')[1];

  useEffect(() => {
    form.setFieldValue("name",userName);
    form.setFieldValue("company",userCompany);
    form.setFieldValue("email",userEmail);
    form.setFieldValue("team",'Default');
  }, [form,userCompany,userEmail,userName]);

  const onFinish = async (values: any) => {
    const { name, company, team, email } = values;
    try {
      const { data: orgData, error: orgError } = await supabase
        .from("Organisation")
        .insert([
          {
            name: company,
          },
        ])
        .select();

      if (orgError) {
        throw orgError;
      }

      dispatch({ type: "setOrgId", payload: orgData[0].orgId });

      const { data: teamData, dispatcherror: teamError } = await supabase
        .from("Team")
        .insert([
          {
            name: team,
            orgId: orgData[0].orgId,
          },
        ])
        .select();

      if (teamData) {
        dispatch({ type: "setTeamId", payload: teamData[0].teamId });

        const { data: userData, error: userError } = await supabase
          .from("User")
          .insert([
            {
              name: name,
              email: email,
              teamId: teamData[0].teamId,
              isManager: true,
              accruedLeave: 0,
              usedLeave: 0,
            },
          ])
          .select();

        if (userData) {
          dispatch({ type: "setUserId", payload: userData[0].userId });
          const { data, error } = await supabase
            .from("Team")
            .update({ manager: userData[0].userId })
            .eq("teamId", userData[0].teamId);
        }
      }

      form.resetFields();
      router.push("/welcome");
    } catch (error: any) {
      console.log(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-xl font-bold mb-4">Avkash</h1>
      <Form form={form} layout="vertical" className="w-96" onFinish={onFinish}>
        <Form.Item label="Your Name" name="name" initialValue={userName}>
          <Input type="text" placeholder="Your name"></Input>
        </Form.Item>
        <Form.Item label="Company Name" name="company" initialValue={userCompany}>
          <Input type="text" placeholder="Company name"></Input>
        </Form.Item>
        <Form.Item label="Team Name" name="team" initialValue={'Default'}>
          <Input type="text" placeholder="Default team name"></Input>
        </Form.Item>
        <Form.Item label="Work Email" name="email" initialValue={userEmail}>
          <Input type="text" placeholder="yourname@yourcompany.com"></Input>
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" block type="primary">
            Singup
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

"use client";
import { useEffect } from "react";
import { Form, Input, Button, Row, Col } from "antd";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useApplicationContext } from "@/app/_context/appContext";
import { createClient } from "@/app/_utils/supabase/client";

const supabase = createClient();

export default function Welcome() {
  const router = useRouter();
  const [form] = Form.useForm();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const { state, dispatch } = useApplicationContext();
  const { orgId, teamId, userId, user } = state;
  const userEmail = user?.email;
  const userName = user?.full_name;
  const userCompany = userEmail?.split("@")[1];

  useEffect(() => {
    form.setFieldValue("name", userName);
    form.setFieldValue("company", userCompany);
    form.setFieldValue("email", userEmail);
    form.setFieldValue("team", "Default");
  }, [form, userCompany, userEmail, userName]);

  const onFinish = async (values: any) => {
    const { name, company, team, email } = values;
    try {
      const { data, error } = await supabase.rpc("create_org_team_user", {
        org_name: company,
        team_name: team,
        user_name: name,
        user_email: email,
      });
      if (error) {
        throw error;
      }

      if (data) {
        const { org_id, team_id, user_id } = data;
        dispatch({ type: "setOrgId", payload: org_id });
        dispatch({ type: "setTeamId", payload: team_id });
        dispatch({ type: "setUserId", payload: user_id });
      }

      router.push("/setup");
    } catch (error: any) {
      if (error.message === "Organisation already exists") {
        // Handle the specific error for existing organisation
        alert("Organisation already exists. Please choose a different name.");
      } else {
        console.log(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-xl font-bold mb-4">Avkash</h1>
      <Form form={form} layout="vertical" className="w-96" onFinish={onFinish}>
        <Form.Item label="Your Name" name="name" initialValue={userName}>
          <Input type="text" placeholder="Your name"></Input>
        </Form.Item>
        <Form.Item
          label="Company Name"
          name="company"
          initialValue={userCompany}
        >
          <Input type="text" placeholder="Company name"></Input>
        </Form.Item>
        <Form.Item label="Team Name" name="team" initialValue={"Default"}>
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

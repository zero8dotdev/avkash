"use client";
import { useEffect, useState } from "react";
import { Form, Input, Button, Row, Col } from "antd";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useApplicationContext } from "../_context/appContext";
import { createClient } from "../_utils/supabase/client";

export default function Welcome() {
  const router = useRouter();
  const [form] = Form.useForm();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const { state, dispatch } = useApplicationContext();
  const { orgId, teamId, userId } = state;
  const [user, setUser] = useState<any | null | undefined>(null);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      // const { data } = await supabase.auth.getUser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session);
    })();
  }, []);

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

      const { data: teamData, error: teamError } = await supabase
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

  const testSupabaseAuth = async () => {
    const { data, error } = await supabase.from("Organisation").select("*");

    console.log("Org data");
    if (error) {
      console.log(error);
    }

    console.log(data);
  };

  return (
    <Row gutter={8}>
      <Col span={4} push={10}>
        <Button type="primary" onClick={testSupabaseAuth}>
          Test
        </Button>
        <Form
          form={form}
          layout="vertical"
          className="w-96"
          onFinish={onFinish}
        >
          <Form.Item label="Your Name" name="name">
            <Input type="text" placeholder="Your name"></Input>
          </Form.Item>
          <Form.Item label="Company Name" name="company">
            <Input type="text" placeholder="Company name"></Input>
          </Form.Item>
          <Form.Item label="Team Name" name="team">
            <Input type="text" placeholder="Default team name"></Input>
          </Form.Item>
          <Form.Item label="Work Email" name="email">
            <Input type="text" placeholder="yourname@yourcompany.com"></Input>
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" block type="primary">
              Singup
            </Button>
          </Form.Item>
        </Form>
      </Col>
    </Row>
  );
}

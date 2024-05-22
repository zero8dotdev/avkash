"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Button, Form, Input, Typography } from "antd";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function SignUp() {
  const router = useRouter();

  // Step 1: Check if that org with same name is alreay created?
  // Then creation step as it is

  const onFinish = async (values: any) => {
    try {
      //  Check if the organisation already exists
      const { data: existingOrgData, error: existingOrgError } = await supabase
        .from("Organisation")
        .select("*")
        .eq("name", values.companyName);

      if (existingOrgError) {
        throw existingOrgError;
      }

      if (existingOrgData && existingOrgData.length > 0) {
        alert("Company name already exists!");
        return;
      }

      // Create the organisation
      const { data: orgData, error: orgError } = await supabase
        .from("Organisation")
        .insert([{ name: values.companyName }])
        .select();

      if (orgError) {
        throw orgError;
      }

      const organisation = orgData[0];
      localStorage.setItem("orgId", organisation.orgId);

      //Create the team
      const { data: teamData, error: teamError } = await supabase
        .from("Team")
        .insert([{ orgId: organisation.orgId, name: values.teamName }])
        .select();

      if (teamError) {
        await supabase
          .from("Organisation")
          .delete()
          .eq("orgId", organisation.orgId);
        throw teamError;
      }

      const team = teamData[0];
      localStorage.setItem("teamId", team.teamId);

      //  create user

      const { data: userData, error: userError } = await supabase
        .from("User")
        .insert([
          {
            name: values.userName,
            email: values.email,
            teamId: team.teamId,
            isManager: true,
            accruedLeave: 0,
            usedLeave: 0,
          },
        ])
        .select();

      if (userError) {
        await supabase.from("Team").delete().eq("teamId", team.teamId);

        await supabase
          .from("Organisation")
          .delete()
          .eq("orgId", organisation.orgId);
        throw userError;
      }

      localStorage.setItem("userId", userData[0].userId);

      router.push("/welcome");
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <Typography.Title level={3}>Avkash</Typography.Title>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item name="userName" label="User Name">
          <Input placeholder="Enter user name" />
        </Form.Item>
        <Form.Item name="companyName" label="Comapany Name">
          <Input placeholder="Enter company name" />
        </Form.Item>
        <Form.Item name="teamName" label="Team Name">
          <Input placeholder="Enter team name" />
        </Form.Item>
        <Form.Item name="email" label="Working Email">
          <Input type="email" placeholder="Enter mail id" />
        </Form.Item>
        <Form.Item style={{ textAlign: "center" }}>
          <Button htmlType="submit" type="primary" danger>
            Singup
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

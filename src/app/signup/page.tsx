// "use client";

// import { useRouter } from "next/navigation";
// import { Button, Form, Input, Typography } from "antd";
// import { createClient } from "../_utils/supabase/client";

// const supabase = createClient();

// export default function SignUp() {
//   const router = useRouter();

//   // Step 1: Check if that org with same name is alreay created?
//   // Then creation step as it is

//   const onFinish = async (values: any) => {
//     try {
//       //  Check if the organisation already exists
//       const { data: existingOrgData, error: existingOrgError } = await supabase
//         .from("Organisation")
//         .select("*")
//         .eq("name", values.companyName);

//       if (existingOrgError) {
//         throw existingOrgError;
//       }

//       if (existingOrgData && existingOrgData.length > 0) {
//         alert("Company name already exists!");
//         return;
//       }

//       // Create the organisation
//       const { data: orgData, error: orgError } = await supabase
//         .from("Organisation")
//         .insert([{ name: values.companyName }])
//         .select();

//       if (orgError) {
//         throw orgError;
//       }

//       const organisation = orgData[0];
//       localStorage.setItem("orgId", organisation.orgId);

//       //Create the team
//       const { data: teamData, error: teamError } = await supabase
//         .from("Team")
//         .insert([{ orgId: organisation.orgId, name: values.teamName }])
//         .select();

//       if (teamError) {
//         await supabase
//           .from("Organisation")
//           .delete()
//           .eq("orgId", organisation.orgId);
//         throw teamError;
//       }

//       const team = teamData[0];
//       localStorage.setItem("teamId", team.teamId);

//       //  create user

//       const { data: userData, error: userError } = await supabase
//         .from("User")
//         .insert([
//           {
//             name: values.userName,
//             email: values.email,
//             teamId: team.teamId,
//             isManager: true,
//             accruedLeave: 0,
//             usedLeave: 0,
//           },
//         ])
//         .select();

//       if (userError) {
//         await supabase.from("Team").delete().eq("teamId", team.teamId);

//         await supabase
//           .from("Organisation")
//           .delete()
//           .eq("orgId", organisation.orgId);
//         throw userError;
//       }

//       localStorage.setItem("userId", userData[0].userId);

//       router.push("/welcome");
//     } catch (error) {
//       console.error("Transaction failed:", error);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
//       <Typography.Title level={3}>Avkash</Typography.Title>
//       <Form layout="vertical" onFinish={onFinish}>
//         <Form.Item name="userName" label="User Name">
//           <Input placeholder="Enter user name" />
//         </Form.Item>
//         <Form.Item name="companyName" label="Comapany Name">
//           <Input placeholder="Enter company name" />
//         </Form.Item>
//         <Form.Item name="teamName" label="Team Name">
//           <Input placeholder="Enter team name" />
//         </Form.Item>
//         <Form.Item name="email" label="Working Email">
//           <Input type="email" placeholder="Enter mail id" />
//         </Form.Item>
//         <Form.Item style={{ textAlign: "center" }}>
//           <Button htmlType="submit" type="primary" danger>
//             Singup
//           </Button>
//         </Form.Item>
//       </Form>
//     </div>
//   );
// }

"use client";
import { useEffect } from "react";
import { Form, Input, Button, Row, Col } from "antd";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useApplicationContext } from "../_context/appContext";
import { createClient } from "../_utils/supabase/client";

const supabase = createClient();

export default function Welcome() {
  const router = useRouter();
  const [form] = Form.useForm();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const { state, dispatch } = useApplicationContext();
  const { orgId, teamId, userId, user } = state;
  const userEmail = user?.email
  const userName = user?.full_name
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
      const { data, error } = await supabase
        .rpc('create_org_team_user', {
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
        dispatch({ type: 'setOrgId', payload: org_id });
        dispatch({ type: 'setTeamId', payload: team_id });
        dispatch({ type: 'setUserId', payload: user_id });
      }
  
      router.push('/setup');
    } catch (error:any) {
      if (error.message === 'Organisation already exists') {
        // Handle the specific error for existing organisation
        alert('Organisation already exists. Please choose a different name.');
      } else {
        console.log(error.message);
      }
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


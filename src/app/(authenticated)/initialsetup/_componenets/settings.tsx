"use client";
import { Button, Card, Flex, Form, Col, Row, List } from "antd";

import { LeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import TopSteps from "../_componenets/steps";
import { fetchTeamGeneralData, updateInitialsetupState, updateteamsettings } from "../_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import { useState } from "react";
import TeamSettings from "../_componenets/team-settings";
import useSWR from "swr";

const  Setting = () => {
  const router = useRouter();
  const {
    state: { orgId, user, teamId},
    dispatch,
  } = useApplicationContext();


  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetcher = async (teamId: string) => {
    const team = teamId.split("*")[1];
    const data = await fetchTeamGeneralData(team);
  
    // if (error) {
    //   throw new Error("Failed to fetch organization data");
    // }
    return data;
  };
  
    const {
      data: teamData,
      error,
      mutate,
    } = useSWR(`teamGeneral*${teamId}`, fetcher);


  const handlenext = async (values: any) => {
    try {
      // Update team settings
      setLoading(true);
      const data = await updateteamsettings(teamId, { ...values });
      if (!data) {
        // Handle failure to update team settings
        throw new Error("Failed to update team settings");
      }

      // Update initial setup state
      const status = await updateInitialsetupState(orgId, "2");
      if (status) {
        // Navigate to the next page if update is successful
        router.push(
          new URL(
            "/initialsetup/leave-policy",
            window?.location.origin
          ).toString()
        );
      } else {
        // Handle failure to update initial setup state
        throw new Error("Failed to update initial setup state");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 10000);
    }
  };

  const handlePrevious = () => {
    router.push(
      new URL("/initialsetup/connect-slack", window?.location.origin).toString()
    );
  };

  return (
    <Row
      style={{
        padding: "50px 50px 180px 20px",
        height: "100%",
      }}
    >
      <TopSteps position={1} />
      <Col span={16} push={4}>
        <List loading={loading}>
          <Form form={form} layout="vertical" onFinish={handlenext} initialValues={teamData}>
            <Card>
              <TeamSettings form={form} data={teamData} />
            </Card>
            <Flex justify="space-between" style={{ marginTop: "20px" }}>
              <Button danger icon={<LeftOutlined />} onClick={handlePrevious}>
                Previous
              </Button>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Next
                </Button>
              </Form.Item>
            </Flex>
          </Form>
        </List>
      </Col>
    </Row>
  );
};

export default Setting;


// "use client";
// import { Button, Card, Form, Col, Row, List } from "antd";
// import { LeftOutlined } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import TopSteps from "../_componenets/steps";
// import { fetchTeamGeneralData, updateInitialsetupState, updateteamsettings } from "../_actions";
// import { useApplicationContext } from "@/app/_context/appContext";
// import TeamSettings from "../_componenets/team-settings";
// import useSWR from "swr";

// const Setting = () => {
//   const router = useRouter();
//   const {
//     state: { orgId, teamId },
//   } = useApplicationContext();

//   const [form] = Form.useForm();

//   const fetcher = async (teamId: string) => {
//     const team = teamId.split("*")[1];
//     return await fetchTeamGeneralData(team);
//   };

//   const { data: teamData, error, mutate, isValidating } = useSWR(
//     `teamGeneral*${teamId}`,
//     fetcher,
//     {
//       revalidateOnFocus: false,
//     }
//   );

//   const handlenext = async (values: any) => {
//     try {
//       const updatedData = await updateteamsettings(teamId, values);
//       if (!updatedData) throw new Error("Failed to update team settings");

//       // Optimistically update the SWR cache
//       mutate({ ...teamData, ...values }, false);

//       const status = await updateInitialsetupState(orgId, "2");
//       if (status) {
//         router.push(
//           new URL("/initialsetup/leave-policy", window?.location.origin).toString()
//         );
//       } else {
//         throw new Error("Failed to update initial setup state");
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   const handlePrevious = () => {
//     router.push(
//       new URL("/initialsetup/connect-slack", window?.location.origin).toString()
//     );
//   };

//   if (error) return <p>Error loading team data.</p>;

//   return (
//     <Row style={{ padding: "50px 50px 180px 20px", height: "100%" }}>
//       <TopSteps position={1} />
//       <Col span={16} push={4}>
//         <List loading={isValidating}>
//           <Form
//             form={form}
//             layout="vertical"
//             onFinish={handlenext}
//             initialValues={teamData}
//           >
//             <Card>
//               <TeamSettings form={form} data={teamData} />
//             </Card>
//             <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
//               <Button danger icon={<LeftOutlined />} onClick={handlePrevious}>
//                 Previous
//               </Button>
//               <Form.Item>
//                 <Button type="primary" htmlType="submit">
//                   Next
//                 </Button>
//               </Form.Item>
//             </div>
//           </Form>
//         </List>
//       </Col>
//     </Row>
//   );
// };

// export default Setting;

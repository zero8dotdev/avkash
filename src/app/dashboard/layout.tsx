import { Row, Col } from "antd";
import { fetchUser, fetchTeam, fetchOrg } from "../_actions";
import StoreToContext from "../_components/store-to-context";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await fetchUser();
  const org = await fetchOrg(user.orgId);
  const team = await fetchTeam(user.teamId);

  console.log("user in dashboard", user);
  console.log("org in dashboard", org);
  console.log("team in dashboard", team);

  return (
    <>
      <StoreToContext user={user} org={org} team={team} />
      <Row gutter={8} style={{ height: "calc(100vh - 64px)" }}>
        <Col span={24}>{children}</Col>
      </Row>
    </>
  );
}

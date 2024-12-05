import { Row, Col, Grid } from "antd";
import { fetchUser, fetchTeam, fetchOrg, fetchAllTeams } from "@/app/_actions";
import StoreToContext from "@/app/_components/store-to-context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await fetchUser();
  const org = await fetchOrg(user.orgId);
  const team = await fetchTeam(user.teamId);
  // TODO: find better way to make orgId, teamId of current logged in user
  const teams = (await fetchAllTeams(user.orgId)) as Array<object>;

  return (
    <>
      {/* this client side component is used to hydrate the application context */}
      <StoreToContext user={user} org={org} team={team} teams={teams} />
      <Row
        gutter={8}
        style={{
          minHeight: "calc(100vh - 64px)",
          background: "#F2F2F2",
        }}
        className="p-1 lg:p-8"
      >
        <Col span={24}>{children}</Col>
      </Row>
    </>
  );
}

import { fetchUser, fetchTeam, fetchOrg } from "../_actions";
const Page = async function () {
  const user = await fetchUser();

  const org = await fetchOrg(user.orgId);
  const team = await fetchTeam(user.teamId);

  console.log("user in dashboard", user);
  console.log("org in dashboard", org);
  console.log("team in dashboard", team);
  return <div></div>;
};

export default Page;

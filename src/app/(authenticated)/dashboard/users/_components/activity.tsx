import { fetchAllActivities } from "@/app/_actions";
import { Avatar, Steps } from "antd";

export default async function Activity({ user }: { user: any }) {
  const activities = await fetchAllActivities(
    user.userId,
    user.teamId,
    user.orgId
  );

  const items = activities?.map((each) => {
    const getDescription = (each: any) => {
      const isLeaveTableAvailable = {};
    };
    return {
      title: each.changedOn,
      status: "finish",
      icon: <Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=1`} />,
      description: getDescription(each),
    };
  });

  return (
    <>
      {/* @ts-ignore */}
      <Steps direction="vertical" items={items} />
    </>
  );
}

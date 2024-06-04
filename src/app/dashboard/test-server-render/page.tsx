import { Flex } from "antd";
import { createClient } from "@/app/_utils/supabase/server";
import { cache } from "react";

const getUser = cache(async () => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("Organization")
    .select("*")
    .eq("orgId", "ab4cd0fd-82c1-4da9-9a00-380b460ef0a6");

  if (error) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  return data;
});

export const revalidate = 3600;

export default async function Page() {
  const users = await getUser();

  return (
    <Flex vertical justify="center" align="center">
      Hello! from the server side!
      {JSON.stringify(users, null, 2)}
    </Flex>
  );
}

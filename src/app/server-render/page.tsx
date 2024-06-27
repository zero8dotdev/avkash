import { Button, Flex, List } from "antd";
import { createClient } from "../_utils/supabase/admin";
import OrgList from "./_components/list";

const fetchAllOrgs = async () => {
  try {
    const supabaseAdminClient = createClient();
    const { data, error } = await supabaseAdminClient
      .from("Organisation")
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.log("in catch", error);
    return [];
  }
};

export default async function Page() {
  const orgs: any[] = await fetchAllOrgs();

  const actualServerAction = async (name: string) => {
    "use server";
    const supabaseAdminClient = createClient();
    const { data, error } = await supabaseAdminClient.from("User").select();

    return data;
  };

  return (
    <Flex vertical justify="center" align="center" style={{ height: "100vh" }}>
      <div style={{ width: "500px" }}>
        <OrgList organisations={orgs} serverAction={actualServerAction} />
      </div>
    </Flex>
  );
}

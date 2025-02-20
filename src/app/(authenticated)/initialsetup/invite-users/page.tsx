import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Inviteusers from "../_componenets/invite-users";

// If no referer, render the Settings page
const InviteusersPage = async () => {
  const headersList = await headers();
  const referer = headersList.get("referer");
  // If there is a referer, it means the user was redirected
  if (!referer) {
    redirect("/initialsetup/settings");
  }
  return <Inviteusers />;
};

export default InviteusersPage;

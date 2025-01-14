import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Notifications from "../_componenets/notifications";

// If no referer, render the Settings page
const NotificationsPage = async () => {
  const headersList = await headers();
  const referer = headersList.get("referer");
  // If there is a referer, it means the user was redirected
  if (!referer) {
    redirect("/initialsetup/settings");
  }
  return <Notifications />;
};

export default NotificationsPage;

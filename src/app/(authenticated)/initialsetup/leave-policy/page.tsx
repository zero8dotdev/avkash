import { headers } from "next/headers";
import Leavepolicy from "../_componenets/leave-policy";
import { redirect } from 'next/navigation';

  // If no referer, render the Settings page
const LeavepolicyPage = async () => {
  const headersList = await headers();
  const referer = headersList.get('referer');
  // If there is a referer, it means the user was redirected
  if (!referer) {
    redirect('/initialsetup/settings');
  }
  return <Leavepolicy />;
};

export default LeavepolicyPage;

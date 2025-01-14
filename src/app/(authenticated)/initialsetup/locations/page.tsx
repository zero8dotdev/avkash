import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Location from "../_componenets/location";

// If no referer, render the Settings page
const LocationsPage = async () => {
  const headersList = await headers();
  const referer = headersList.get("referer");
  // If there is a referer, it means the user was redirected
  if (!referer) {
    redirect("/initialsetup/settings");
  }
  return <Location />;
};

export default LocationsPage;

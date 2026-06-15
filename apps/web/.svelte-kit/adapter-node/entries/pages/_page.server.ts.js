import { redirect } from "@sveltejs/kit";
const load = async () => {
  throw redirect(302, "/dashboard");
};
export {
  load
};

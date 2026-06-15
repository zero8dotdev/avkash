import { redirect } from "@sveltejs/kit";
const load = async ({ parent }) => {
  const { notAuthorized } = await parent();
  if (!notAuthorized) {
    throw redirect(302, "/admin/leave-types");
  }
  return {};
};
export {
  load
};

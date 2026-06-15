const load = async ({ locals }) => {
  const user = locals.user;
  if (!user || user.role !== "ADMIN" && user.role !== "OWNER") {
    return { user, notAuthorized: true };
  }
  return { user, notAuthorized: false };
};
export {
  load
};

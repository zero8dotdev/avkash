import { f as fail, e as error } from './index-BkmUvga9.js';
import { a as apiFetch, b as apiFetchData } from './api-BrE3GIFe.js';

const load = async ({ params, locals, request }) => {
  const cookie = request.headers.get("cookie") ?? "";
  const user = locals.user;
  const subjectId = params.id;
  const isSelfView = user.id === subjectId;
  const isHrAdminView = user.role === "ADMIN" || user.role === "OWNER" || user.role === "MANAGER";
  const [userResult, empResult, teamsResult, locationsResult] = await Promise.all([
    isSelfView && !isHrAdminView ? apiFetch("/me", cookie).then((r) => ({
      ...r,
      data: r.data?.user
    })) : apiFetch(`/users/${subjectId}`, cookie),
    apiFetch(`/employees/${subjectId}`, cookie),
    apiFetchData("/teams", cookie),
    apiFetchData("/locations", cookie)
  ]);
  if (userResult.status === 404) {
    throw error(404, "Employee not found");
  }
  if (userResult.status === 403) {
    throw error(403, "You do not have access to this employee profile");
  }
  if (!userResult.data) {
    throw error(500, "Failed to load employee profile");
  }
  const subject = userResult.data;
  const employeeProfile = empResult.data ?? {};
  const empStatus = empResult.status;
  const isSelf = user.id === subjectId;
  const isHrAdmin = user.role === "ADMIN" || user.role === "OWNER";
  const canEdit = isSelf || isHrAdmin;
  const etag = empResult.etag;
  const DEFAULT_MATRIX = {
    USER: { basic: "read", contact: "none", employment: "none", compensation: "none", identity: "none", medical: "none" },
    MANAGER: { basic: "read", contact: "read", employment: "read", compensation: "none", identity: "none", medical: "none" },
    ADMIN: { basic: "write", contact: "write", employment: "write", compensation: "write", identity: "write", medical: "write" },
    OWNER: { basic: "write", contact: "write", employment: "write", compensation: "write", identity: "write", medical: "write" },
    subject: { basic: "write", contact: "write", employment: "read", compensation: "read", identity: "none", medical: "none" }
  };
  const effectiveRole = isSelf ? "subject" : user.role;
  const roleGrant = DEFAULT_MATRIX[effectiveRole] ?? DEFAULT_MATRIX["USER"];
  const groupAccess = { ...roleGrant };
  return {
    user,
    subject,
    employeeProfile,
    empStatus,
    isSelf,
    isHrAdmin,
    canEdit,
    groupAccess,
    teams: teamsResult ?? [],
    locations: locationsResult ?? [],
    etag
  };
};
const actions = {
  updateProfile: async ({ request, params, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const user = locals.user;
    const subjectId = params.id;
    const data = await request.formData();
    const isSelf = user.id === subjectId;
    const isHrAdmin = user.role === "ADMIN" || user.role === "OWNER";
    if (!isSelf && !isHrAdmin) {
      return fail(403, { updateError: { code: "FORBIDDEN", message: "You cannot edit this profile" } });
    }
    const etag = data.get("_etag");
    const patch = {};
    const fields = [
      "designation",
      "employeeCode",
      "personalEmail",
      "personalPhone",
      "address",
      "workLocation",
      "employmentType",
      "employmentStatus",
      "gender",
      "maritalStatus",
      "nationality",
      "dateOfBirth"
    ];
    for (const f of fields) {
      const val = data.get(f);
      if (val !== null) patch[f] = val === "" ? null : val;
    }
    if (Object.keys(patch).length === 0) {
      return fail(400, { updateError: { code: "VALIDATION", message: "No fields to update" } });
    }
    const endpoint = isSelf ? "/employees/me" : `/employees/${subjectId}`;
    const headers = {};
    if (etag) headers["If-Match"] = etag;
    const result = await apiFetch(endpoint, cookie, {
      method: "PATCH",
      headers,
      body: JSON.stringify(patch)
    });
    if (result.error) {
      return fail(result.status || 400, { updateError: result.error });
    }
    return { updateSuccess: true };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

const index = 15;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-Ceu0PxXo.js')).default;
const server_id = "src/routes/employees/[id]/+page.server.ts";
const imports = ["_app/immutable/nodes/15.50cBSolA.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/D-q6HbuA.js","_app/immutable/chunks/DD-_xbeO.js","_app/immutable/chunks/9N0L4DTv.js","_app/immutable/chunks/BvXRaNk8.js","_app/immutable/chunks/Bpp-4mxF.js","_app/immutable/chunks/Dfsh8lEb.js","_app/immutable/chunks/BI7nSIaz.js","_app/immutable/chunks/BguxzEhB.js","_app/immutable/chunks/BYcAmK0v.js","_app/immutable/chunks/D49kVdkG.js"];
const stylesheets = ["_app/immutable/assets/ErrorBanner.C1OswYdo.css","_app/immutable/assets/15.DtnUZw-d.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=15-DEzQluYh.js.map

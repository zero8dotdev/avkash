import { fail } from "@sveltejs/kit";
import { a as apiFetch, b as apiFetchData } from "../../../chunks/api.js";
const load = async ({ locals, request, url }) => {
  const cookie = request.headers.get("cookie") ?? "";
  const user = locals.user;
  const tab = url.searchParams.get("tab") ?? "list";
  const isManager = user.role === "MANAGER" || user.role === "ADMIN" || user.role === "OWNER";
  const [transfersResult, locationsResult, departmentsResult] = await Promise.all([
    apiFetchData("/transfers", cookie),
    apiFetchData("/locations", cookie),
    apiFetchData("/departments", cookie)
  ]);
  let users = [];
  if (isManager) {
    users = await apiFetchData("/users", cookie) ?? [];
  }
  return {
    user,
    transfers: transfersResult ?? [],
    locations: locationsResult ?? [],
    departments: departmentsResult ?? [],
    users,
    tab,
    isManager
  };
};
const actions = {
  // Initiate a transfer (ADMIN+)
  request: async ({ request, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const user = locals.user;
    if (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "MANAGER") {
      return fail(403, { requestError: { code: "FORBIDDEN", message: "Only MANAGER+ can initiate transfers" } });
    }
    const data = await request.formData();
    const userId = data.get("userId");
    const fromLocationId = data.get("fromLocationId");
    const toLocationId = data.get("toLocationId");
    const type = data.get("type");
    const startDate = data.get("startDate");
    const endDate = data.get("endDate") || null;
    const notes = data.get("notes") || null;
    const fromDepartmentId = data.get("fromDepartmentId") || null;
    const toDepartmentId = data.get("toDepartmentId") || null;
    if (!userId || !fromLocationId || !toLocationId || !type || !startDate) {
      return fail(400, {
        requestError: { code: "VALIDATION", message: "User, from/to locations, type, and start date are required" }
      });
    }
    const idempotencyKey = `transfer-${user.id}-${userId}-${startDate}-${Date.now()}`;
    const result = await apiFetch("/transfers", cookie, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({
        userId,
        fromLocationId,
        toLocationId,
        fromDepartmentId: fromDepartmentId || void 0,
        toDepartmentId: toDepartmentId || void 0,
        type,
        startDate,
        endDate: endDate || void 0,
        notes: notes || void 0
      })
    });
    if (result.error) {
      return fail(result.status || 400, { requestError: result.error });
    }
    return { requestSuccess: true, transferId: result.data?.id };
  },
  // Approve a transfer (ADMIN+)
  // NOTE: Approval triggers fast-lane FGA revoke + relay propagation.
  // The old manager will lose /employees visibility after syncOrgTuples runs.
  approve: async ({ request, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const user = locals.user;
    if (user.role !== "ADMIN" && user.role !== "OWNER") {
      return fail(403, { approveError: { code: "FORBIDDEN", message: "Only ADMIN can approve transfers" } });
    }
    const data = await request.formData();
    const transferId = data.get("transferId");
    if (!transferId) return fail(400, { approveError: { code: "VALIDATION", message: "transferId required" } });
    const result = await apiFetch(`/transfers/${transferId}/approve`, cookie, { method: "POST" });
    if (result.error) {
      return fail(result.status || 400, { approveError: result.error });
    }
    return { approveSuccess: true, approvedTransferId: transferId };
  },
  // Cancel a transfer
  cancel: async ({ request, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const user = locals.user;
    if (user.role !== "ADMIN" && user.role !== "OWNER") {
      return fail(403, { cancelError: { code: "FORBIDDEN", message: "Only ADMIN can cancel transfers" } });
    }
    const data = await request.formData();
    const transferId = data.get("transferId");
    if (!transferId) return fail(400, { cancelError: { code: "VALIDATION", message: "transferId required" } });
    const result = await apiFetch(`/transfers/${transferId}/cancel`, cookie, { method: "POST" });
    if (result.error) {
      return fail(result.status || 400, { cancelError: result.error });
    }
    return { cancelSuccess: true };
  }
};
export {
  actions,
  load
};

import { fail } from "@sveltejs/kit";
import { a as apiFetch, b as apiFetchData } from "../../../../chunks/api.js";
const load = async ({ request, parent }) => {
  const { notAuthorized } = await parent();
  if (notAuthorized) return { blackouts: [], locations: [], leaveTypes: [] };
  const cookie = request.headers.get("cookie") ?? "";
  const [blackouts, locations, leaveTypes] = await Promise.all([
    apiFetchData("/blackouts", cookie),
    apiFetchData("/locations", cookie),
    apiFetchData("/leave-types", cookie)
  ]);
  return {
    blackouts: blackouts ?? [],
    locations: locations ?? [],
    leaveTypes: leaveTypes ?? []
  };
};
const actions = {
  create: async ({ request, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const name = data.get("name")?.trim();
    const startDate = data.get("startDate");
    const endDate = data.get("endDate");
    const leaveTypeId = data.get("leaveTypeId") || null;
    const locationId = data.get("locationId") || null;
    if (!name || !startDate || !endDate) {
      return fail(400, { createError: { code: "VALIDATION", message: "Name, start date, and end date are required" } });
    }
    const idempotencyKey = `blackout-create-${locals.user.id}-${startDate}-${endDate}-${Date.now()}`;
    const result = await apiFetch("/blackouts", cookie, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({
        name,
        startDate,
        endDate,
        leaveTypeId: leaveTypeId || void 0,
        locationId: locationId || void 0
      })
    });
    if (result.error) {
      return fail(result.status || 400, { createError: result.error });
    }
    return { createSuccess: true };
  },
  delete: async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const data = await request.formData();
    const id = data.get("id");
    if (!id) return fail(400, { deleteError: { code: "VALIDATION", message: "id required" } });
    const result = await apiFetch(`/blackouts/${id}`, cookie, { method: "DELETE" });
    if (result.error) {
      return fail(result.status || 400, { deleteError: result.error });
    }
    return { deleteSuccess: true };
  }
};
export {
  actions,
  load
};

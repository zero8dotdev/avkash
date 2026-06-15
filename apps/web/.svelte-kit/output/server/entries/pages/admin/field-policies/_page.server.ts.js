import { fail } from "@sveltejs/kit";
import { a as apiFetch, b as apiFetchData } from "../../../../chunks/api.js";
const DEFAULTS = {
  USER: {
    basic: "read",
    contact: "none",
    employment: "none",
    compensation: "none",
    identity: "none",
    medical: "none"
  },
  MANAGER: {
    basic: "read",
    contact: "read",
    employment: "read",
    compensation: "none",
    identity: "none",
    medical: "none"
  },
  ADMIN: {
    basic: "write",
    contact: "write",
    employment: "write",
    compensation: "write",
    identity: "write",
    medical: "write"
  },
  OWNER: {
    basic: "write",
    contact: "write",
    employment: "write",
    compensation: "write",
    identity: "write",
    medical: "write"
  },
  subject: {
    basic: "write",
    contact: "write",
    employment: "read",
    compensation: "read",
    identity: "none",
    medical: "none"
  },
  hrbp: {
    basic: "read",
    contact: "read",
    employment: "read",
    compensation: "none",
    // overridden by field_policy row in seed
    identity: "none",
    medical: "none"
  }
};
const FIELD_GROUPS = ["basic", "contact", "employment", "compensation", "identity", "medical"];
const RELATIONS = ["USER", "MANAGER", "ADMIN", "OWNER", "subject", "hrbp"];
const ACCESS_VALUES = ["read", "write", "none"];
const load = async ({ request, parent }) => {
  const { notAuthorized } = await parent();
  if (notAuthorized) return { policies: [], defaults: DEFAULTS, fieldGroups: [...FIELD_GROUPS], relations: [...RELATIONS] };
  const cookie = request.headers.get("cookie") ?? "";
  const policies = await apiFetchData("/field-policies", cookie);
  return {
    policies: policies ?? [],
    defaults: DEFAULTS,
    fieldGroups: [...FIELD_GROUPS],
    relations: [...RELATIONS],
    accessValues: [...ACCESS_VALUES]
  };
};
const actions = {
  // Upsert a policy row (POST — create or replace)
  upsert: async ({ request, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const user = locals.user;
    if (user.role !== "ADMIN" && user.role !== "OWNER") {
      return fail(403, { upsertError: { code: "FORBIDDEN", message: "Admin only" } });
    }
    const data = await request.formData();
    const resource = data.get("resource") || "employee";
    const fieldGroup = data.get("fieldGroup");
    const relation = data.get("relation");
    const access = data.get("access");
    if (!fieldGroup || !relation || !access) {
      return fail(400, { upsertError: { code: "VALIDATION", message: "fieldGroup, relation, and access are required" } });
    }
    if (!ACCESS_VALUES.includes(access)) {
      return fail(400, { upsertError: { code: "VALIDATION", message: "access must be read | write | none" } });
    }
    const idempotencyKey = `field-policy-${user.id}-${resource}-${fieldGroup}-${relation}-${Date.now()}`;
    const result = await apiFetch("/field-policies", cookie, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ resource, fieldGroup, relation, access })
    });
    if (result.error) {
      return fail(result.status || 400, { upsertError: result.error });
    }
    return { upsertSuccess: true, upsertedPolicy: result.data };
  },
  // PATCH an existing policy row (version-checked, ETag/If-Match)
  patch: async ({ request, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const user = locals.user;
    if (user.role !== "ADMIN" && user.role !== "OWNER") {
      return fail(403, { patchError: { code: "FORBIDDEN", message: "Admin only" } });
    }
    const data = await request.formData();
    const id = data.get("id");
    const access = data.get("access");
    const version = data.get("version");
    if (!id || !access) {
      return fail(400, { patchError: { code: "VALIDATION", message: "id and access are required" } });
    }
    const result = await apiFetch(`/field-policies/${id}`, cookie, {
      method: "PATCH",
      headers: { "If-Match": `"${version}"` },
      body: JSON.stringify({ access })
    });
    if (result.error) {
      return fail(result.status || 400, { patchError: result.error });
    }
    return { patchSuccess: true, patchedPolicy: result.data };
  },
  // DELETE a policy row
  delete: async ({ request, locals }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const user = locals.user;
    if (user.role !== "ADMIN" && user.role !== "OWNER") {
      return fail(403, { deleteError: { code: "FORBIDDEN", message: "Admin only" } });
    }
    const data = await request.formData();
    const id = data.get("id");
    if (!id) return fail(400, { deleteError: { code: "VALIDATION", message: "id required" } });
    const result = await apiFetch(`/field-policies/${id}`, cookie, { method: "DELETE" });
    if (result.error) {
      return fail(result.status || 400, { deleteError: result.error });
    }
    return { deleteSuccess: true, deletedId: id };
  }
};
export {
  actions,
  load
};

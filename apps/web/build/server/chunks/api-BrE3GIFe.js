const API_BASE = process.env.PUBLIC_API_URL ?? "http://localhost:3001";
async function apiFetch(path, cookie, init) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        cookie,
        ...init?.headers ?? {}
      }
    });
    const body = await res.json();
    const etag = res.headers.get("etag") ?? void 0;
    if (body !== null && typeof body === "object" && !Array.isArray(body)) {
      const b = body;
      if ("error" in b) {
        return { error: b.error, status: res.status, etag };
      }
      if ("data" in b) {
        return { data: b.data, status: res.status, etag };
      }
      return { data: body, status: res.status, etag };
    }
    return { data: body, status: res.status, etag };
  } catch {
    return {
      error: { code: "NETWORK_ERROR", message: "Failed to reach the API" },
      status: 0
    };
  }
}
async function apiFetchData(path, cookie, init) {
  const result = await apiFetch(path, cookie, init);
  return result.data ?? null;
}

export { apiFetch as a, apiFetchData as b };
//# sourceMappingURL=api-BrE3GIFe.js.map

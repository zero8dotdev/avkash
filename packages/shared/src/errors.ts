// Typed domain errors. Transports map these to their own wire format (HTTP status,
// Slack message, chat reply) — the domain never knows the transport OR the language.
//
// Errors carry a stable machine `code` (also the i18n message key), an HTTP `status`,
// and structured `params` (interpolation values + response details). The human
// message is resolved at the edge from `code` + locale (see error-messages.ts / plans/15).
export type ErrorParams = Record<string, unknown>;

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly params?: ErrorParams,
    options?: { cause?: unknown }
  ) {
    super(code, options); // dev fallback; client-facing text is localized at the edge
    this.name = new.target.name;
  }
}

// ── Layer 1 — Authentication (401) ──────────────────────────────────────────
export class UnauthenticatedError extends DomainError {
  constructor(code = 'UNAUTHENTICATED', params?: ErrorParams, options?: { cause?: unknown }) {
    super(code, 401, params, options);
  }
}

// ── Layer 2 — Authorization (403) ───────────────────────────────────────────
export class ForbiddenError extends DomainError {
  constructor(code = 'FORBIDDEN', params?: ErrorParams, options?: { cause?: unknown }) {
    super(code, 403, params, options);
  }
}

// ── Layer 3 — Business (400 / 404 / 409 / 422) ──────────────────────────────
export class ValidationError extends DomainError {
  constructor(code = 'VALIDATION_FAILED', params?: ErrorParams, options?: { cause?: unknown }) {
    super(code, 400, params, options);
  }
}
export class NotFoundError extends DomainError {
  constructor(code = 'NOT_FOUND', params?: ErrorParams, options?: { cause?: unknown }) {
    super(code, 404, params, options);
  }
}
export class ConflictError extends DomainError {
  constructor(code = 'CONFLICT', params?: ErrorParams, options?: { cause?: unknown }) {
    super(code, 409, params, options);
  }
}
export class BusinessRuleError extends DomainError {
  constructor(code: string, params?: ErrorParams, options?: { cause?: unknown }) {
    super(code, 422, params, options);
  }
}
// Optimistic concurrency: If-Match precondition missing (428) or stale (412).
export class PreconditionRequiredError extends DomainError {
  constructor(code = 'PRECONDITION_REQUIRED', params?: ErrorParams, options?: { cause?: unknown }) {
    super(code, 428, params, options);
  }
}
export class PreconditionFailedError extends DomainError {
  constructor(code = 'PRECONDITION_FAILED', params?: ErrorParams, options?: { cause?: unknown }) {
    super(code, 412, params, options);
  }
}

// ── Layer 4 — System (500) ──────────────────────────────────────────────────
export class InternalError extends DomainError {
  constructor(code = 'INTERNAL', params?: ErrorParams, options?: { cause?: unknown }) {
    super(code, 500, params, options);
  }
}

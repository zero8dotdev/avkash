// Typed domain errors. Transports map these to their own wire format (HTTP status,
// Slack message, chat reply) — the domain never knows the transport OR the language.
//
// Each error carries a stable machine `code`, an HTTP `status`, and structured
// `params` (interpolation values + response details). `message` is a dev-facing
// fallback; the client-facing text is localized at the edge by `code` (see plans/15).
export type ErrorParams = Record<string, unknown>

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly params?: ErrorParams,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = new.target.name
  }
}

// ── Layer 1 — Authentication (401) ──────────────────────────────────────────
export class UnauthenticatedError extends DomainError {
  constructor(message = 'Not authenticated', params?: ErrorParams) {
    super('UNAUTHENTICATED', 401, message, params)
  }
}

// ── Layer 2 — Authorization (403) ───────────────────────────────────────────
export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden', params?: ErrorParams) {
    super('FORBIDDEN', 403, message, params)
  }
}

// ── Layer 3 — Business (400 / 404 / 409 / 422) ──────────────────────────────
export class ValidationError extends DomainError {
  constructor(message = 'Invalid input', params?: ErrorParams) {
    super('VALIDATION_FAILED', 400, message, params)
  }
}
export class NotFoundError extends DomainError {
  constructor(message = 'Not found', params?: ErrorParams) {
    super('NOT_FOUND', 404, message, params)
  }
}
export class ConflictError extends DomainError {
  constructor(message = 'Conflict', params?: ErrorParams) {
    super('CONFLICT', 409, message, params)
  }
}
export class BusinessRuleError extends DomainError {
  constructor(message: string, params?: ErrorParams) {
    super('BUSINESS_RULE', 422, message, params)
  }
}

// ── Layer 4 — System (500) ──────────────────────────────────────────────────
export class InternalError extends DomainError {
  constructor(message = 'Internal error', params?: ErrorParams) {
    super('INTERNAL', 500, message, params)
  }
}

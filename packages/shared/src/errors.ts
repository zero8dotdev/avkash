// Typed domain errors. Transports map these to their own wire format
// (HTTP status, Slack message, chat reply) — the domain never knows the transport.
export class DomainError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = new.target.name
  }
}
export class UnauthenticatedError extends DomainError {
  constructor(message = 'Not authenticated') { super('UNAUTHENTICATED', message) }
}
export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden') { super('FORBIDDEN', message) }
}
export class NotFoundError extends DomainError {
  constructor(message = 'Not found') { super('NOT_FOUND', message) }
}

import { ConflictError, ValidationError, type DomainError } from './errors';

interface PgLikeError {
  code?: string;
  column_name?: string;
  constraint_name?: string;
  detail?: string;
}

// Translate a Postgres driver error into a DomainError — or null if it isn't a
// constraint violation we recognise. Unrecognised DB errors deliberately stay
// 500s: a unique/FK clash is the user's fault (4xx), but an unexpected DB failure
// is ours and must not be masked as a client error.
export function mapDatabaseError(err: unknown): DomainError | null {
  const e = err as PgLikeError | null;
  if (!e || typeof e.code !== 'string') return null;
  switch (e.code) {
    case '23505': // unique_violation
      return new ConflictError('CONFLICT', { constraint: e.constraint_name });
    case '23503': // foreign_key_violation
      return new ValidationError('FK_VIOLATION', {
        constraint: e.constraint_name,
      });
    case '23502': // not_null_violation
      return new ValidationError('REQUIRED_FIELD', { field: e.column_name });
    case '23514': // check_violation
      return new ValidationError('CHECK_VIOLATION', {
        constraint: e.constraint_name,
      });
    case '22P02': // invalid_text_representation (bad uuid / enum cast)
      return new ValidationError('INVALID_INPUT');
    default:
      return null;
  }
}

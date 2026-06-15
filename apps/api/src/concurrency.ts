import type { Context } from 'hono';
import { PreconditionRequiredError } from '@avkash/shared';

// Optimistic-concurrency helpers shared by the mutable resources. ETag = the
// resource's version, quoted (a strong validator).
export const etag = (version: number) => `"${version}"`;

// Require an If-Match header (428 if missing) and parse it to the expected version.
// The domain then does the compare-and-swap; a stale version → 412.
export function requireIfMatch(c: Context): number {
  const header = c.req.header('if-match');
  if (!header) throw new PreconditionRequiredError('PRECONDITION_REQUIRED');
  return Number(header.replace(/"/g, ''));
}

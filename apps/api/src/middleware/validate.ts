import { createMiddleware } from 'hono/factory';
import type { z } from 'zod';
import { validate } from '@avkash/shared';

// Parse + validate a JSON body at the edge, replacing the repeated
// `validate(schema, await c.req.json().catch(() => ({})))` in every handler.
// A missing or unparseable body becomes {} so the schema reports precise field
// errors rather than a parse failure; all failures throw ValidationError, which
// the central onError localizes. The validated, fully-typed value is stashed on
// the context — handlers read it as c.get('body'), typed as z.infer<schema>.
export const validateBody = <S extends z.ZodType>(schema: S) =>
  createMiddleware<{ Variables: { body: z.infer<S> } }>(async (c, next) => {
    c.set('body', validate(schema, await c.req.json().catch(() => ({}))));
    await next();
  });

import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '@avkash/shared';
import {
  applyLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  listLeaves,
  getLeave,
  addLeaveComment,
  listLeaveComments,
  type ListLeavesFilter,
} from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

const applyLeaveSchema = z.object({
  leaveTypeId: z.string().min(1),
  startDate: DATE,
  endDate: DATE,
  duration: z.enum(['FULL_DAY', 'HALF_DAY']).optional(),
  shift: z.enum(['MORNING', 'AFTERNOON', 'NONE']).optional(),
  reason: z.string().max(1000).optional(),
  userId: z.string().optional(),
});
const decisionSchema = z.object({ comment: z.string().max(2000).optional() });
const addCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  visibility: z.enum(['INTERNAL', 'SHARED']).optional(),
});

// Thin transport adapter. Logic + authz live in @avkash/leave; this just maps HTTP
// and validates the request body at the boundary before it reaches the domain.
export const leaves = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', async (c) => {
    const body = validate(
      applyLeaveSchema,
      await c.req.json().catch(() => ({}))
    );
    return c.json(await applyLeave(c.get('auth'), body), 201);
  })
  .get('/', async (c) => {
    const filter: ListLeavesFilter = {
      status: c.req.query('status') as ListLeavesFilter['status'],
      userId: c.req.query('userId'),
    };
    return c.json(await listLeaves(c.get('auth'), filter));
  })
  .get('/:id', async (c) =>
    c.json(await getLeave(c.get('auth'), c.req.param('id')))
  )
  .post('/:id/approve', async (c) => {
    const { comment } = validate(
      decisionSchema,
      await c.req.json().catch(() => ({}))
    );
    return c.json(
      await approveLeave(c.get('auth'), c.req.param('id'), comment)
    );
  })
  .post('/:id/reject', async (c) => {
    const { comment } = validate(
      decisionSchema,
      await c.req.json().catch(() => ({}))
    );
    return c.json(await rejectLeave(c.get('auth'), c.req.param('id'), comment));
  })
  .delete('/:id', async (c) => {
    await cancelLeave(c.get('auth'), c.req.param('id'));
    return c.json({ cancelled: true });
  })
  // Comment thread (manager↔HR INTERNAL + applicant SHARED).
  .post('/:id/comments', async (c) => {
    const body = validate(
      addCommentSchema,
      await c.req.json().catch(() => ({}))
    );
    return c.json(
      await addLeaveComment(c.get('auth'), c.req.param('id'), body),
      201
    );
  })
  .get('/:id/comments', async (c) =>
    c.json(await listLeaveComments(c.get('auth'), c.req.param('id')))
  );

import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import {
  applyLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  listLeaves,
  getLeave,
  addLeaveComment,
  listLeaveComments,
  escalateLeaveManual,
} from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { leaveDto, commentDto } from '../dto';

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
const listLeavesQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DELETED']).optional(),
  userId: z.string().optional(),
});

const escalateSchema = z.object({ reason: z.string().max(500).optional() });

// Thin transport adapter. Logic + authz live in @avkash/leave; this maps HTTP,
// validates input (validateBody/validateQuery) and serializes output (leaveDto).
export const leaves = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', idempotency, validateBody(applyLeaveSchema), async (c) =>
    c.json(serialize(leaveDto, await applyLeave(c.get('auth'), c.get('body'))), 201)
  )
  .get('/', validateQuery(listLeavesQuerySchema), async (c) =>
    c.json({ data: serialize(z.array(leaveDto), await listLeaves(c.get('auth'), c.get('query'))) })
  )
  .get('/:id', async (c) => c.json(serialize(leaveDto, await getLeave(c.get('auth'), c.req.param('id')))))
  .post('/:id/approve', validateBody(decisionSchema), async (c) =>
    c.json(serialize(leaveDto, await approveLeave(c.get('auth'), c.req.param('id'), c.get('body').comment)))
  )
  .post('/:id/reject', validateBody(decisionSchema), async (c) =>
    c.json(serialize(leaveDto, await rejectLeave(c.get('auth'), c.req.param('id'), c.get('body').comment)))
  )
  // Manual escalation — applicant or approver pushes a stuck leave to HR.
  .post('/:id/escalate', validateBody(escalateSchema), async (c) =>
    c.json(serialize(leaveDto, await escalateLeaveManual(c.get('auth'), c.req.param('id'), c.get('body').reason)))
  )
  .delete('/:id', async (c) => {
    await cancelLeave(c.get('auth'), c.req.param('id'));
    return c.json({ cancelled: true });
  })
  // Comment thread (manager↔HR INTERNAL + applicant SHARED).
  .post('/:id/comments', validateBody(addCommentSchema), async (c) =>
    c.json(serialize(commentDto, await addLeaveComment(c.get('auth'), c.req.param('id'), c.get('body'))), 201)
  )
  .get('/:id/comments', async (c) =>
    c.json({ data: serialize(z.array(commentDto), await listLeaveComments(c.get('auth'), c.req.param('id'))) })
  );

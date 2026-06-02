import { Hono } from 'hono';
import { z } from 'zod';
import { inviteTeammate, listInvitations, revokeInvitation } from '@avkash/org';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const inviteSchema = z.object({
  email: z.email(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
  teamId: z.string().optional(),
});

// Invitations already return a curated DTO (not the raw row); collections use the
// { data } envelope like everywhere else.
export const invitations = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', validateBody(inviteSchema), async (c) => {
    const invite = await inviteTeammate(c.get('auth'), c.get('body'));
    return c.json({ invitationId: invite.id, email: invite.email, role: invite.role, status: invite.status }, 201);
  })
  .get('/', async (c) => {
    const list = await listInvitations(c.get('auth'));
    return c.json({
      data: list.map((i) => ({ id: i.id, email: i.email, role: i.role, status: i.status, expiresAt: i.expiresAt })),
    });
  })
  .delete('/:id', async (c) => {
    await revokeInvitation(c.get('auth'), c.req.param('id'));
    return c.json({ revoked: true });
  });

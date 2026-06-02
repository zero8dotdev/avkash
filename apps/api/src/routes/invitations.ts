import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '@avkash/shared';
import { inviteTeammate, listInvitations, revokeInvitation } from '@avkash/org';
import { type AppEnv, requireAuth } from '../middleware/auth';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
  teamId: z.string().optional(),
});

// Teammate invitations (OWNER/MANAGER). All routes require a session; the role
// checks live in the @avkash/org functions. Accept = the invitee signs up with
// the invited email (the auth create-hook provisions them).
export const invitations = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', async (c) => {
    const body = validate(inviteSchema, await c.req.json().catch(() => ({})));
    const invite = await inviteTeammate(c.get('auth'), body);
    return c.json(
      {
        invitationId: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
      },
      201
    );
  })
  .get('/', async (c) => {
    const list = await listInvitations(c.get('auth'));
    return c.json(
      list.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        status: i.status,
        expiresAt: i.expiresAt,
      }))
    );
  })
  .delete('/:id', async (c) => {
    await revokeInvitation(c.get('auth'), c.req.param('id'));
    return c.json({ revoked: true });
  });

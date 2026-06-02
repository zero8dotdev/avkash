import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '@avkash/shared';
import { createOrganization, addOrgDomain, verifyOrgDomain } from '@avkash/org';
import { type AppEnv, requireAuth } from '../middleware/auth';

const createOrgSchema = z.object({
  orgName: z.string().min(1).max(120),
  ownerEmail: z.string().email(),
});
const addDomainSchema = z.object({ domain: z.string().min(1).max(253) });

// Org creation + ownership-validation (DNS TXT). Logic lives in @avkash/org;
// these are thin transport handlers.
export const orgs = new Hono<AppEnv>()
  // Public: self-serve org creation → PROVISIONAL org + OWNER invitation.
  .post('/', async (c) => {
    const body = validate(
      createOrgSchema,
      await c.req.json().catch(() => ({}))
    );
    const { org } = await createOrganization(body);
    return c.json(
      {
        orgId: org.orgId,
        status: org.status,
        verifyBy: org.verifyBy,
        message: `Sign up with ${body.ownerEmail} to become OWNER.`,
      },
      201
    );
  })
  // OWNER: add a domain to verify → returns the TXT record to publish.
  .post('/domains', requireAuth, async (c) => {
    const { domain: name } = validate(
      addDomainSchema,
      await c.req.json().catch(() => ({}))
    );
    const { domain, txtRecord } = await addOrgDomain(c.get('auth'), name);
    return c.json(
      {
        domainId: domain.id,
        domain: domain.domain,
        txtRecord,
        instructions: `Publish a DNS TXT record on ${domain.domain} with value: ${txtRecord}`,
      },
      201
    );
  })
  // OWNER: verify a domain → DNS TXT lookup; promotes the org to VERIFIED.
  .post('/domains/:id/verify', requireAuth, async (c) => {
    const { verified } = await verifyOrgDomain(
      c.get('auth'),
      c.req.param('id')
    );
    return c.json({ verified });
  });

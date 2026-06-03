import { Hono } from 'hono';
import { z } from 'zod';
import { createOrganization, addOrgDomain, verifyOrgDomain, setOrgLocations } from '@avkash/org';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const createOrgSchema = z.object({
  orgName: z.string().min(1).max(120),
  ownerEmail: z.email(),
});

const addDomainSchema = z.object({ domain: z.string().min(1).max(253) });
const setLocationsSchema = z.object({ locations: z.array(z.string().min(2).max(50)) });

// Org creation + ownership-validation (DNS TXT). Logic lives in @avkash/org;
// these are thin transport handlers.
export const orgs = new Hono<AppEnv>()
  // Public: self-serve org creation → PROVISIONAL org + OWNER invitation.
  .post('/', validateBody(createOrgSchema), async (c) => {
    const body = c.get('body');
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
  .post('/domains', requireAuth, validateBody(addDomainSchema), async (c) => {
    const { domain, txtRecord } = await addOrgDomain(c.get('auth'), c.get('body').domain);
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
    const { verified } = await verifyOrgDomain(c.get('auth'), c.req.param('id'));
    return c.json({ verified });
  })
  // HR: set the countries the org operates in (drives holiday resolution).
  .patch('/locations', requireAuth, validateBody(setLocationsSchema), async (c) => {
    const org = await setOrgLocations(c.get('auth'), c.get('body').locations);
    return c.json({ data: { orgId: org.orgId, location: org.location } });
  });

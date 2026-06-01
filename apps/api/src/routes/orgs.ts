import { Hono } from 'hono'
import { createOrganization, addOrgDomain, verifyOrgDomain } from '@avkash/org'
import { type AppEnv, requireAuth } from '../middleware/auth'

// Org creation + ownership-validation (DNS TXT). Logic lives in @avkash/org;
// these are thin transport handlers.
export const orgs = new Hono<AppEnv>()
  // Public: self-serve org creation → PROVISIONAL org + OWNER invitation.
  .post('/', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { orgName?: string; ownerEmail?: string }
    if (!body.orgName || !body.ownerEmail) {
      return c.json({ error: 'orgName and ownerEmail are required' }, 400)
    }
    const { org } = await createOrganization({ orgName: body.orgName, ownerEmail: body.ownerEmail })
    return c.json(
      { orgId: org.orgId, status: org.status, verifyBy: org.verifyBy, message: `Sign up with ${body.ownerEmail} to become OWNER.` },
      201,
    )
  })
  // OWNER: add a domain to verify → returns the TXT record to publish.
  .post('/domains', requireAuth, async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { domain?: string }
    if (!body.domain) return c.json({ error: 'domain is required' }, 400)
    const { domain, txtRecord } = await addOrgDomain(c.get('auth'), body.domain)
    return c.json(
      { domainId: domain.id, domain: domain.domain, txtRecord, instructions: `Publish a DNS TXT record on ${domain.domain} with value: ${txtRecord}` },
      201,
    )
  })
  // OWNER: verify a domain → DNS TXT lookup; promotes the org to VERIFIED.
  .post('/domains/:id/verify', requireAuth, async (c) => {
    const { verified } = await verifyOrgDomain(c.get('auth'), c.req.param('id'))
    return c.json({ verified })
  })

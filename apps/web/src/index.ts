import type { AuthContext } from '@avkash/shared'

// Placeholder so this package type-checks itself (not the root Next.js app).
// The real Next.js frontend migrates here — see README.md. The web app may
// import shared TYPES only; never @avkash/db or a domain package. That boundary
// is enforced by package.json: @avkash/shared is its sole @avkash dependency.
export type WebSessionUser = Pick<AuthContext, 'userId' | 'role' | 'orgId'>

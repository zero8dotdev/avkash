import type { AuthContext } from '@avkash/shared'

// users domain — the people: profiles, teams, roles. Pure logic, ctx-first.
// (Organisation lifecycle lives in @avkash/org, not here.) Wire HTTP in apps/api.
export async function placeholder(_ctx: AuthContext): Promise<void> {
  throw new Error('not implemented')
}

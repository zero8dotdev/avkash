import type { AuthContext } from '@avkash/shared';

// attendance domain — pure logic, ctx-first. Wire HTTP in apps/api, never here.
export async function placeholder(_ctx: AuthContext): Promise<void> {
  throw new Error('not implemented');
}

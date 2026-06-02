import type { AuthContext } from '@avkash/shared';

// "Payroll is what happens when you combine who's employed, who was present,
// and who was on leave." If you ever need @avkash/db here, that's the smell.
export async function runPayroll(_ctx: AuthContext, _month: string): Promise<void> {
  throw new Error('not implemented');
}

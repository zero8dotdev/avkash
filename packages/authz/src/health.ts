// Cheap FGA liveness probe — used by /health/ready alongside the DB ping.
// Returns true if the FGA HTTP API responds to /healthz within timeoutMs.
// Never throws — callers treat a false return as "FGA unavailable".

import { env } from '@avkash/config';

/** Returns true if OpenFGA responds within the given timeout. */
export async function authzHealthy(timeoutMs = 2000): Promise<boolean> {
  try {
    const url = `${env.FGA_API_URL.replace(/\/$/, '')}/healthz`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

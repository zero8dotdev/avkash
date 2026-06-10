// Better Auth svelte client — points at the API's /api/auth base path.
// The API mounts Better Auth at /api/auth/* (see apps/api/src/app.ts).
import { createAuthClient } from 'better-auth/svelte';

const API_BASE = typeof window !== 'undefined'
  ? (import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3001')
  : (process.env.PUBLIC_API_URL ?? 'http://localhost:3001');

export const authClient = createAuthClient({
  baseURL: `${API_BASE}/api/auth`,
});

export const { signIn, signOut, useSession } = authClient;

// Typed Hono client for the Avkash API. Importing AppType from @avkash/api gives
// full compile-time route coverage — a typo in the route path is a type error.
import { hc } from 'hono/client';
import type { AppType } from '@avkash/api';

// PUBLIC_API_URL is injected by Vite at build time (from the environment or
// vite.config.ts define). Falls back to the local dev address.
const API_BASE = typeof window !== 'undefined'
  ? (import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3001')
  : (process.env.PUBLIC_API_URL ?? 'http://localhost:3001');

// `credentials: 'include'` ensures the Better Auth session cookie is sent with
// every cross-origin request. The API's CORS allow-list must include this origin.
export const api = hc<AppType>(API_BASE, {
  init: { credentials: 'include' },
});

export type { AppType };

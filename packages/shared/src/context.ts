import type { Role } from './enums';

// The seam between authN (per-transport) and authz (invariant).
// Every transport's only job is to PRODUCE one of these; every domain
// function CONSUMES one as its first argument. Authz never branches on `via`.
export type Transport = 'http' | 'api-key' | 'slack' | 'chatbot' | 'whatsapp' | 'system';

export type Assurance = 'low' | 'medium' | 'high';

export interface AuthContext {
  orgId: string;
  userId: string | null; // null for pure machine actors
  role: Role;
  actorType: 'user' | 'service' | 'system';
  assurance: Assurance; // how strongly identity was proven this session
  scopes?: string[]; // for API keys / OAuth tokens
  language?: string; // user's preferred locale tag (overrides Accept-Language)
  via: Transport; // AUDIT ONLY — never read in an authz decision
}

// Public type surface for @avkash/emails. Consumers resolve types from here (the
// "types" export condition) instead of the .tsx source, so a package without JSX
// configured (e.g. @avkash/org) can depend on this without tsc parsing React Email.
// Runtime still loads ./src/index.ts (the "default" condition); Bun handles the TSX.

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderEmail(event: string, payload: Record<string, unknown>): Promise<RenderedEmail | null>;

export function hasEmailTemplate(event: string): boolean;

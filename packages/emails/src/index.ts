// React Email templates for Avkash. renderEmail(event, payload) → { subject, html,
// text }; the same components are previewed locally via `pnpm --filter @avkash/emails
// dev` (the react-email server on :3030).
export { renderEmail, hasEmailTemplate, type RenderedEmail } from './render';

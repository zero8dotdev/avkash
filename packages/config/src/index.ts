import { z } from 'zod';

// Parsed once at boot. A missing required var throws here, not deep inside a
// request. Auth providers are optional so the app boots without them configured.
const schema = z.object({
  DATABASE_URL: z.string().url(),
  // Redis for BullMQ (the worker). Defaults to local; the worker container sets it.
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  BETTER_AUTH_SECRET: z.string().default('dev-secret-change-me'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3001'),
  // Google Workspace OAuth (hd-restricted). Optional until configured.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // Notification providers. All optional — absent keys fall back to the console
  // provider, so the app runs end-to-end without any of them configured.
  // Email (Resend): both key and a verified from-address are needed to go live.
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(), // e.g. "Avkash <noreply@yourdomain.com>"
  // SMS (MSG91): auth key + sender ID + a DLT-registered flow template id.
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;

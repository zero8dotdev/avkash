import { createApp } from '@avkash/app';
import { OPEN_MODULES } from './modules';
import { internal } from './routes/internal';

// The internal route is a platform-operator surface, not an AvkashModule — it
// runs as the platform actor (no tenant session) and is guarded by the internal
// token, not the module entitlement system.
export const app = createApp(OPEN_MODULES);
app.route('/internal', internal);

export type AppType = typeof app;

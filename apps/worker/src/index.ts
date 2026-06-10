import { startWorker, registerSchedules } from '@avkash/jobs';
import { startRelay } from '@avkash/events';

// The maintenance worker process. Boots:
//   1. The BullMQ worker (start consuming the maintenance queue).
//   2. The repeatable job schedule (accrual, notifications, etc.).
//   3. The event-bus relay (drains event_outbox, fans out to subscribers).
// Long-running — kept alive until a signal arrives.

const bullWorker = startWorker();
await registerSchedules();

// Poll every 5 s; log each run in dev for observability.
const stopRelay = startRelay({
  intervalMs: 5_000,
  onRun: ({ processed, failed, skipped }) => {
    if (processed || failed || skipped) {
      console.log(`[relay] processed=${processed} failed=${failed} skipped=${skipped}`);
    }
  },
  onError: (err) => console.error('[relay] unexpected error:', err),
});

console.log('avkash worker up — schedule registered, event relay started');

const shutdown = async (signal: string) => {
  console.log(`\n${signal} received — closing worker…`);
  await stopRelay();
  await bullWorker.close();
  process.exit(0);
};
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

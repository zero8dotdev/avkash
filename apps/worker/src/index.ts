import { startWorker, registerSchedules } from '@avkash/jobs';
import { startRelay, wireSubscribers } from '@avkash/events';
import { tupleWriterSubscribers } from '@avkash/authz-sync';
import { bootAuthz } from '@avkash/authz';

// The maintenance worker process. Boots:
//   1. The BullMQ worker (start consuming the maintenance queue).
//   2. The repeatable job schedule (accrual, notifications, etc.).
//   3. The event-bus relay (drains event_outbox, fans out to subscribers).
// Long-running — kept alive until a signal arrives.

// Resolve the FGA store + model BEFORE the relay starts: the tuple-writer
// subscribers need a store id, which previously only existed when
// FGA_STORE_ID was set explicitly. Failure is non-fatal — subscribers fail
// closed and the relay retries; readiness lives with the API.
try {
  const { storeId } = await bootAuthz();
  console.log(`[authz] worker store=${storeId}`);
} catch (err) {
  console.error('[authz] bootAuthz failed — tuple sync will retry via relay:', err);
}

// Wire tuple-writer subscribers for all org-graph events.
// Must be called BEFORE startRelay() so the registry is populated before
// the first relay pass drains the outbox.
wireSubscribers(tupleWriterSubscribers);

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

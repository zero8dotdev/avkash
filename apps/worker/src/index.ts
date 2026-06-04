import { startWorker, registerSchedules } from '@avkash/jobs';

// The maintenance worker process. Boots the BullMQ worker (starts consuming the
// queue), then registers the repeatable schedule. Long-running — kept alive by the
// worker's Redis connection until a signal arrives.
const worker = startWorker();
await registerSchedules();
console.log('🛠  avkash worker up — maintenance schedule registered');

const shutdown = async (signal: string) => {
  console.log(`\n${signal} received — closing worker…`);
  await worker.close();
  process.exit(0);
};
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

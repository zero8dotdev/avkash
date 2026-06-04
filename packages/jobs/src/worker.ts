import { Worker, type Job } from 'bullmq';
import { connection } from './connection';
import { QUEUE_NAME } from './queue';
import { SCHEDULE } from './schedule';

const handlers: Record<string, () => Promise<unknown>> = Object.fromEntries(SCHEDULE.map((j) => [j.name, j.run]));

// Boot the BullMQ worker that processes the maintenance queue. job.name selects the
// handler from SCHEDULE; an unknown name throws so it surfaces rather than silently
// no-ops. Called once, by apps/worker.
export function startWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const handler = handlers[job.name];
      if (!handler) throw new Error(`no handler for job "${job.name}"`);
      return handler();
    },
    { connection, concurrency: 4 }
  );
  worker.on('completed', (job, result) => console.log(`[job ✓] ${job.name}`, JSON.stringify(result)));
  worker.on('failed', (job, err) => console.error(`[job ✗] ${job?.name}: ${err?.message}`));
  return worker;
}

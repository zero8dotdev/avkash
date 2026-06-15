import { Queue } from 'bullmq';
import { connection } from './connection';
import { SCHEDULE } from './schedule';

export const QUEUE_NAME = 'maintenance';

// Lazy singleton — the Queue (and its Redis connection) is created on first use,
// not at import time, so merely depending on @avkash/jobs never touches Redis.
let queue: Queue | undefined;
export function getQueue(): Queue {
  if (!queue) queue = new Queue(QUEUE_NAME, { connection });
  return queue;
}

// Register every SCHEDULE entry as a repeatable job. Idempotent: re-adding the same
// (name, cron) resolves to the same repeat key, so a worker restart never piles up
// duplicate schedulers.
export async function registerSchedules(): Promise<void> {
  const q = getQueue();
  await Promise.all(
    SCHEDULE.map((job) =>
      q.add(
        job.name,
        {},
        {
          repeat: { pattern: job.cron },
          // Job-level retries with exponential backoff for a job that throws
          // outright; removeOnFail keeps exhausted jobs as the dead-letter set.
          attempts: 3,
          backoff: { type: 'exponential', delay: 30_000 },
          removeOnComplete: 50,
          removeOnFail: { count: 1000 },
        }
      )
    )
  );
}

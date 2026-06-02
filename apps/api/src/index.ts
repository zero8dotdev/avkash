import { app } from './app';

const port = Number(process.env.PORT ?? 3001);
console.log(`avkash api on :${port}`);

export default { port, fetch: app.fetch };

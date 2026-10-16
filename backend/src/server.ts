import http from 'http';
import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { initSocketServer } from './sockets';
import { startExpireBookingsJob } from './jobs/expireBookingsJob';
import { startHeartbeatJob } from './jobs/heartbeatJob';

async function main() {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  initSocketServer(httpServer);
  startExpireBookingsJob();
  startHeartbeatJob();

  httpServer.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] EVSync backend listening on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`[server] API docs at http://localhost:${env.port}/api/docs`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] failed to start', err);
  process.exit(1);
});

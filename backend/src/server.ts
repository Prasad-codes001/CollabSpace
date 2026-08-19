import http from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { setupSocket } from './socket/index.js';

async function start(): Promise<void> {
  await connectDB();

  const server = http.createServer(app);

  // Attach Socket.IO to the same HTTP server
  setupSocket(server);

  server.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    console.log(`Health check: http://localhost:${env.PORT}/api/v1/health`);
    console.log(`Socket.IO attached`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

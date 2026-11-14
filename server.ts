import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';
import { initDatabase } from './server/db';
import { attachListeningPartyWs } from './server/partyWs';
import { createApiRouter } from './server/routes';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  await initDatabase();

  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.use('/api', createApiRouter());

  const server = http.createServer(app);
  attachListeningPartyWs(server);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Melody server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Melody server:', err);
  process.exit(1);
});

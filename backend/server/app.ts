import express from 'express';
import { apiRouter } from './routes/api';

/**
 * Guansa Ma'ed Backend Express Application
 * Configures REST API routes, body parsing, and security headers.
 */
export function createBackendApp(): express.Express {
  const app = express();

  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  app.use('/api', apiRouter);
  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found.' });
  });
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[API Error]:', error instanceof Error ? error.message : 'Unknown server error.');
    if (res.headersSent) return;
    res.status(500).json({ success: false, message: 'A server error prevented this request from completing.' });
  });

  return app;
}

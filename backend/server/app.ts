
import express from 'express';
import { apiRouter } from './routes/api';

/**
 * Guansa Ma'ed Backend Express Application
 *
 * Configures:
 * - Root API information endpoint
 * - Health check endpoint
 * - JSON and URL-encoded request parsing
 * - REST API routes
 * - JSON 404 responses for unknown API endpoints
 * - Centralized error handling
 */
export function createBackendApp(): express.Express {
  const app = express();

  // Parse incoming request bodies.
  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Root endpoint: confirms that the backend is running.
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Guansa Ma'ed API is running.",
      endpoints: {
        root: '/',
        health: '/health',
        menu: '/api/menu',
      },
    });
  });

  // Health check endpoint.
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      status: 'ok',
    });
  });

  // Register existing API routes.
  app.use('/api', apiRouter);

  // Return JSON for unknown API endpoints.
  app.use('/api', (_req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found.',
    });
  });

  // Handle unexpected server errors.
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(
        '[API Error]:',
        error instanceof Error
          ? error.message
          : 'Unknown server error.',
      );

      if (res.headersSent) {
        return;
      }

      res.status(500).json({
        success: false,
        message:
          'A server error prevented this request from completing.',
      });
    },
  );

  return app;
}

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function startServer(): Promise<void> {
  const { initializeDatabase } = await import('./server/database.ts');
  const { createBackendApp } = await import('./server/app.ts');
  await initializeDatabase();

  const port = Number(process.env.PORT || 3000);
  const server = createBackendApp().listen(port, '0.0.0.0');
  server.once('error', (error) => {
    console.error('[Guansa Ma’ed API] Failed to start:', error);
    process.exit(1);
  });
  server.once('listening', () => {
    console.log(`[Guansa Ma’ed API] Listening on port ${port}.`);
  });
}

startServer().catch((error: unknown) => {
  console.error('[Guansa Ma’ed API] Startup failed:', error);
  process.exit(1);
});

import { getConfig } from './config/env.js';
import { initPool, closePool, checkDatabaseHealth } from './config/database.js';
import app from './app.js';

async function bootstrap() {
  // Validate configuration before starting the application
  const config = getConfig();

  // If database configuration is provided, verify connectivity on startup
  if (config.DATABASE_URL) {
    initPool(config.DATABASE_URL);
    const health = await checkDatabaseHealth();
    if (!health.connected) {
      console.error('Failed to connect to MariaDB during startup: database unreachable.');
      await closePool();
      process.exit(1);
    }
    console.log('Successfully connected to MariaDB.');
  } else {
    console.warn('DATABASE_URL not set: running without database connection.');
  }

  // Check email notification configuration status on startup
  if (config.isEmailConfigured) {
    console.log(`Email notifications enabled. Recipient: ${config.NOTIFICATION_EMAIL}`);
  } else {
    console.warn('Email notifications disabled: SMTP_USER or SMTP_PASSWORD not configured.');
  }

  const server = app.listen(config.PORT, config.HOST, () => {
    console.log(`Dheeksha Insurance Node.js backend listening on http://${config.HOST}:${config.PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
  });

  // Graceful Shutdown Handling
  const handleShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async (err) => {
      if (err) {
        console.error('Error closing HTTP server:', err);
      }
      try {
        await closePool();
        console.log('Database pool disposed cleanly.');
      } catch (poolErr) {
        console.error('Error disposing database pool:', poolErr);
      }
      process.exit(err ? 1 : 0);
    });

    // Force termination if graceful shutdown exceeds 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err.message);
  process.exit(1);
});

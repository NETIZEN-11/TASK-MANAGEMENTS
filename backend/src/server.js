const config = require('./config');
const { buildApp, logger } = require('./app');
const database = require('./config/database');

async function start() {
  try {
    await database.connect();
    const app = buildApp();
    const server = app.listen(config.port, () => {
      logger.info(`API listening on http://localhost:${config.port} (env=${config.env})`);
    });

    // Track open sockets so we can force-destroy them if shutdown stalls.
    const sockets = new Set();
    server.on('connection', (socket) => {
      sockets.add(socket);
      socket.once('close', () => sockets.delete(socket));
    });

    let shuttingDown = false;
    const FORCE_TIMEOUT_MS = 10_000;

    const shutdown = (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      logger.info(`Received ${signal}, draining connections (up to ${FORCE_TIMEOUT_MS / 1000}s)...`);

      // Stop accepting new connections immediately.
      server.close((err) => {
        if (err) logger.error(`server.close error: ${err.message}`);
      });

      // Hard deadline — exit even if cleanup hangs.
      const forceExit = setTimeout(() => {
        logger.error('Force-exiting after shutdown timeout');
        for (const s of sockets) {
          try { s.destroy(); } catch { /* noop */ }
        }
        process.exit(1);
      }, FORCE_TIMEOUT_MS);
      forceExit.unref();

      // Drain in-flight requests, then close DB.
      (async () => {
        try {
          await new Promise((resolve) => server.close(resolve));
          await database.disconnect();
          clearTimeout(forceExit);
          logger.info('Shutdown complete');
          process.exit(0);
        } catch (e) {
          logger.error(`Shutdown error: ${e.message}`);
          process.exit(1);
        }
      })();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled rejection: ${err?.message || err}`);
      // Let the platform restart the process — do not exit on first rejection,
      // but log so we can investigate.
    });
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught exception: ${err?.stack || err}`);
      // Uncaught exceptions leave the process in an unknown state — exit.
      shutdown('uncaughtException');
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { start };
require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const systemHealthMonitor = require('./services/systemHealthMonitor');

if (cluster.isPrimary) {
  logger.info(`Primary process ${process.pid} is running`);

  // Initialize System Health Monitor
  systemHealthMonitor.start();

  // Fork initial worker
  cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died. Code: ${code}, Signal: ${signal}`);
    logger.info('Starting a replacement worker...');
    cluster.fork();
  });

  // Handle messages from workers (e.g., metrics)
  cluster.on('message', (worker, message) => {
    if (message.type === 'metrics') {
      // systemHealthMonitor.recordWorkerMetrics(worker.id, message.data);
    }
  });

  // Scaling Admin Endpoints (Optional: Master could also run a minimal admin server)

} else {
  // Worker process
  const { app, server, io } = require('./server');
  const PORT = process.env.PORT || 3000;

  const startWorker = async () => {
    try {
      await sequelize.authenticate();
      logger.info(`Worker ${process.pid} connected to database`);

      server.listen(PORT, () => {
        logger.info(`Worker ${process.pid} running on port ${PORT}`);
      });

      // Report metrics periodically
      setInterval(() => {
        // process.send({ type: 'metrics', data: { /* ... */ } });
      }, 10000);

    } catch (error) {
      logger.error({ error }, `Worker ${process.pid} failed to start`);
      process.exit(1);
    }
  };

  startWorker();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info(`Worker ${process.pid} shutting down gracefully`);
    server.close(() => {
      sequelize.close();
      process.exit(0);
    });
  });
}

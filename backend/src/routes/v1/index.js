const { Router } = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./auth.routes');
const taskRoutes = require('./task.routes');

const router = Router();

// IMPROVEMENT: Enhanced health check with more detailed status
router.get('/health', (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
  };
  
  const status = dbReady ? 200 : 503;
  
  res.status(status).json({
    success: dbReady,
    statusCode: status,
    message: dbReady ? 'API is healthy' : 'API degraded - Database disconnected',
    data: {
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      db: dbReady ? 'up' : 'down',
      dbState: mongoose.connection.readyState,
      pid: process.pid,
      nodeVersion: process.version,
      memory: memoryUsageMB,
    },
  });
});

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);

module.exports = router;
/**
 * System Health & Research Observability Routes
 * Purpose: Exposes read-only operational telemetry, system uptime, memory usage,
 * database connectivity status, AI token statistics, and cache metrics.
 * Zero authentication required. No side effects. Fully backward compatible.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const Event = require('../models/Event');
const { getAiTelemetrySummary } = require('../utils/aiTelemetry');
const { getCacheStats } = require('../utils/cache');

/**
 * GET /api/health
 * Basic system health check endpoint.
 */
router.get('/', (req, res) => {
  const dbStateMap = {
    0: 'DISCONNECTED',
    1: 'CONNECTED',
    2: 'CONNECTING',
    3: 'DISCONNECTING'
  };

  const dbState = dbStateMap[mongoose.connection.readyState] || 'UNKNOWN';

  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    memory: {
      rssMb: Number((process.memoryUsage().rss / (1024 * 1024)).toFixed(2)),
      heapTotalMb: Number((process.memoryUsage().heapTotal / (1024 * 1024)).toFixed(2)),
      heapUsedMb: Number((process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2))
    },
    databaseState: dbState
  });
});

/**
 * GET /api/health/metrics
 * Comprehensive telemetry and metrics inspection endpoint.
 */
router.get('/metrics', async (req, res) => {
  try {
    const articleCount = await Article.countDocuments();
    const eventCount = await Event.countDocuments();

    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      },
      database: {
        connectionState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
        articleCount,
        eventCount
      },
      aiTelemetry: getAiTelemetrySummary(),
      cacheStatistics: getCacheStats(),
      webhooks: {
        socialWebhookConfigured: Boolean(process.env.SOCIAL_WEBHOOK_URL)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to collect system metrics',
      error: error.message
    });
  }
});

module.exports = router;

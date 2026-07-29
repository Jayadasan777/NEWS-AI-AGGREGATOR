require('dotenv').config(); // Load environment variables from .env
const validateEnv = require('./config/envValidator');

// Run environment validation before database connection or server initialization
validateEnv();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const runNewsEngine = require('./jobs/newsEngine');
const { recirculateEvergreenArticles } = require('./jobs/recirculateEngine');
const articleRoutes = require('./routes/articleRoutes');
const eventRoutes = require('./routes/eventRoutes');
const socialRoutes = require('./routes/socialRoutes');
const healthRoutes = require('./routes/healthRoutes');

const {
  generalRateLimiter,
  triggerRateLimiter,
  securityHeadersMiddleware
} = require('./middleware/rateLimiter');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(securityHeadersMiddleware);

// --- Lightweight Health Check / Keep-Alive Route (For cron-job.org) ---
app.get('/ping', (req, res) => {
  console.log(`🏓 Keep-alive ping received at ${new Date().toLocaleString()}`);
  res.status(200).send('OK');
});

app.get('/', (req, res) => {
  res.send('AI News Aggregator API is running...');
});

app.use('/api/health', healthRoutes);
app.use('/api/articles', generalRateLimiter, articleRoutes);
app.use('/api/events', generalRateLimiter, eventRoutes);
app.use('/api/social', socialRoutes);

// --- Manual Trigger Route (For instant testing without waiting for cron) ---
app.get('/api/trigger', triggerRateLimiter, (req, res) => {
  console.log(`🚀 Manual ingestion triggered via /api/trigger at ${new Date().toLocaleString()}`);
  // Run in background so request doesn't timeout
  runNewsEngine().catch(err => console.error('❌ Manual trigger failed:', err.message));
  res.status(200).json({
    success: true,
    message: '🚀 News engine triggered in background! Check Render logs and /api/articles/stats in 1-2 minutes.',
    timestamp: new Date().toISOString()
  });
});

// --- Scheduled job 1: Ingestion runs weekly on Monday at 08:00 AM UTC ---
const ingestionCron = cron.schedule('0 8 * * 1', async () => {
  console.log('\n⏰ Scheduled job triggered (Weekly schedule):', new Date().toLocaleString());
  try {
    await runNewsEngine();
  } catch (error) {
    console.error('❌ Scheduled job failed:', error.message);
  }
});

console.log('⏰ Cron job scheduled: news engine will run weekly on Monday at 08:00 AM UTC.');

// --- Scheduled job 2: Evergreen Content Recirculation runs daily at 12:00 PM UTC ---
const recirculationCron = cron.schedule('0 12 * * *', async () => {
  console.log('\n♻️ Scheduled job triggered (Evergreen Content Recirculation):', new Date().toLocaleString());
  try {
    await recirculateEvergreenArticles();
  } catch (error) {
    console.error('❌ Evergreen Recirculation job failed:', error.message);
  }
});

console.log('⏰ Cron job scheduled: evergreen content recirculation will run daily at 12:00 PM UTC.');

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// --- Graceful Shutdown Handler (SIGINT / SIGTERM) ---
const mongoose = require('mongoose');

let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 ${signal} received. Initiating graceful shutdown...`);

  // 1. Stop accepting new cron jobs
  try {
    ingestionCron.stop();
    recirculationCron.stop();
    console.log('⏰ Scheduled cron tasks stopped.');
  } catch (err) {
    console.error('⚠️ Error stopping cron tasks:', err.message);
  }

  // 2. Set timeout fallback to force exit if requests do not drain in 10s
  const forceExitTimeout = setTimeout(() => {
    console.error('⚠️ Forced shutdown initiated due to timeout.');
    process.exit(1);
  }, 10000);

  // 3. Close HTTP server and stop accepting new connections
  server.close(async () => {
    console.log('🌐 HTTP server closed. Drained active requests.');
    clearTimeout(forceExitTimeout);

    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close(false);
        console.log('✅ MongoDB connection closed gracefully.');
      }
    } catch (err) {
      console.error('❌ Error closing MongoDB connection:', err.message);
    }

    console.log('👋 Graceful shutdown complete. Exiting.');
    process.exit(0);
  });
};

const logger = require('./utils/logger');

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// --- Global Unhandled Promise Rejection Handler ---
process.on('unhandledRejection', (reason, promise) => {
  logger.error('SERVER_PROCESS', 'Unhandled Promise Rejection caught at process level', reason);
  // Logged safely without crashing the event loop for non-fatal async rejections
});

// --- Global Uncaught Exception Handler ---
process.on('uncaughtException', (err) => {
  logger.error('SERVER_PROCESS', 'Uncaught Exception thrown at process level', err);
  // Trigger graceful shutdown on critical uncaught exceptions to ensure data consistency
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
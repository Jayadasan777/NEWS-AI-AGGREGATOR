require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const runNewsEngine = require('./jobs/newsEngine');
const articleRoutes = require('./routes/articleRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// --- Lightweight Health Check / Keep-Alive Route (For cron-job.org) ---
app.get('/ping', (req, res) => {
  console.log(`🏓 Keep-alive ping received at ${new Date().toLocaleString()}`);
  res.status(200).send('OK');
});

app.get('/', (req, res) => {
  res.send('AI News Aggregator API is running...');
});

app.use('/api/articles', articleRoutes);
app.use('/api/events', eventRoutes);

// --- Manual Trigger Route (For instant testing without waiting for cron) ---
app.get('/api/trigger', (req, res) => {
  console.log(`🚀 Manual ingestion triggered via /api/trigger at ${new Date().toLocaleString()}`);
  // Run in background so request doesn't timeout
  runNewsEngine().catch(err => console.error('❌ Manual trigger failed:', err.message));
  res.status(200).json({
    success: true,
    message: '🚀 News engine triggered in background! Check Render logs and /api/articles/stats in 1-2 minutes.',
    timestamp: new Date().toISOString()
  });
});

// --- Scheduled job: runs every 5 minutes (for live testing & verification) ---
cron.schedule('*/5 * * * *', async () => {
  console.log('\n⏰ Scheduled job triggered (5-min schedule):', new Date().toLocaleString());
  try {
    await runNewsEngine();
  } catch (error) {
    console.error('❌ Scheduled job failed:', error.message);
  }
});

console.log('⏰ Cron job scheduled: news engine will run every 5 minutes.');


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
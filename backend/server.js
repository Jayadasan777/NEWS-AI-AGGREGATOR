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

app.get('/', (req, res) => {
  res.send('AI News Aggregator API is running...');
});

app.use('/api/articles', articleRoutes);
app.use('/api/events', eventRoutes);

// --- Scheduled job: runs twice daily (8 AM and 8 PM) ---
// Production interval — respects free-tier Gemini daily quota (20/day)
// with ARTICLES_PER_SECTOR = 1.
cron.schedule('0 8,20 * * *', async () => {
  console.log('\n⏰ Scheduled job triggered:', new Date().toLocaleString());
  try {
    await runNewsEngine();
  } catch (error) {
    console.error('❌ Scheduled job failed:', error.message);
  }
});

console.log('⏰ Cron job scheduled: news engine will run twice daily (8 AM & 8 PM).');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
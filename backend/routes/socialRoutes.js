const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const { broadcastArticle } = require('../utils/socialBroadcast');
const runNewsEngine = require('../jobs/newsEngine');
const { triggerRateLimiter } = require('../middleware/rateLimiter');
const adminAuth = require('../middleware/adminAuth');

// Global in-memory toggle initialized from environment
if (typeof global.AUTO_BROADCAST_ENABLED === 'undefined') {
  global.AUTO_BROADCAST_ENABLED = process.env.AUTO_BROADCAST === 'true';
}

/**
 * GET /api/social/queue
 * Retrieve articles ready for social media broadcast.
 */
router.get('/queue', async (req, res) => {
  try {
    const { status = 'all', limit = 20 } = req.query;
    
    const query = {};
    if (status !== 'all') {
      query.broadcast_status = status;
    }

    const articles = await Article.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    const latestArt = await Article.findOne().sort({ timestamp: -1 });

    res.json({
      success: true,
      count: articles.length,
      autoBroadcastEnabled: global.AUTO_BROADCAST_ENABLED,
      webhookConfigured: Boolean(process.env.SOCIAL_WEBHOOK_URL),
      cronSchedule: 'Weekly (Every Monday at 08:00 UTC - 0 8 * * 1)',
      lastIngestionTime: latestArt ? latestArt.timestamp : null,
      data: articles
    });
  } catch (error) {
    console.error('❌ Social Queue Fetch Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve social queue.' });
  }
});

/**
 * POST /api/social/trigger-scrape
 * Manually trigger an immediate news engine scrape across all 14 feeds.
 */
router.post('/trigger-scrape', adminAuth, triggerRateLimiter, async (req, res) => {
  try {
    console.log('⚡ Manual override: Triggering news engine scrape from Social Studio...');
    runNewsEngine().catch(err => console.error('❌ Manual Scrape Error:', err.message));
    res.json({
      success: true,
      message: '⚡ Immediate 14-feed AI news scrape triggered! New articles will start appearing in the queue shortly.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to trigger news scrape.' });
  }
});


/**
 * POST /api/social/broadcast/:id
 * Manually trigger webhook dispatch for a specific article.
 */
router.post('/broadcast/:id', adminAuth, triggerRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid article ID format.' });
    }

    const result = await broadcastArticle(id, { force: true });
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Social Broadcast Endpoint Error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Server error during social broadcast.' });
  }
});

/**
 * POST /api/social/toggle-auto
 * Toggle autonomous social broadcast mode.
 */
router.post('/toggle-auto', adminAuth, (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled === 'boolean') {
      global.AUTO_BROADCAST_ENABLED = enabled;
    } else {
      global.AUTO_BROADCAST_ENABLED = !global.AUTO_BROADCAST_ENABLED;
    }

    console.log(`🤖 Autonomous Social Broadcast mode toggled to: ${global.AUTO_BROADCAST_ENABLED}`);
    res.json({
      success: true,
      autoBroadcastEnabled: global.AUTO_BROADCAST_ENABLED,
      message: `Autonomous broadcast mode is now ${global.AUTO_BROADCAST_ENABLED ? 'ENABLED' : 'DISABLED'}.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle autonomous mode.' });
  }
});

/**
 * GET /api/social/test
 * Instantly broadcast the most recent article in MongoDB to test the webhook!
 */
router.get('/test', adminAuth, async (req, res) => {
  try {
    const latestArticle = await Article.findOne().sort({ timestamp: -1 });
    if (!latestArticle) {
      return res.status(404).json({ success: false, message: 'No articles found in DB to test.' });
    }
    console.log(`🧪 Test webhook triggered for latest article: "${latestArticle.title}"`);
    const result = await broadcastArticle(latestArticle, { force: true });
    res.json({
      success: true,
      message: '🧪 Test broadcast dispatched successfully to Make.com!',
      articleTitle: latestArticle.title,
      webhookResult: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;


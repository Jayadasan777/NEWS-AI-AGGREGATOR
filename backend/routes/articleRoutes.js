const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

// GET /api/articles/stats — automation health check
router.get('/stats', async (req, res) => {
  try {
    const total = await Article.countDocuments();
    const latest = await Article.findOne().sort({ timestamp: -1 }).select('timestamp');
    res.status(200).json({
      success: true,
      data: { total, lastRun: latest?.timestamp || null },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
});

// GET /api/articles
// GET /api/articles?sector=Tech
router.get('/', async (req, res) => {
  try {
    const { sector } = req.query;

    // Build a filter object. If no sector given, filter stays empty (= get everything)
    const filter = sector ? { sector: sector } : {};

    const articles = await Article.find(filter).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles',
      error: error.message,
    });
  }
});

// GET /api/articles/:id
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    res.status(200).json({
      success: true,
      data: article,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article',
      error: error.message,
    });
  }
});

module.exports = router;
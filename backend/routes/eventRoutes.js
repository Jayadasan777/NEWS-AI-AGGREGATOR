const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { cacheMiddleware } = require('../utils/cache');
const { enrichEventWithLifecycle } = require('../utils/eventLifecycle');

// GET /api/events/latest?limit=6
router.get('/latest', cacheMiddleware(30), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const events = await Event.find()
      .sort({ last_updated: -1 })
      .limit(limit)
      .populate('source_articles', 'title sector timestamp');
    res.status(200).json({ success: true, data: enrichEventWithLifecycle(events) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch latest events', error: error.message });
  }
});

// GET /api/events?sector=Tech
router.get('/', cacheMiddleware(30), async (req, res) => {
  try {
    const { sector } = req.query;
    const filter = sector ? { sector } : {};

    const events = await Event.find(filter)
      .populate('source_articles', 'title sector image_url timestamp')
      .sort({ last_updated: -1 });

    res.status(200).json({ success: true, count: events.length, data: enrichEventWithLifecycle(events) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch events', error: error.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('source_articles', 'title sector image_url timestamp unique_summary');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, data: enrichEventWithLifecycle(event) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch event', error: error.message });
  }
});

module.exports = router;
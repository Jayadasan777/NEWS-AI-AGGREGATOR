const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  event_title: { type: String, required: true },
  sector: { 
    type: String, 
    required: true,
    // Removed strict enum restrictions so all 14 expanded sectors are accepted
  },
  source_articles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  fused_summary: { type: String, default: '' },
  confidence_score: { type: Number, default: 35 },
  first_reported: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
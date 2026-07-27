const mongoose = require('mongoose');

const stanceSchema = new mongoose.Schema({
  article_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  publisher: { type: String, default: 'Unknown' },
  stance: { type: String, enum: ['Supporting', 'Contradicting', 'Neutral'], default: 'Supporting' },
  framing: { type: String, default: '' },
  rationale: { type: String, default: '' },
}, { _id: false });

const reflectionLogSchema = new mongoose.Schema({
  check: { type: String, default: '' },
  passed: { type: Boolean, default: true },
  flagged_content: { type: String, default: '' },
}, { _id: false });

const eventSchema = new mongoose.Schema({
  event_title: { type: String, required: true },
  sector: { 
    type: String, 
    required: true,
    // Removed strict enum restrictions so all 14 expanded sectors are accepted
  },
  source_articles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  image_url: { type: String, default: '' },
  fused_summary: { type: String, default: '' },
  confidence_score: { type: Number, default: 35 },
  first_reported: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },

  // ── Feature 1: Source Stance Detection ──────────────────────────────────
  stance_analysis: { type: [stanceSchema], default: [] },
  divergence_score: { type: Number, default: 0 }, // 0-100: % publisher disagreement

  // ── Feature 2: Hallucination Guardrail Reflection Loop ──────────────────
  factuality_verified: { type: Boolean, default: false },
  reflection_logs: { type: [reflectionLogSchema], default: [] },
});

module.exports = mongoose.model('Event', eventSchema);
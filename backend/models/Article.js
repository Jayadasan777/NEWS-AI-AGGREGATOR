const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  unique_summary: { type: String, required: true },
  sector: { 
    type: String, 
    required: true,
  },
  image_url: { type: String, required: true },
  url: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  social_caption: { type: String, default: '' },
  social_hashtags: [{ type: String }],
  broadcast_status: { 
    type: String, 
    enum: ['pending', 'broadcasted', 'failed', 'skipped'], 
    default: 'pending' 
  },
  broadcast_time: { type: Date },
  broadcast_error: { type: String, default: '' }
});

module.exports = mongoose.model('Article', articleSchema);
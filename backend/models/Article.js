const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  unique_summary: { type: String, required: true },
  sector: { 
    type: String, 
    required: true,
    // Removed strict enum restrictions so all new sectors are accepted
  },
  image_url: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Article', articleSchema);
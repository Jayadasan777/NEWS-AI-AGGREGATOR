const Article = require('../models/Article');
const Event = require('../models/Event');
const { broadcastArticle } = require('../utils/socialBroadcast');

/**
 * Feature 4: Evergreen Content Recirculation Engine
 * Identifies high-confidence articles (linked to events with confidence_score >= 90)
 * older than 48 hours that have not been recirculated (is_recirculated !== true).
 * Safely re-queues a single instance with an "ICYMI: " caption prefix to prevent spam.
 */
const recirculateEvergreenArticles = async () => {
  try {
    console.log('♻️ Running Evergreen Content Recirculation check...');

    const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Find high-confidence events (confidence_score >= 90)
    const highConfidenceEvents = await Event.find({ confidence_score: { $gte: 90 } });
    if (highConfidenceEvents.length === 0) {
      console.log('ℹ️ Recirculation: No high-confidence (90%+) events found.');
      return { recirculatedCount: 0 };
    }

    const highConfidenceArticleIds = highConfidenceEvents.flatMap(e => e.source_articles);

    // Find candidate article created > 48h ago, in high confidence events, and not yet recirculated
    const candidate = await Article.findOne({
      _id: { $in: highConfidenceArticleIds },
      timestamp: { $lte: cutoff48h },
      is_recirculated: { $ne: true }
    }).sort({ timestamp: 1 }); // Oldest first

    if (!candidate) {
      console.log('ℹ️ Recirculation: No eligible evergreen articles >48h old found.');
      return { recirculatedCount: 0 };
    }

    // Apply ICYMI prefix and mark recirculated
    candidate.social_caption = `ICYMI: ${candidate.social_caption || candidate.title}`;
    candidate.is_recirculated = true;
    candidate.broadcast_status = 'pending';
    candidate.scheduled_broadcast_time = new Date();
    await candidate.save();

    console.log(`♻️ Recirculated Evergreen Article: "${candidate.title}" (Single-instance ICYMI queued)`);

    // Dispatch via social broadcast engine
    const isAutoEnabled = typeof global.AUTO_BROADCAST_ENABLED !== 'undefined'
      ? global.AUTO_BROADCAST_ENABLED
      : (process.env.AUTO_BROADCAST === 'true');

    if (isAutoEnabled) {
      await broadcastArticle(candidate, { force: true });
    }

    return { recirculatedCount: 1, articleTitle: candidate.title };
  } catch (error) {
    console.error('❌ Evergreen Recirculation Error:', error.message);
    return { recirculatedCount: 0, error: error.message };
  }
};

module.exports = { recirculateEvergreenArticles };

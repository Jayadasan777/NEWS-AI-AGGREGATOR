/**
 * Publisher Reliability Analytics Utility
 * Purpose: Computes consensus scores, historical stance alignment, coverage frequency,
 * and reliability metrics for publisher wire sources.
 * Non-blocking analytical helper. Does NOT alter database schemas or ingestion behavior.
 */

const Event = require('../models/Event');

/**
 * Computes publisher alignment and reliability metrics across historical events.
 *
 * @return {Promise<Object>} Aggregated publisher metrics
 */
const getPublisherAnalytics = async () => {
  try {
    const events = await Event.find({ stance_analysis: { $exists: true, $not: { $size: 0 } } })
      .select('event_title sector stance_analysis divergence_score confidence_score')
      .limit(100);

    const publisherStats = {};

    for (const event of events) {
      for (const stanceObj of event.stance_analysis) {
        const pub = stanceObj.publisher || 'Unknown';
        if (!publisherStats[pub]) {
          publisherStats[pub] = {
            publisher: pub,
            totalReports: 0,
            supportingCount: 0,
            contradictingCount: 0,
            neutralCount: 0,
            averageEventConfidence: 0,
            cumulativeConfidenceSum: 0
          };
        }

        const stat = publisherStats[pub];
        stat.totalReports += 1;
        stat.cumulativeConfidenceSum += (event.confidence_score || 35);

        if (stanceObj.stance === 'Supporting') stat.supportingCount += 1;
        else if (stanceObj.stance === 'Contradicting') stat.contradictingCount += 1;
        else stat.neutralCount += 1;
      }
    }

    const publishersArray = Object.values(publisherStats).map(p => {
      const avgConfidence = p.totalReports > 0 ? (p.cumulativeConfidenceSum / p.totalReports) : 0;
      const agreementRate = p.totalReports > 0 ? (((p.supportingCount + p.neutralCount) / p.totalReports) * 100) : 100;
      
      return {
        publisher: p.publisher,
        totalReports: p.totalReports,
        consensusRatePercent: Number(agreementRate.toFixed(1)),
        averageEventConfidence: Number(avgConfidence.toFixed(1)),
        breakdown: {
          supporting: p.supportingCount,
          contradicting: p.contradictingCount,
          neutral: p.neutralCount
        }
      };
    }).sort((a, b) => b.totalReports - a.totalReports);

    return {
      success: true,
      analyzedEventClusters: events.length,
      publishersCount: publishersArray.length,
      publishers: publishersArray
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      publishers: []
    };
  }
};

module.exports = { getPublisherAnalytics };

/**
 * Algorithm 2: Dynamic Publisher Credibility Scoring (DPCS)
 * Purpose: Self-learning online credibility model that dynamically tracks publisher
 * reporting behavior (agreement rate, timeliness, contradiction frequency, coverage)
 * and updates publisher trust matrix C_pub using Exponential Moving Average (EMA) smoothing.
 * 
 * Mathematical Formulation:
 *   C_raw = w_agree * R_agree + w_time * I_time + w_cov * F_cov - w_penalty * P_contra
 *   C_pub(t) = alpha * C_raw(t) + (1 - alpha) * C_pub(t-1)
 */

const publisherStore = new Map();

const DEFAULT_ALPHA = 0.20; // EMA smoothing factor
const DEFAULT_BASELINE = 85.0; // Initial baseline credibility for wire sources

// Reputational weight parameters
const WEIGHTS = {
  agree: 0.40,     // Stance Consensus Agreement
  time: 0.25,      // Timeliness Index
  cov: 0.20,       // Coverage Frequency
  penalty: 0.15    // Contradiction Penalty
};

/**
 * Gets or initializes a publisher credibility record.
 */
const getPublisherRecord = (publisherName) => {
  const pub = publisherName || 'Unknown';
  if (!publisherStore.has(pub)) {
    publisherStore.set(pub, {
      publisher: pub,
      credibilityScore: DEFAULT_BASELINE,
      totalDispatches: 0,
      supportingCount: 0,
      contradictingCount: 0,
      neutralCount: 0,
      lastUpdated: new Date().toISOString()
    });
  }
  return publisherStore.get(pub);
};

/**
 * Updates publisher credibility score dynamically based on new event report outcome.
 *
 * @param {string} publisherName - Name of news publisher
 * @param {Object} outcome - Report outcome metadata
 * @param {string} outcome.stance - 'Supporting', 'Contradicting', or 'Neutral'
 * @param {number} [outcome.hoursFromFirstReport=0] - Time offset relative to first report
 * @return {Object} Updated publisher credibility record
 */
const updatePublisherCredibility = (publisherName, outcome = {}) => {
  const record = getPublisherRecord(publisherName);
  const { stance = 'Neutral', hoursFromFirstReport = 0 } = outcome;

  record.totalDispatches += 1;
  if (stance === 'Supporting') record.supportingCount += 1;
  else if (stance === 'Contradicting') record.contradictingCount += 1;
  else record.neutralCount += 1;

  // Compute component indicators
  const R_agree = (record.supportingCount + record.neutralCount * 0.5) / record.totalDispatches;
  const I_time = Math.max(0, 1.0 - (hoursFromFirstReport / 48)); // Decay over 48h
  const F_cov = Math.min(1.0, record.totalDispatches / 20);      // Maxes out at 20 reports
  const P_contra = record.contradictingCount / record.totalDispatches;

  // Compute raw score on scale 0-100
  const C_raw = Math.max(0, Math.min(100, (
    (WEIGHTS.agree * R_agree + WEIGHTS.time * I_time + WEIGHTS.cov * F_cov - WEIGHTS.penalty * P_contra) * 100
  )));

  // Apply Exponential Moving Average (EMA) smoothing
  const priorScore = record.credibilityScore;
  const C_updated = DEFAULT_ALPHA * C_raw + (1 - DEFAULT_ALPHA) * priorScore;

  record.credibilityScore = Number(C_updated.toFixed(2));
  record.lastUpdated = new Date().toISOString();

  return { ...record };
};

/**
 * Gets current publisher credibility score (0-100).
 */
const getPublisherCredibilityScore = (publisherName) => {
  const record = getPublisherRecord(publisherName);
  return record.credibilityScore;
};

/**
 * Exports complete publisher trust matrix dictionary.
 */
const getAllPublisherCredibilityScores = () => {
  const result = {};
  for (const [pub, record] of publisherStore.entries()) {
    result[pub] = {
      credibilityScore: record.credibilityScore,
      totalDispatches: record.totalDispatches,
      breakdown: {
        supporting: record.supportingCount,
        contradicting: record.contradictingCount,
        neutral: record.neutralCount
      }
    };
  }
  return result;
};

module.exports = {
  updatePublisherCredibility,
  getPublisherCredibilityScore,
  getAllPublisherCredibilityScores
};

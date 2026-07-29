/**
 * Algorithm 1: Enhanced Fusion Scoring Algorithm (EFSA)
 * Purpose: Original multi-evidence event fusion scoring engine combining unigram lexical IoU,
 * character 3-gram TF-IDF cosine, named entity overlap, exponential temporal decay,
 * and sector taxonomy match into a normalized fusion score S_EFSA.
 * 
 * Mathematical Formulation:
 *   S_EFSA = w1*S_key + w2*S_head + w3*S_ent + w4*S_temp + w5*S_sec
 *   where sum(w_i) = 1.0
 */

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'of', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why'
]);

// Normalized Evidence Weights (sum = 1.0)
const WEIGHTS = {
  key: 0.25,   // Unigram Keyword IoU
  head: 0.30,  // Character 3-Gram Cosine
  ent: 0.25,   // Named Entity Overlap Ratio
  temp: 0.10,  // Exponential Temporal Decay
  sec: 0.10    // Sector Taxonomy Match
};

const DECAY_LAMBDA = 0.02; // Temporal decay parameter per hour

/**
 * Extracts candidate named entities (capitalized phrases, numerical figures, proper nouns).
 */
const extractEntities = (text) => {
  if (!text) return new Set();
  const matches = text.match(/\b([A-Z][a-zA-Z0-9]+|\$\d+[\d,.]*|\b\d{1,4}\b)\b/g) || [];
  return new Set(matches.map(m => m.toLowerCase()));
};

/**
 * Calculates unigram keyword IoU similarity S_key.
 */
const calculateKeywordScore = (titleA, titleB) => {
  const getTokens = (t) => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w)));
  const setA = getTokens(titleA);
  const setB = getTokens(titleB);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? (intersection / union) : 0;
};

/**
 * Calculates character 3-gram TF-IDF vector cosine similarity S_head.
 */
const calculateHeadlineCosineScore = (titleA, titleB) => {
  const getCharNgrams = (t) => {
    const s = t.toLowerCase().replace(/[^a-z0-9]/g, '');
    const counts = {};
    for (let i = 0; i <= s.length - 3; i++) {
      const gram = s.substring(i, i + 3);
      counts[gram] = (counts[gram] || 0) + 1;
    }
    return counts;
  };

  const vecA = getCharNgrams(titleA);
  const vecB = getCharNgrams(titleB);
  const keysA = Object.keys(vecA);
  const keysB = Object.keys(vecB);
  if (keysA.length === 0 || keysB.length === 0) return 0;

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const key of keysA) {
    magA += vecA[key] * vecA[key];
    if (vecB[key]) dotProduct += vecA[key] * vecB[key];
  }
  for (const key of keysB) {
    magB += vecB[key] * vecB[key];
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  return denominator > 0 ? (dotProduct / denominator) : 0;
};

/**
 * Calculates named entity overlap ratio S_ent.
 */
const calculateEntityScore = (titleA, titleB) => {
  const entA = extractEntities(titleA);
  const entB = extractEntities(titleB);
  if (entA.size === 0 || entB.size === 0) return 0;

  let matchCount = 0;
  for (const e of entA) {
    if (entB.has(e)) matchCount++;
  }
  const union = entA.size + entB.size - matchCount;
  return union > 0 ? (matchCount / union) : 0;
};

/**
 * Calculates exponential temporal decay score S_temp based on hours offset.
 */
const calculateTemporalScore = (timeA, timeB) => {
  const tA = new Date(timeA || Date.now()).getTime();
  const tB = new Date(timeB || Date.now()).getTime();
  const deltaHours = Math.abs(tA - tB) / (1000 * 60 * 60);
  return Math.exp(-DECAY_LAMBDA * deltaHours);
};

/**
 * Computes Enhanced Fusion Scoring Algorithm (EFSA) result.
 *
 * @param {Object} article - Candidate article object
 * @param {Object} event - Target event node object
 * @return {Object} EFSA calculation breakdown and decision boolean
 */
const computeEfsaScore = (article, event) => {
  const titleA = article.title || '';
  const titleB = event.event_title || '';

  const S_key = calculateKeywordScore(titleA, titleB);
  const S_head = calculateHeadlineCosineScore(titleA, titleB);
  const S_ent = calculateEntityScore(titleA, titleB);
  const S_temp = calculateTemporalScore(article.timestamp, event.first_reported);
  const S_sec = (article.sector && event.sector && article.sector === event.sector) ? 1.0 : 0.0;

  const S_EFSA = Number((
    WEIGHTS.key * S_key +
    WEIGHTS.head * S_head +
    WEIGHTS.ent * S_ent +
    WEIGHTS.temp * S_temp +
    WEIGHTS.sec * S_sec
  ).toFixed(4));

  // Fusion decision threshold: S_EFSA >= 0.22 triggers candidate match
  const passesEfsa = S_EFSA >= 0.22;

  return {
    S_EFSA,
    passesEfsa,
    breakdown: {
      S_key: Number(S_key.toFixed(4)),
      S_head: Number(S_head.toFixed(4)),
      S_ent: Number(S_ent.toFixed(4)),
      S_temp: Number(S_temp.toFixed(4)),
      S_sec: Number(S_sec.toFixed(4))
    }
  };
};

module.exports = {
  computeEfsaScore,
  calculateKeywordScore,
  calculateHeadlineCosineScore,
  calculateEntityScore,
  calculateTemporalScore
};

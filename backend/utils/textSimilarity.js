/**
 * Canonical Lexical and N-Gram Text Similarity Helper Module
 * Purpose: Provides unified Jaccard IoU and sub-word 3-gram Cosine calculations
 * shared across eventEngine.js, efsaEngine.js, and evaluation benchmark runners.
 * Prevents circular dependencies.
 */

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'of', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don',
  'should', 'now', 'his', 'her', 'its', 'our', 'your', 'their', 'he', 'she', 'it', 'they', 'we',
  'you', 'i', 'me', 'my', 'him', 'them', 'us', 'who', 'whom', 'whose', 'which', 'what', 'this',
  'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
  'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would', 'could', 'may', 'might',
  'must', 'shall', 'new', 'year', 'first', 'says', 'said', 'amid', 'as', 'over', 'out'
]);

const calculateJaccardSimilarity = (str1, str2) => {
  const cleanTokens = (str) =>
    (str || '').toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const set1 = new Set(cleanTokens(str1));
  const set2 = new Set(cleanTokens(str2));

  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
};

const buildCharNgramVector = (str, n = 3) => {
  const text = (str || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const freq = {};
  for (let i = 0; i <= text.length - n; i++) {
    const gram = text.slice(i, i + n);
    freq[gram] = (freq[gram] || 0) + 1;
  }
  return freq;
};

const calculateSemanticCosineSimilarity = (str1, str2) => {
  const vec1 = buildCharNgramVector(str1);
  const vec2 = buildCharNgramVector(str2);

  const allKeys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  let dot = 0, mag1 = 0, mag2 = 0;

  for (const key of allKeys) {
    const v1 = vec1[key] || 0;
    const v2 = vec2[key] || 0;
    dot += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  }

  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
};

module.exports = {
  STOP_WORDS,
  calculateJaccardSimilarity,
  calculateSemanticCosineSimilarity,
  buildCharNgramVector
};

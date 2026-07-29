/**
 * High-Volume Batch Performance & Load Benchmark Tool
 * Purpose: Simulates synthetic batch ingestion in-memory (100, 500, 1000, 5000 headline items)
 * to measure MD5 title hashing throughput, Stage 1 Jaccard/Cosine gating evaluation speed,
 * and memory/CPU throughput bounds. Does NOT modify production database.
 */

const crypto = require('crypto');

// Sample headlines pool for benchmark generation
const SAMPLE_HEADLINES = [
  'Nvidia announces next-generation Blackwell AI chip architecture at GTC',
  'Federal Reserve holds interest rates steady amid persistent inflation concerns',
  'SpaceX Starship completes landmark orbital flight test and controlled splashdown',
  'Bitcoin surges past landmark threshold as institutional adoption accelerates',
  'Tesla delivers record electric vehicles in latest quarterly earnings report',
  'Apple unveils iOS features with integrated on-device neural processing model',
  'Global climate summit concludes with historic transition agreement',
  'Real Madrid secures European football crown in dramatic final victory'
];

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'of', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why'
]);

const computeMd5Hash = (text) => crypto.createHash('md5').update(text.toLowerCase().trim()).digest('hex');

const computeJaccard = (titleA, titleB) => {
  const getTokens = (t) => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w)));
  const setA = getTokens(titleA);
  const setB = getTokens(titleB);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return intersection / union;
};

const runBenchmarkBatch = (count) => {
  const startMem = process.memoryUsage().heapUsed;
  const startTime = Date.now();

  // Generate synthetic headlines
  const headlines = [];
  for (let i = 0; i < count; i++) {
    const base = SAMPLE_HEADLINES[i % SAMPLE_HEADLINES.length];
    headlines.push(`${base} (Item ${i + 1})`);
  }

  // 1. Benchmark MD5 Title Hashing
  const hashStartTime = Date.now();
  const hashes = headlines.map(h => computeMd5Hash(h));
  const hashDuration = Date.now() - hashStartTime;

  // 2. Benchmark Stage 1 Gating Calculations (All-Pairs Comparison)
  const gateStartTime = Date.now();
  let comparisons = 0;
  let matchesCount = 0;

  // Compare each headline against a window of previous headlines
  for (let i = 0; i < headlines.length; i++) {
    const windowStart = Math.max(0, i - 50);
    for (let j = windowStart; j < i; j++) {
      comparisons++;
      const score = computeJaccard(headlines[i], headlines[j]);
      if (score >= 0.12) matchesCount++;
    }
  }
  const gateDuration = Date.now() - gateStartTime;
  const totalDuration = Date.now() - startTime;
  const endMem = process.memoryUsage().heapUsed;
  const memDeltaMb = Number(((endMem - startMem) / (1024 * 1024)).toFixed(2));

  const itemsPerSec = Math.round((count / (totalDuration / 1000)));

  return {
    itemCount: count,
    totalDurationMs: totalDuration,
    hashDurationMs: hashDuration,
    gateDurationMs: gateDuration,
    pairwiseComparisons: comparisons,
    gateMatches: matchesCount,
    throughputItemsPerSec: itemsPerSec,
    heapMemoryDeltaMb: memDeltaMb
  };
};

const runFullBenchmarkSuite = () => {
  console.log('====================================================');
  console.log('🚀 NISE HIGH-VOLUME INGESTION & GATING LOAD BENCHMARK');
  console.log('====================================================\n');

  const batchSizes = [100, 500, 1000, 5000];
  const results = [];

  for (const size of batchSizes) {
    console.log(`⚡ Simulating synthetic ingestion for ${size} articles...`);
    const res = runBenchmarkBatch(size);
    results.push(res);
    console.log(`   • Total Time: ${res.totalDurationMs} ms | Hashing: ${res.hashDurationMs} ms | Gating (${res.pairwiseComparisons} pairs): ${res.gateDurationMs} ms`);
    console.log(`   • Throughput: ${res.throughputItemsPerSec} items/sec | Memory Delta: ${res.heapMemoryDeltaMb} MB\n`);
  }

  console.log('====================================================');
  console.log('📊 LOAD BENCHMARK SUMMARY TABLE');
  console.log('====================================================');
  console.table(results);

  return results;
};

if (require.main === module) {
  runFullBenchmarkSuite();
}

module.exports = { runBenchmarkBatch, runFullBenchmarkSuite };

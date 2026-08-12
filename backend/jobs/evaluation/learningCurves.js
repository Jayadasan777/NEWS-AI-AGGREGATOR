/**
 * Learning Curves Analysis Script
 *
 * This script evaluates how baseline performance scales with training dataset size.
 *
 * Methodology:
 * 1. Load the full N=250 real dataset (testCases_v2_real.json)
 * 2. Create stratified subsets of sizes: [50, 100, 150, 200, 250]
 * 3. For each subset size:
 *    - Run Production Two-Stage Hybrid Baseline (Jaccard OR Cosine)
 *    - Run SBERT Baseline (Xenova/all-MiniLM-L6-v2)
 *    - Compute Accuracy and F1-Score
 * 4. Save results to learning_curves.json
 *
 * Output Format:
 * {
 *   sizes: [50, 100, 150, 200, 250],
 *   production_accuracy: [...],
 *   production_f1: [...],
 *   sbert_accuracy: [...],
 *   sbert_f1: [...]
 * }
 *
 * Random sampling uses fixed seed=42 for reproducibility.
 */

const fs = require('fs');
const path = require('path');

let pipeline;

async function initPipeline() {
  const transformers = await import('@xenova/transformers');
  pipeline = transformers.pipeline;
}

// ═════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════

function shuffleArray(arr, seed = 42) {
  const array = [...arr];
  let m = array.length, t, i;
  let s = seed;
  const pseudoRandom = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  while (m) {
    i = Math.floor(pseudoRandom() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

function simpleTokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function computeJaccard(str1, str2) {
  const t1 = new Set(simpleTokenize(str1));
  const t2 = new Set(simpleTokenize(str2));
  const intersection = new Set([...t1].filter(x => t2.has(x)));
  const union = new Set([...t1, ...t2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function computeChar3GramCosine(str1, str2) {
  const getGrams = (s) => {
    const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const grams = {};
    for (let i = 0; i < clean.length - 2; i++) {
      const g = clean.substring(i, i + 3);
      grams[g] = (grams[g] || 0) + 1;
    }
    return grams;
  };

  const g1 = getGrams(str1);
  const g2 = getGrams(str2);

  const keys = new Set([...Object.keys(g1), ...Object.keys(g2)]);
  let dot = 0, normA = 0, normB = 0;

  keys.forEach(k => {
    const v1 = g1[k] || 0;
    const v2 = g2[k] || 0;
    dot += v1 * v2;
    normA += v1 * v1;
    normB += v2 * v2;
  });

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function evaluatePredictions(predictions, groundTruths) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i] ? 'SAME' : 'DIFFERENT';
    const actual = groundTruths[i];
    if (pred === 'SAME' && actual === 'SAME') tp++;
    else if (pred === 'SAME' && actual === 'DIFFERENT') fp++;
    else if (pred === 'DIFFERENT' && actual === 'DIFFERENT') tn++;
    else if (pred === 'DIFFERENT' && actual === 'SAME') fn++;
  }

  const accuracy = (tp + tn) / predictions.length;
  const precision = (tp + fp) === 0 ? 0 : tp / (tp + fp);
  const recall = (tp + fn) === 0 ? 0 : tp / (tp + fn);
  const f1 = (precision + recall) === 0 ? 0 : 2 * (precision * recall) / (precision + recall);

  return {
    accuracy: Number((accuracy * 100).toFixed(2)),
    precision: Number((precision * 100).toFixed(2)),
    recall: Number((recall * 100).toFixed(2)),
    f1: Number((f1 * 100).toFixed(2)),
    tp, fp, tn, fn
  };
}

// ═════════════════════════════════════════════════════════════
// STRATIFIED SAMPLING
// ═════════════════════════════════════════════════════════════

function createStratifiedSubset(dataset, targetSize, seed = 42) {
  // Group by (sector + expected label) for stratified sampling
  const strata = {};
  dataset.forEach(item => {
    const key = `${item.sector || 'General'}_${item.expected}`;
    if (!strata[key]) strata[key] = [];
    strata[key].push(item);
  });

  const subset = [];
  const totalItems = dataset.length;

  // For each stratum, sample proportionally
  for (const [key, items] of Object.entries(strata)) {
    const shuffled = shuffleArray(items, seed);
    const stratumProportion = items.length / totalItems;
    const stratumTarget = Math.round(targetSize * stratumProportion);
    const sampled = shuffled.slice(0, Math.min(stratumTarget, shuffled.length));
    subset.push(...sampled);
  }

  // If we're under the target size due to rounding, pad with remaining samples
  if (subset.length < targetSize) {
    const remaining = dataset.filter(item => !subset.includes(item));
    const shuffledRemaining = shuffleArray(remaining, seed + 1);
    subset.push(...shuffledRemaining.slice(0, targetSize - subset.length));
  }

  return shuffleArray(subset.slice(0, targetSize), seed);
}

// ═════════════════════════════════════════════════════════════
// PRODUCTION BASELINE EVALUATION
// ═════════════════════════════════════════════════════════════

function evaluateProductionBaseline(pairs) {
  // Production Two-Stage Hybrid: Jaccard >= 0.12 OR Char3GramCosine >= 0.25
  const predictions = pairs.map(p =>
    computeJaccard(p.headline_a, p.headline_b) >= 0.12 ||
    computeChar3GramCosine(p.headline_a, p.headline_b) >= 0.25
  );

  const groundTruths = pairs.map(p => p.expected);
  return evaluatePredictions(predictions, groundTruths);
}

// ═════════════════════════════════════════════════════════════
// SBERT BASELINE EVALUATION
// ═════════════════════════════════════════════════════════════

async function evaluateSbertBaseline(pairs, extractor, threshold = 0.45) {
  console.log(`   ⏳ Embedding ${pairs.length} pairs with SBERT...`);

  const similarities = [];
  for (const pair of pairs) {
    const outA = await extractor(pair.headline_a, { pooling: 'mean', normalize: true });
    const outB = await extractor(pair.headline_b, { pooling: 'mean', normalize: true });
    const sim = cosineSimilarity(Array.from(outA.data), Array.from(outB.data));
    similarities.push(sim);
  }

  const predictions = similarities.map(s => s >= threshold);
  const groundTruths = pairs.map(p => p.expected);
  return evaluatePredictions(predictions, groundTruths);
}

// ═════════════════════════════════════════════════════════════
// MAIN LEARNING CURVE ANALYSIS
// ═════════════════════════════════════════════════════════════

async function runLearningCurveAnalysis() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('📊 LEARNING CURVES ANALYSIS: Baseline Performance vs. Dataset Size');
  console.log('═══════════════════════════════════════════════════════════════════════');

  // Load full N=250 dataset
  const dataPath = path.join(__dirname, 'testCases_v2_real.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Error: testCases_v2_real.json not found.');
    return;
  }

  const fullDataset = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`✅ Loaded full dataset: N=${fullDataset.length} pairs\n`);

  // Initialize SBERT model
  await initPipeline();
  console.log('🤗 Initializing SBERT model (Xenova/all-MiniLM-L6-v2)...');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('✅ SBERT model loaded\n');

  const sizes = [50, 100, 150, 200, 250];
  const productionAccuracy = [];
  const productionF1 = [];
  const sbertAccuracy = [];
  const sbertF1 = [];

  console.log('─────────────────────────────────────────────────────────────────────────');
  console.log('Dataset Size | Production Baseline       | SBERT Baseline');
  console.log('             | Accuracy | F1-Score       | Accuracy | F1-Score');
  console.log('─────────────────────────────────────────────────────────────────────────');

  for (const size of sizes) {
    console.log(`\n🔍 Evaluating with N=${size} samples...`);

    // Create stratified subset
    const subset = createStratifiedSubset(fullDataset, size, 42);

    // Evaluate Production Baseline
    console.log(`   ⚡ Running Production Baseline...`);
    const prodMetrics = evaluateProductionBaseline(subset);
    productionAccuracy.push(prodMetrics.accuracy);
    productionF1.push(prodMetrics.f1);

    // Evaluate SBERT Baseline (using optimal threshold τ=0.45 from validation)
    const sbertMetrics = await evaluateSbertBaseline(subset, extractor, 0.45);
    sbertAccuracy.push(sbertMetrics.accuracy);
    sbertF1.push(sbertMetrics.f1);

    console.log(`   ${String(size).padStart(12)} | ${String(prodMetrics.accuracy + '%').padStart(8)} | ${String(prodMetrics.f1 + '%').padStart(8)} | ${String(sbertMetrics.accuracy + '%').padStart(8)} | ${String(sbertMetrics.f1 + '%').padStart(8)}`);
  }

  console.log('─────────────────────────────────────────────────────────────────────────');

  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    description: "Learning curve analysis: baseline performance vs. dataset size",
    methodology: "Stratified random sampling with fixed seed=42 for reproducibility",
    dataset_source: "testCases_v2_real.json",
    sbert_threshold: 0.45,
    production_threshold: "Jaccard >= 0.12 OR Char3GramCosine >= 0.25",
    sizes,
    production_accuracy: productionAccuracy,
    production_f1: productionF1,
    sbert_accuracy: sbertAccuracy,
    sbert_f1: sbertF1
  };

  const outPath = path.join(__dirname, 'learning_curves.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log(`✅ Learning curves analysis complete!`);
  console.log(`📄 Results saved to: ${outPath}`);
  console.log('═══════════════════════════════════════════════════════════════════════');
}

if (require.main === module) {
  runLearningCurveAnalysis().catch(console.error);
}

module.exports = { runLearningCurveAnalysis };

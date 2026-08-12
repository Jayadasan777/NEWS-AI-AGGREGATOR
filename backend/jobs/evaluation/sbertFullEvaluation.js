/**
 * Comprehensive SBERT Evaluation on All Splits
 * Evaluates SBERT (Xenova/all-MiniLM-L6-v2) on train, val, and test splits
 * Tests multiple thresholds to find optimal performance
 */

const fs = require('fs');
const path = require('path');

let pipeline;

async function initPipeline() {
  const transformers = await import('@xenova/transformers');
  pipeline = transformers.pipeline;
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

  const mccDenom = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  const mcc = mccDenom === 0 ? 0 : ((tp * tn) - (fp * fn)) / mccDenom;

  return {
    accuracy: Number((accuracy * 100).toFixed(2)),
    precision: Number((precision * 100).toFixed(2)),
    recall: Number((recall * 100).toFixed(2)),
    f1: Number((f1 * 100).toFixed(2)),
    mcc: Number(mcc.toFixed(4)),
    tp, fp, tn, fn
  };
}

async function evaluateSplit(extractor, pairs, splitName) {
  console.log(`\n⏳ Embedding ${pairs.length} ${splitName} pairs...`);
  const sims = [];
  const truth = pairs.map(p => p.expected);
  const startTime = Date.now();

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const outA = await extractor(pair.headline_a, { pooling: 'mean', normalize: true });
    const outB = await extractor(pair.headline_b, { pooling: 'mean', normalize: true });
    const sim = cosineSimilarity(Array.from(outA.data), Array.from(outB.data));
    sims.push(sim);

    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${pairs.length} pairs...`);
    }
  }

  const elapsedMs = Date.now() - startTime;
  const msPerPair = Number((elapsedMs / pairs.length).toFixed(2));

  return { sims, truth, msPerPair };
}

async function runFullSbertEvaluation() {
  await initPipeline();
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤗 COMPREHENSIVE SBERT EVALUATION - ALL SPLITS');
  console.log('   Model: Xenova/all-MiniLM-L6-v2 (ONNX CPU)');
  console.log('═══════════════════════════════════════════════════════════');

  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  const trainPath = path.join(__dirname, 'splits_real', 'train.json');
  const valPath = path.join(__dirname, 'splits_real', 'val.json');
  const testPath = path.join(__dirname, 'splits_real', 'test.json');

  if (!fs.existsSync(trainPath) || !fs.existsSync(valPath) || !fs.existsSync(testPath)) {
    console.error('❌ Error: splits_real/ files not found. Run datasetSplitter.js first.');
    return;
  }

  const trainPairs = JSON.parse(fs.readFileSync(trainPath, 'utf8'));
  const valPairs = JSON.parse(fs.readFileSync(valPath, 'utf8'));
  const testPairs = JSON.parse(fs.readFileSync(testPath, 'utf8'));

  console.log(`\n📊 Dataset Distribution:`);
  console.log(`   Train: ${trainPairs.length} pairs`);
  console.log(`   Val:   ${valPairs.length} pairs`);
  console.log(`   Test:  ${testPairs.length} pairs`);
  console.log(`   Total: ${trainPairs.length + valPairs.length + testPairs.length} pairs`);

  // Evaluate each split
  const trainData = await evaluateSplit(extractor, trainPairs, 'TRAIN');
  const valData = await evaluateSplit(extractor, valPairs, 'VAL');
  const testData = await evaluateSplit(extractor, testPairs, 'TEST');

  // Test multiple thresholds on each split
  const thresholds = [0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60];

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 THRESHOLD SWEEP RESULTS');
  console.log('═══════════════════════════════════════════════════════════');

  const results = {
    timestamp: new Date().toISOString(),
    model: 'Xenova/all-MiniLM-L6-v2',
    dataset: 'testCases_v2_real.json',
    splits: {
      train: { count: trainPairs.length, latency_ms: trainData.msPerPair },
      val: { count: valPairs.length, latency_ms: valData.msPerPair },
      test: { count: testPairs.length, latency_ms: testData.msPerPair }
    },
    threshold_results: {}
  };

  for (const tau of thresholds) {
    console.log(`\n─────────────────────────────────────────────────────────`);
    console.log(`🔍 Threshold τ = ${tau.toFixed(2)}`);
    console.log(`─────────────────────────────────────────────────────────`);

    const trainPreds = trainData.sims.map(s => s >= tau);
    const valPreds = valData.sims.map(s => s >= tau);
    const testPreds = testData.sims.map(s => s >= tau);

    const trainMetrics = evaluatePredictions(trainPreds, trainData.truth);
    const valMetrics = evaluatePredictions(valPreds, valData.truth);
    const testMetrics = evaluatePredictions(testPreds, testData.truth);

    console.log(`\n  TRAIN (N=${trainPairs.length}):`);
    console.log(`    Accuracy:  ${trainMetrics.accuracy}%`);
    console.log(`    Precision: ${trainMetrics.precision}%`);
    console.log(`    Recall:    ${trainMetrics.recall}%`);
    console.log(`    F1-Score:  ${trainMetrics.f1}%`);
    console.log(`    MCC:       ${trainMetrics.mcc}`);

    console.log(`\n  VAL (N=${valPairs.length}):`);
    console.log(`    Accuracy:  ${valMetrics.accuracy}%`);
    console.log(`    Precision: ${valMetrics.precision}%`);
    console.log(`    Recall:    ${valMetrics.recall}%`);
    console.log(`    F1-Score:  ${valMetrics.f1}%`);
    console.log(`    MCC:       ${valMetrics.mcc}`);

    console.log(`\n  TEST (N=${testPairs.length}):`);
    console.log(`    Accuracy:  ${testMetrics.accuracy}%`);
    console.log(`    Precision: ${testMetrics.precision}%`);
    console.log(`    Recall:    ${testMetrics.recall}%`);
    console.log(`    F1-Score:  ${testMetrics.f1}%`);
    console.log(`    MCC:       ${testMetrics.mcc}`);

    results.threshold_results[tau] = {
      train: trainMetrics,
      val: valMetrics,
      test: testMetrics
    };
  }

  // Find optimal threshold based on validation F1
  let bestTau = 0.35;
  let bestValF1 = -1;
  for (const tau of thresholds) {
    const valF1 = results.threshold_results[tau].val.f1;
    if (valF1 > bestValF1) {
      bestValF1 = valF1;
      bestTau = tau;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`✅ OPTIMAL THRESHOLD: τ = ${bestTau.toFixed(2)}`);
  console.log(`   Selected based on Validation F1 = ${bestValF1.toFixed(2)}%`);
  console.log('═══════════════════════════════════════════════════════════');

  const optimalResults = results.threshold_results[bestTau];
  console.log(`\n📊 Final Results at Optimal Threshold (τ = ${bestTau}):`);
  console.log(`\n  TRAIN: Accuracy = ${optimalResults.train.accuracy}%`);
  console.log(`  VAL:   Accuracy = ${optimalResults.val.accuracy}%`);
  console.log(`  TEST:  Accuracy = ${optimalResults.test.accuracy}%`);

  results.optimal_threshold = bestTau;
  results.optimal_results = optimalResults;

  const outPath = path.join(__dirname, 'sbert-full-evaluation.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved to: ${outPath}`);
}

if (require.main === module) {
  runFullSbertEvaluation().catch(console.error);
}

module.exports = { runFullSbertEvaluation };

/**
 * SBERT Baseline Evaluation on Real Dataset (Xenova/all-MiniLM-L6-v2)
 * Reads from splits_real/val.json and splits_real/test.json
 * Outputs: sbert-baseline-results_real.json
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
  
  // Matthews Correlation Coefficient (MCC)
  const mccDenom = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  const mcc = mccDenom === 0 ? 0 : ((tp * tn) - (fp * fn)) / mccDenom;

  return {
    accuracy: Number(accuracy.toFixed(4)),
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4)),
    mcc: Number(mcc.toFixed(4)),
    tp, fp, tn, fn
  };
}

async function runSbertEvaluation() {
  await initPipeline();
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤗 SBERT BASELINE EVALUATION ON REAL DATASET (all-MiniLM-L6-v2)');
  console.log('═══════════════════════════════════════════════════════════');

  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  const valPath = path.join(__dirname, 'splits_real', 'val.json');
  const testPath = path.join(__dirname, 'splits_real', 'test.json');

  if (!fs.existsSync(valPath) || !fs.existsSync(testPath)) {
    console.error('❌ Error: splits_real/ files not found. Run datasetSplitter.js first.');
    return;
  }

  const valPairs = JSON.parse(fs.readFileSync(valPath, 'utf8'));
  const testPairs = JSON.parse(fs.readFileSync(testPath, 'utf8'));

  // Embed Validation set for threshold tuning
  console.log(`\n⏳ Embedding ${valPairs.length} VALIDATION pairs...`);
  const valSims = [];
  const valTruth = valPairs.map(p => p.expected);

  for (const pair of valPairs) {
    const outA = await extractor(pair.headline_a, { pooling: 'mean', normalize: true });
    const outB = await extractor(pair.headline_b, { pooling: 'mean', normalize: true });
    const sim = cosineSimilarity(Array.from(outA.data), Array.from(outB.data));
    valSims.push(sim);
  }

  // Threshold sweep on VALIDATION set
  const thresholds = [0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70];
  let bestTau = 0.35;
  let bestValF1 = -1;

  thresholds.forEach(tau => {
    const preds = valSims.map(s => s >= tau);
    const metrics = evaluatePredictions(preds, valTruth);
    if (metrics.f1 > bestValF1) {
      bestValF1 = metrics.f1;
      bestTau = tau;
    }
  });

  console.log(`✅ Optimal threshold selected on VALIDATION split: τ = ${bestTau} (Val F1 = ${(bestValF1 * 100).toFixed(2)}%)`);

  // Evaluate on held-out TEST split
  console.log(`\n⏳ Embedding ${testPairs.length} HELD-OUT TEST pairs...`);
  const testSims = [];
  const testTruth = testPairs.map(p => p.expected);
  const startTime = Date.now();

  for (const pair of testPairs) {
    const outA = await extractor(pair.headline_a, { pooling: 'mean', normalize: true });
    const outB = await extractor(pair.headline_b, { pooling: 'mean', normalize: true });
    const sim = cosineSimilarity(Array.from(outA.data), Array.from(outB.data));
    testSims.push(sim);
  }

  const elapsedMs = Date.now() - startTime;
  const msPerPair = Number((elapsedMs / testPairs.length).toFixed(2));

  const testPreds = testSims.map(s => s >= bestTau);
  const testMetrics = evaluatePredictions(testPreds, testTruth);

  console.log('\n📊 FINAL HELD-OUT TEST SPLIT RESULTS (τ = ' + bestTau + '):');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`  Accuracy:    ${(testMetrics.accuracy * 100).toFixed(2)}%`);
  console.log(`  Precision:   ${(testMetrics.precision * 100).toFixed(2)}%`);
  console.log(`  Recall:      ${(testMetrics.recall * 100).toFixed(2)}%`);
  console.log(`  F1-Score:    ${(testMetrics.f1 * 100).toFixed(2)}%`);
  console.log(`  MCC:         ${testMetrics.mcc}`);
  console.log(`  Latency:     ${msPerPair} ms/pair (CPU ONNX runtime)`);
  console.log(`  Confusion:   TP=${testMetrics.tp} FP=${testMetrics.fp} TN=${testMetrics.tn} FN=${testMetrics.fn}`);
  console.log('═══════════════════════════════════════════════════════════');

  const output = {
    timestamp: new Date().toISOString(),
    dataset: 'testCases_v2_real.json',
    dataset_source: 'real_rss_ingested_v2',
    split: 'held_out_test_split',
    optimal_threshold_from_val: bestTau,
    test_metrics: testMetrics,
    latency_ms_per_pair: msPerPair,
    test_sample_count: testPairs.length
  };

  const outPath = path.join(__dirname, 'sbert-baseline-results_real.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Results saved to: ${outPath}`);
}

if (require.main === module) {
  runSbertEvaluation().catch(console.error);
}

module.exports = { runSbertEvaluation };

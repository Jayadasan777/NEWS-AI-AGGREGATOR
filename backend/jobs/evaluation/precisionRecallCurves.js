/**
 * Precision-Recall Curve Generator for Production Baseline (Jaccard + Cosine + LLM)
 *
 * Purpose: Sweeps Jaccard threshold from 0.05 to 0.50 in 20 steps while holding
 * Cosine threshold constant at 0.25 (production setting). For each threshold,
 * computes precision, recall, and F1 on the test split.
 *
 * Production Baseline: 2-stage hybrid gate
 *   - Stage 1 (Gate): Jaccard(τ=0.12) OR Cosine(τ=0.25) triggers LLM call
 *   - Stage 2 (LLM): Llama 3.1-8B-instant final verdict (SAME/DIFFERENT)
 *
 * This script varies only the Jaccard threshold to trace the P-R curve.
 *
 * Input: splits_real/test.json (fallback: testCases.json)
 * Output: precision_recall_curves.json
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const {
  calculateJaccardSimilarity,
  calculateSemanticCosineSimilarity
} = require('../../utils/textSimilarity');
const { isSameEvent } = require('../eventEngine');

// Configuration
const COSINE_THRESHOLD = 0.25; // Fixed production setting
const PRODUCTION_JACCARD_THRESHOLD = 0.12; // Current production operating point
const MIN_THRESHOLD = 0.05;
const MAX_THRESHOLD = 0.50;
const NUM_STEPS = 20;

// Generate threshold sweep range
const generateThresholds = () => {
  const step = (MAX_THRESHOLD - MIN_THRESHOLD) / (NUM_STEPS - 1);
  const thresholds = [];
  for (let i = 0; i < NUM_STEPS; i++) {
    thresholds.push(Number((MIN_THRESHOLD + i * step).toFixed(3)));
  }
  return thresholds;
};

// Compute classification metrics
const computeMetrics = (tp, fp, tn, fn) => {
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = (tp + tn) / (tp + fp + tn + fn);

  return {
    precision: Number((precision * 100).toFixed(2)),
    recall: Number((recall * 100).toFixed(2)),
    f1: Number((f1 * 100).toFixed(2)),
    accuracy: Number((accuracy * 100).toFixed(2)),
    tp,
    fp,
    tn,
    fn
  };
};

// Main evaluation function
const runPrecisionRecallSweep = async () => {
  console.log('========================================================');
  console.log('📊 PRECISION-RECALL CURVE GENERATOR');
  console.log('   Production Baseline: Jaccard + Cosine + LLM');
  console.log('========================================================\n');

  // Load test data
  const testPathReal = path.join(__dirname, 'splits_real', 'test.json');
  const testPathFallback = path.join(__dirname, 'testCases.json');

  let testCases;
  let dataSource;

  if (fs.existsSync(testPathReal)) {
    testCases = JSON.parse(fs.readFileSync(testPathReal, 'utf8'));
    dataSource = 'splits_real/test.json';
    console.log(`✅ Loaded ${testCases.length} test cases from ${dataSource}`);
  } else if (fs.existsSync(testPathFallback)) {
    testCases = JSON.parse(fs.readFileSync(testPathFallback, 'utf8'));
    dataSource = 'testCases.json';
    console.log(`⚠️  Fallback: Loaded ${testCases.length} test cases from ${dataSource}`);
  } else {
    console.error('❌ No test data found. Exiting.');
    return;
  }

  // Pre-compute similarity scores for all pairs (avoid redundant computation)
  console.log('\n⏳ Pre-computing Jaccard and Cosine scores for all test pairs...');
  const pairScores = testCases.map((tc, i) => {
    const jaccard = calculateJaccardSimilarity(tc.headline_a, tc.headline_b);
    const cosine = calculateSemanticCosineSimilarity(tc.headline_a, tc.headline_b);
    const isActualSame = tc.expected === 'SAME';

    if ((i + 1) % 50 === 0) {
      console.log(`  Processed ${i + 1}/${testCases.length} pairs...`);
    }

    return {
      id: tc.id || `pair_${i + 1}`,
      headline_a: tc.headline_a,
      headline_b: tc.headline_b,
      jaccard,
      cosine,
      isActualSame
    };
  });
  console.log('✅ Pre-computation complete.\n');

  // LLM response cache (avoid duplicate API calls)
  const llmCache = new Map();

  const cachedLlmVerify = async (headlineA, headlineB) => {
    const key = `${headlineA}|||${headlineB}`;
    if (llmCache.has(key)) {
      return llmCache.get(key);
    }
    const result = await isSameEvent(headlineA, headlineB);
    llmCache.set(key, result);
    return result;
  };

  // Generate threshold range
  const thresholds = generateThresholds();
  console.log(`🔍 Evaluating ${NUM_STEPS} threshold operating points from ${MIN_THRESHOLD} to ${MAX_THRESHOLD}...\n`);

  // Storage for results
  const results = {
    metadata: {
      model: 'Production Baseline (Jaccard + Cosine + LLM)',
      llm_model: 'llama-3.1-8b-instant',
      test_set: dataSource,
      n_test_cases: testCases.length,
      cosine_threshold_fixed: COSINE_THRESHOLD,
      jaccard_threshold_sweep_range: [MIN_THRESHOLD, MAX_THRESHOLD],
      num_steps: NUM_STEPS,
      production_operating_point: PRODUCTION_JACCARD_THRESHOLD,
      timestamp: new Date().toISOString()
    },
    thresholds: [],
    precision: [],
    recall: [],
    f1: [],
    accuracy: [],
    llm_calls: [],
    confusion_matrices: [],
    production_operating_point: null
  };

  // Sweep thresholds
  for (let t of thresholds) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔎 Threshold τ = ${t.toFixed(3)} (Cosine fixed at ${COSINE_THRESHOLD})`);
    console.log(`${'='.repeat(60)}`);

    let tp = 0, fp = 0, tn = 0, fn = 0;
    let llmCallCount = 0;

    for (let i = 0; i < pairScores.length; i++) {
      const pair = pairScores[i];
      const passesGate = (pair.jaccard >= t) || (pair.cosine >= COSINE_THRESHOLD);

      let predicted = 'DIFFERENT';

      if (passesGate) {
        llmCallCount++;
        const llmSame = await cachedLlmVerify(pair.headline_a, pair.headline_b);
        predicted = llmSame ? 'SAME' : 'DIFFERENT';

        // Progress indicator
        if (llmCallCount % 10 === 0) {
          console.log(`  LLM calls: ${llmCallCount} | Processed: ${i + 1}/${pairScores.length}`);
        }
      }

      // Update confusion matrix
      if (pair.isActualSame && predicted === 'SAME') tp++;
      else if (!pair.isActualSame && predicted === 'DIFFERENT') tn++;
      else if (!pair.isActualSame && predicted === 'SAME') fp++;
      else if (pair.isActualSame && predicted === 'DIFFERENT') fn++;
    }

    const metrics = computeMetrics(tp, fp, tn, fn);

    console.log(`\n📊 Results for τ=${t.toFixed(3)}:`);
    console.log(`   Precision: ${metrics.precision}%`);
    console.log(`   Recall:    ${metrics.recall}%`);
    console.log(`   F1:        ${metrics.f1}%`);
    console.log(`   Accuracy:  ${metrics.accuracy}%`);
    console.log(`   LLM Calls: ${llmCallCount}/${pairScores.length} (${((llmCallCount / pairScores.length) * 100).toFixed(1)}%)`);

    // Store results
    results.thresholds.push(t);
    results.precision.push(metrics.precision);
    results.recall.push(metrics.recall);
    results.f1.push(metrics.f1);
    results.accuracy.push(metrics.accuracy);
    results.llm_calls.push(llmCallCount);
    results.confusion_matrices.push({
      threshold: t,
      tp,
      fp,
      tn,
      fn
    });

    // Capture production operating point
    if (t === PRODUCTION_JACCARD_THRESHOLD) {
      results.production_operating_point = {
        threshold: t,
        cosine_threshold: COSINE_THRESHOLD,
        precision: metrics.precision,
        recall: metrics.recall,
        f1: metrics.f1,
        accuracy: metrics.accuracy,
        llm_calls: llmCallCount,
        tp,
        fp,
        tn,
        fn
      };
    }

    // Brief pause to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // If production point not in sweep, compute it separately
  if (!results.production_operating_point) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 Computing Production Operating Point (τ=${PRODUCTION_JACCARD_THRESHOLD})`);
    console.log(`${'='.repeat(60)}`);

    let tp = 0, fp = 0, tn = 0, fn = 0, llmCallCount = 0;

    for (let pair of pairScores) {
      const passesGate = (pair.jaccard >= PRODUCTION_JACCARD_THRESHOLD) || (pair.cosine >= COSINE_THRESHOLD);
      let predicted = 'DIFFERENT';

      if (passesGate) {
        llmCallCount++;
        const llmSame = await cachedLlmVerify(pair.headline_a, pair.headline_b);
        predicted = llmSame ? 'SAME' : 'DIFFERENT';
      }

      if (pair.isActualSame && predicted === 'SAME') tp++;
      else if (!pair.isActualSame && predicted === 'DIFFERENT') tn++;
      else if (!pair.isActualSame && predicted === 'SAME') fp++;
      else if (pair.isActualSame && predicted === 'DIFFERENT') fn++;
    }

    const metrics = computeMetrics(tp, fp, tn, fn);

    results.production_operating_point = {
      threshold: PRODUCTION_JACCARD_THRESHOLD,
      cosine_threshold: COSINE_THRESHOLD,
      precision: metrics.precision,
      recall: metrics.recall,
      f1: metrics.f1,
      accuracy: metrics.accuracy,
      llm_calls: llmCallCount,
      tp,
      fp,
      tn,
      fn
    };
  }

  // Save results
  const outputPath = path.join(__dirname, 'precision_recall_curves.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ PRECISION-RECALL SWEEP COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`📁 Results saved to: ${outputPath}`);
  console.log(`\n🎯 Production Operating Point (Jaccard τ=${PRODUCTION_JACCARD_THRESHOLD}, Cosine τ=${COSINE_THRESHOLD}):`);
  console.log(`   Precision: ${results.production_operating_point.precision}%`);
  console.log(`   Recall:    ${results.production_operating_point.recall}%`);
  console.log(`   F1:        ${results.production_operating_point.f1}%`);
  console.log(`   Accuracy:  ${results.production_operating_point.accuracy}%`);
  console.log(`   LLM Calls: ${results.production_operating_point.llm_calls}/${testCases.length}`);
  console.log(`\n📈 Threshold range: [${MIN_THRESHOLD}, ${MAX_THRESHOLD}] in ${NUM_STEPS} steps`);
  console.log(`💾 Total cached LLM responses: ${llmCache.size}`);
  console.log(`\n🔬 Use this data to plot precision-recall curves and identify optimal operating points.`);
};

// Execute
runPrecisionRecallSweep()
  .then(() => {
    console.log('\n✅ Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed with error:', error);
    process.exit(1);
  });

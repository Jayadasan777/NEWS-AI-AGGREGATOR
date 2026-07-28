const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');

// Dot product / cosine similarity helper for 1D float arrays
const cosineSimilarity = (vecA, vecB) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const runSemanticGateTest = async () => {
  console.log('🚀 Initializing Local Sentence Transformer Model (Xenova/all-MiniLM-L6-v2)...');

  let pipeline;
  try {
    const transformers = require('@xenova/transformers');
    pipeline = transformers.pipeline;
  } catch (err) {
    console.error('❌ @xenova/transformers not yet installed. Please run npm install @xenova/transformers first.');
    return;
  }

  // Load feature extraction pipeline locally on CPU
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('✅ Model loaded successfully!\n');

  const testCasesPath = path.join(__dirname, 'testCases.json');
  const failureDiagPath = path.join(__dirname, 'gate-failure-diagnosis.json');

  let testCases, gateFailures;
  try {
    testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
    gateFailures = JSON.parse(fs.readFileSync(failureDiagPath, 'utf8'));
  } catch (err) {
    console.error('❌ Failed to read input files:', err.message);
    return;
  }

  const failingHeadlineSet = new Set(
    gateFailures.failed_pairs.map(f => `${f.headline_a} ||| ${f.headline_b}`)
  );

  console.log('⏳ Computing Sentence Embeddings for all 45 ground-truth pairs...\n');

  const pairResults = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];

    // Compute embeddings with mean pooling & normalization
    const outA = await extractor(tc.headline_a, { pooling: 'mean', normalize: true });
    const outB = await extractor(tc.headline_b, { pooling: 'mean', normalize: true });

    const vecA = Array.from(outA.data);
    const vecB = Array.from(outB.data);

    const sim = cosineSimilarity(vecA, vecB);
    const pairKey = `${tc.headline_a} ||| ${tc.headline_b}`;
    const isStage1Failure = failingHeadlineSet.has(pairKey);

    pairResults.push({
      index: i + 1,
      headline_a: tc.headline_a,
      headline_b: tc.headline_b,
      expected: tc.expected,
      is_stage1_failure: isStage1Failure,
      semantic_cosine: Number(sim.toFixed(4))
    });
  }

  // Test various similarity thresholds to evaluate precision / recall trade-offs
  const thresholdsToTest = [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70];
  const thresholdEvaluations = [];

  thresholdsToTest.forEach(thresh => {
    let caughtFailures = 0;
    let tp = 0, tn = 0, fp = 0, fn = 0;

    pairResults.forEach(pr => {
      const passes = pr.semantic_cosine >= thresh;
      if (pr.is_stage1_failure && passes) caughtFailures++;

      if (pr.expected === 'SAME' && passes) tp++;
      else if (pr.expected === 'DIFFERENT' && !passes) tn++;
      else if (pr.expected === 'DIFFERENT' && passes) fp++;
      else if (pr.expected === 'SAME' && !passes) fn++;
    });

    const totalFailingCount = gateFailures.failed_pairs.length; // 11
    const totalDiffCount = testCases.filter(t => t.expected === 'DIFFERENT').length; // 28

    const precision = (tp + fp) === 0 ? 0 : (tp / (tp + fp)) * 100;
    const recall = (tp + fn) === 0 ? 0 : (tp / (tp + fn)) * 100;
    const f1 = (precision + recall) === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    thresholdEvaluations.push({
      threshold: thresh,
      caught_failing_pairs: `${caughtFailures}/${totalFailingCount}`,
      false_positives_passed: `${fp}/${totalDiffCount}`,
      precision: `${precision.toFixed(2)}%`,
      recall: `${recall.toFixed(2)}%`,
      f1_score: `${f1.toFixed(2)}%`
    });
  });

  const outputData = {
    model_used: "Xenova/all-MiniLM-L6-v2 (local CPU ONNX pipeline)",
    total_pairs: pairResults.length,
    threshold_evaluations: thresholdEvaluations,
    pair_results: pairResults
  };

  const outputPath = path.join(__dirname, 'semantic-gate-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`✅ Results exported to: ${outputPath}\n`);

  console.log('### 📊 Semantic Embedding Threshold Evaluation\n');
  console.log('| Threshold | Caught Failing SAME Pairs (out of 11) | False Positives Passed (out of 28 DIFFERENT) | Precision | Recall | F1-Score |');
  console.log('| :--- | :---: | :---: | :---: | :---: | :---: |');
  thresholdEvaluations.forEach(te => {
    console.log(`| **${te.threshold.toFixed(2)}** | ${te.caught_failing_pairs} | ${te.false_positives_passed} | ${te.precision} | ${te.recall} | ${te.f1_score} |`);
  });

  console.log('\n### 🔍 11 Failing SAME Pairs Breakdown under Semantic Embedding Cosine:\n');
  pairResults.filter(p => p.is_stage1_failure).forEach(p => {
    console.log(`- **"${p.headline_a}"** vs **"${p.headline_b}"**`);
    console.log(`  └─ Semantic Cosine: **${p.semantic_cosine}**\n`);
  });
};

runSemanticGateTest();

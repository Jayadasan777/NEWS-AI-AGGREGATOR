const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');
const {
  calculateJaccardSimilarity,
  calculateSemanticCosineSimilarity,
  isSameEvent
} = require('../eventEngine');
const { pipeline } = require('@xenova/transformers');

const JACCARD_THRESHOLD = 0.12;
const CHAR_COSINE_THRESHOLD = 0.25;

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

const runFullHybridTest = async () => {
  console.log('🚀 Initializing Local Sentence Transformer Model (Xenova/all-MiniLM-L6-v2)...');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('✅ Model loaded successfully!\n');

  const testCasesPath = path.join(__dirname, 'testCases.json');
  let testCases;
  try {
    testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
  } catch (err) {
    console.error('❌ Failed to read testCases.json:', err.message);
    return;
  }

  // Pre-compute sentence embeddings & lexical similarities for all 45 pairs
  console.log('⏳ Pre-computing embeddings & lexical scores for 45 pairs...');
  const cachedPairs = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const jaccard = calculateJaccardSimilarity(tc.headline_a, tc.headline_b);
    const charCosine = calculateSemanticCosineSimilarity(tc.headline_a, tc.headline_b);

    const outA = await extractor(tc.headline_a, { pooling: 'mean', normalize: true });
    const outB = await extractor(tc.headline_b, { pooling: 'mean', normalize: true });
    const vecA = Array.from(outA.data);
    const vecB = Array.from(outB.data);
    const semanticCosine = cosineSimilarity(vecA, vecB);

    cachedPairs.push({
      headline_a: tc.headline_a,
      headline_b: tc.headline_b,
      expected: tc.expected,
      jaccard,
      charCosine,
      semanticCosine
    });
  }

  const thresholdsToEvaluate = [0.40, 0.45];
  const evaluatedStrategies = [];

  for (const semThresh of thresholdsToEvaluate) {
    console.log(`\n⏳ Running Full 3-Stage Hybrid Gating at Semantic Threshold T = ${semThresh.toFixed(2)}...`);

    let TP = 0, TN = 0, FP = 0, FN = 0;
    let llmCalls = 0;

    for (let i = 0; i < cachedPairs.length; i++) {
      const pair = cachedPairs[i];
      const passesJaccard = pair.jaccard >= JACCARD_THRESHOLD;
      const passesCharCosine = pair.charCosine >= CHAR_COSINE_THRESHOLD;
      const passesSemanticCosine = pair.semanticCosine >= semThresh;

      const passesGating = passesJaccard || passesCharCosine || passesSemanticCosine;

      let predicted = 'DIFFERENT';
      if (passesGating) {
        llmCalls++;
        console.log(`[Gate Passed: J=${pair.jaccard.toFixed(2)} C=${pair.charCosine.toFixed(2)} S=${pair.semanticCosine.toFixed(2)}] Pair ${i + 1}/45 calling Llama 3...`);
        const matches = await isSameEvent(pair.headline_a, pair.headline_b);
        predicted = matches ? 'SAME' : 'DIFFERENT';
        await new Promise(r => setTimeout(r, 500)); // Respect rate limits
      } else {
        console.log(`[Gate Skipped] Pair ${i + 1}/45 bypassed LLM call.`);
      }

      if (pair.expected === 'SAME' && predicted === 'SAME') TP++;
      else if (pair.expected === 'DIFFERENT' && predicted === 'DIFFERENT') TN++;
      else if (pair.expected === 'DIFFERENT' && predicted === 'SAME') FP++;
      else if (pair.expected === 'SAME' && predicted === 'DIFFERENT') FN++;
    }

    const accuracy = ((TP + TN) / cachedPairs.length) * 100;
    const precision = (TP + FP) === 0 ? 0 : (TP / (TP + FP)) * 100;
    const recall = (TP + FN) === 0 ? 0 : (TP / (TP + FN)) * 100;
    const f1Score = (precision + recall) === 0 ? 0 : 2 * ((precision * recall) / (precision + recall));

    evaluatedStrategies.push({
      threshold: semThresh,
      accuracy: Number(accuracy.toFixed(2)),
      precision: Number(precision.toFixed(2)),
      recall: Number(recall.toFixed(2)),
      f1_score: Number(f1Score.toFixed(2)),
      llm_calls: llmCalls,
      confusion_matrix: { TP, TN, FP, FN }
    });
  }

  // Combine with known baselines for complete comparative analysis
  const summaryOutput = {
    baseline_production_hybrid_2stage: {
      strategy: "Hybrid 2-Stage (Jaccard + Char Cosine)",
      accuracy: "73.33%",
      precision: "85.71%",
      recall: "35.29%",
      f1_score: "50.00%",
      llm_calls: 11
    },
    baseline_llm_only: {
      strategy: "LLM-Only (Unconditional)",
      accuracy: "97.78%",
      precision: "94.44%",
      recall: "100.00%",
      f1_score: "97.14%",
      llm_calls: 45
    },
    full_hybrid_3stage_experiments: evaluatedStrategies
  };

  const outputPath = path.join(__dirname, 'full-hybrid-semantic-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(summaryOutput, null, 2));
  console.log(`\n✅ Results saved to: ${outputPath}\n`);

  console.log('### 📊 FULL 3-STAGE HYBRID vs BASELINES COMPARISON TABLE\n');
  console.log('| Strategy / Threshold | Accuracy | Precision | Recall | F1-Score | LLM Calls |');
  console.log('| :--- | :---: | :---: | :---: | :---: | :---: |');
  console.log(`| **Production 2-Stage Baseline** | 73.33% | 85.71% | 35.29% | 50.00% | 11 |`);
  console.log(`| **Full 3-Stage (Semantic T = 0.40)** | ${evaluatedStrategies[0].accuracy}% | ${evaluatedStrategies[0].precision}% | ${evaluatedStrategies[0].recall}% | ${evaluatedStrategies[0].f1_score}% | ${evaluatedStrategies[0].llm_calls} |`);
  console.log(`| **Full 3-Stage (Semantic T = 0.45)** | ${evaluatedStrategies[1].accuracy}% | ${evaluatedStrategies[1].precision}% | ${evaluatedStrategies[1].recall}% | ${evaluatedStrategies[1].f1_score}% | ${evaluatedStrategies[1].llm_calls} |`);
  console.log(`| **LLM-Only Ceiling** | 97.78% | 94.44% | 100.00% | 97.14% | 45 |`);
};

runFullHybridTest();

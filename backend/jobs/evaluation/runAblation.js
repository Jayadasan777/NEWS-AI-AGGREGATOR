const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');
const {
  calculateJaccardSimilarity,
  calculateSemanticCosineSimilarity,
  isSameEvent,
  findMatchingEvent
} = require('../eventEngine');

const JACCARD_THRESHOLD = 0.12;
const COSINE_THRESHOLD = 0.25;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const calculateMetrics = (TP, TN, FP, FN, total, llmCalls) => {
  const accuracy = total === 0 ? 0 : ((TP + TN) / total) * 100;
  const precision = (TP + FP) === 0 ? 0 : (TP / (TP + FP)) * 100;
  const recall = (TP + FN) === 0 ? 0 : (TP / (TP + FN)) * 100;
  const f1Score = (precision + recall) === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return {
    accuracy: `${accuracy.toFixed(2)}%`,
    precision: `${precision.toFixed(2)}%`,
    recall: `${recall.toFixed(2)}%`,
    f1_score: `${f1Score.toFixed(2)}%`,
    llm_calls_made: llmCalls,
    confusion_matrix: {
      True_Positives: TP,
      True_Negatives: TN,
      False_Positives: FP,
      False_Negatives: FN
    }
  };
};

const runAblation = async () => {
  console.log('🚀 Starting Ablation Study on N=45 Ground-Truth Dataset...\n');

  const testCasesPath = path.join(__dirname, 'testCases.json');
  let testCases;
  try {
    testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
  } catch (err) {
    console.error('❌ Failed to read testCases.json:', err.message);
    return;
  }

  const total = testCases.length;

  // ── Strategy 1: Jaccard-Only (No LLM, No Cosine) ──────────────────────────
  console.log('--- Running Strategy 1: Jaccard-Only ---');
  let tp1 = 0, tn1 = 0, fp1 = 0, fn1 = 0;
  for (const tc of testCases) {
    const score = calculateJaccardSimilarity(tc.headline_a, tc.headline_b);
    const predicted = score >= JACCARD_THRESHOLD ? 'SAME' : 'DIFFERENT';
    if (tc.expected === 'SAME' && predicted === 'SAME') tp1++;
    else if (tc.expected === 'DIFFERENT' && predicted === 'DIFFERENT') tn1++;
    else if (tc.expected === 'DIFFERENT' && predicted === 'SAME') fp1++;
    else if (tc.expected === 'SAME' && predicted === 'DIFFERENT') fn1++;
  }
  const res1 = calculateMetrics(tp1, tn1, fp1, fn1, total, 0);

  // ── Strategy 2: Cosine-Only (No LLM, No Jaccard) ──────────────────────────
  console.log('--- Running Strategy 2: Cosine-Only ---');
  let tp2 = 0, tn2 = 0, fp2 = 0, fn2 = 0;
  for (const tc of testCases) {
    const score = calculateSemanticCosineSimilarity(tc.headline_a, tc.headline_b);
    const predicted = score >= COSINE_THRESHOLD ? 'SAME' : 'DIFFERENT';
    if (tc.expected === 'SAME' && predicted === 'SAME') tp2++;
    else if (tc.expected === 'DIFFERENT' && predicted === 'DIFFERENT') tn2++;
    else if (tc.expected === 'DIFFERENT' && predicted === 'SAME') fp2++;
    else if (tc.expected === 'SAME' && predicted === 'DIFFERENT') fn2++;
  }
  const res2 = calculateMetrics(tp2, tn2, fp2, fn2, total, 0);

  // ── Strategy 3: LLM-Only (Unconditional LLM on all pairs) ─────────────────
  console.log('--- Running Strategy 3: LLM-Only (45 Unconditional API Calls) ---');
  let tp3 = 0, tn3 = 0, fp3 = 0, fn3 = 0, llmCalls3 = 0;
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`[LLM-Only] Pair ${i + 1}/${total}...`);
    const matches = await isSameEvent(tc.headline_a, tc.headline_b);
    llmCalls3++;
    const predicted = matches ? 'SAME' : 'DIFFERENT';
    if (tc.expected === 'SAME' && predicted === 'SAME') tp3++;
    else if (tc.expected === 'DIFFERENT' && predicted === 'DIFFERENT') tn3++;
    else if (tc.expected === 'DIFFERENT' && predicted === 'SAME') fp3++;
    else if (tc.expected === 'SAME' && predicted === 'DIFFERENT') fn3++;

    await sleep(2000); // 2s rate limit delay
  }
  const res3 = calculateMetrics(tp3, tn3, fp3, fn3, total, llmCalls3);

  // ── Strategy 4: Hybrid (Current Production System) ────────────────────────
  console.log('\n--- Running Strategy 4: Hybrid Production System (Two-Stage Gate) ---');
  let tp4 = 0, tn4 = 0, fp4 = 0, fn4 = 0, llmCalls4 = 0;
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const jaccard = calculateJaccardSimilarity(tc.headline_a, tc.headline_b);
    const cosine = calculateSemanticCosineSimilarity(tc.headline_a, tc.headline_b);
    const passesGating = jaccard >= JACCARD_THRESHOLD || cosine >= COSINE_THRESHOLD;

    let predicted = 'DIFFERENT';
    if (passesGating) {
      console.log(`[Hybrid Gating Passed] Pair ${i + 1}/${total} calling LLM...`);
      const matches = await isSameEvent(tc.headline_a, tc.headline_b);
      llmCalls4++;
      predicted = matches ? 'SAME' : 'DIFFERENT';
      await sleep(2000); // 2s rate limit delay
    } else {
      console.log(`[Hybrid Gating Skipped] Pair ${i + 1}/${total} bypassed LLM call.`);
    }

    if (tc.expected === 'SAME' && predicted === 'SAME') tp4++;
    else if (tc.expected === 'DIFFERENT' && predicted === 'DIFFERENT') tn4++;
    else if (tc.expected === 'DIFFERENT' && predicted === 'SAME') fp4++;
    else if (tc.expected === 'SAME' && predicted === 'DIFFERENT') fn4++;
  }
  const res4 = calculateMetrics(tp4, tn4, fp4, fn4, total, llmCalls4);

  // Assemble full results
  const ablationOutput = {
    total_test_cases: total,
    strategies: {
      jaccard_only: res1,
      cosine_only: res2,
      llm_only: res3,
      hybrid_production: res4
    }
  };

  const outputPath = path.join(__dirname, 'ablation-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(ablationOutput, null, 2));
  console.log(`\n✅ Ablation results saved to: ${outputPath}\n`);

  // Markdown Summary Table
  console.log('### 📊 Ablation Study Summary Table\n');
  console.log('| Strategy | Accuracy | Precision | Recall | F1-Score | LLM Calls |');
  console.log('| :--- | :---: | :---: | :---: | :---: | :---: |');
  console.log(`| **Jaccard-Only** | ${res1.accuracy} | ${res1.precision} | ${res1.recall} | ${res1.f1_score} | ${res1.llm_calls_made} |`);
  console.log(`| **Cosine-Only** | ${res2.accuracy} | ${res2.precision} | ${res2.recall} | ${res2.f1_score} | ${res2.llm_calls_made} |`);
  console.log(`| **LLM-Only** | ${res3.accuracy} | ${res3.precision} | ${res3.recall} | ${res3.f1_score} | ${res3.llm_calls_made} |`);
  console.log(`| **Hybrid (Production)** | ${res4.accuracy} | ${res4.precision} | ${res4.recall} | ${res4.f1_score} | ${res4.llm_calls_made} |`);
};

runAblation();

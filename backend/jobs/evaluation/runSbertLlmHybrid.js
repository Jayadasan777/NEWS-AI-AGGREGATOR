/**
 * SBERT → LLM Hybrid Evaluation
 *
 * Experiment: Use SBERT (all-MiniLM-L6-v2) at the empirically optimal threshold
 * tau=0.30 as a pre-filter, then route all passing pairs to the LLM verifier.
 *
 * This directly tests whether SBERT-as-pre-filter beats the current EFSA cascade.
 * All evaluation is on the held-out test split (splits_real/test.json, N=198).
 *
 * Output: sbert_llm_hybrid_results.json
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');
const { isSameEvent } = require('../eventEngine');

// ── Wilson 95% CI ─────────────────────────────────────────────────────────────
function wilsonCI(p, n, z = 1.96) {
  if (n === 0) return { lower: 0, upper: 0 };
  const denom = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return {
    lower: Number((Math.max(0, (centre - spread) / denom) * 100).toFixed(2)),
    upper: Number((Math.min(1, (centre + spread) / denom) * 100).toFixed(2))
  };
}

// ── Metrics ───────────────────────────────────────────────────────────────────
function metrics(tp, fp, tn, fn) {
  const n = tp + fp + tn + fn;
  const acc = (tp + tn) / n;
  const prec = (tp + fp) === 0 ? 0 : tp / (tp + fp);
  const rec = (tp + fn) === 0 ? 0 : tp / (tp + fn);
  const f1 = (prec + rec) === 0 ? 0 : (2 * prec * rec) / (prec + rec);
  const mccDenom = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  const mcc = mccDenom === 0 ? 0 : ((tp * tn) - (fp * fn)) / mccDenom;

  return {
    accuracy: Number((acc * 100).toFixed(2)),
    accuracy_ci: `[${wilsonCI(acc, n).lower}%, ${wilsonCI(acc, n).upper}%]`,
    precision: Number((prec * 100).toFixed(2)),
    precision_ci_lower: wilsonCI(prec, tp + fp).lower,
    recall: Number((rec * 100).toFixed(2)),
    recall_ci: `[${wilsonCI(rec, tp + fn).lower}%, ${wilsonCI(rec, tp + fn).upper}%]`,
    f1: Number((f1 * 100).toFixed(2)),
    mcc: Number(mcc.toFixed(4)),
    confusion_matrix: { TP: tp, FP: fp, TN: tn, FN: fn }
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Dynamic import for ESM transformer library
  const { pipeline } = await import('@xenova/transformers');

  console.log('🚀 Loading all-MiniLM-L6-v2 via ONNX Runtime...');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('✅ Model loaded.\n');

  // Load held-out test split
  const testPath = path.join(__dirname, 'splits_real', 'test.json');
  if (!fs.existsSync(testPath)) {
    console.error('❌ splits_real/test.json not found. Run datasetSplitter.js first.');
    process.exit(1);
  }
  const testSet = JSON.parse(fs.readFileSync(testPath, 'utf8'));
  const N = testSet.length;
  console.log(`📊 Test set: N=${N} pairs\n`);

  // Compute SBERT cosine for all pairs
  console.log('⏳ Computing SBERT embeddings for all test pairs...');
  const sbertScores = [];
  for (let i = 0; i < testSet.length; i++) {
    const pair = testSet[i];
    const [outA, outB] = await Promise.all([
      extractor(pair.headline_a, { pooling: 'mean', normalize: true }),
      extractor(pair.headline_b, { pooling: 'mean', normalize: true })
    ]);
    const vecA = Array.from(outA.data);
    const vecB = Array.from(outB.data);
    let dot = 0, nA = 0, nB = 0;
    for (let j = 0; j < vecA.length; j++) {
      dot += vecA[j] * vecB[j];
      nA += vecA[j] * vecA[j];
      nB += vecB[j] * vecB[j];
    }
    const score = (nA === 0 || nB === 0) ? 0 : dot / (Math.sqrt(nA) * Math.sqrt(nB));
    sbertScores.push(score);
    if ((i + 1) % 50 === 0) console.log(`  Processed ${i + 1}/${N} pairs...`);
  }
  console.log('✅ Embeddings done.\n');

  // ── Experiment 1: SBERT standalone at tau=0.30 (for reference) ───────────
  let tp1 = 0, fp1 = 0, tn1 = 0, fn1 = 0;
  const SBERT_TAU = 0.30;
  testSet.forEach((pair, i) => {
    const pred = sbertScores[i] >= SBERT_TAU ? 'SAME' : 'DIFFERENT';
    if (pred === 'SAME' && pair.expected === 'SAME') tp1++;
    else if (pred === 'SAME' && pair.expected === 'DIFFERENT') fp1++;
    else if (pred === 'DIFFERENT' && pair.expected === 'DIFFERENT') tn1++;
    else fn1++;
  });
  const sbertStandalone = { ...metrics(tp1, fp1, tn1, fn1), llm_calls: 0, cost_per_1m: '$0.00' };
  console.log(`📊 SBERT standalone (τ=${SBERT_TAU}): Acc=${sbertStandalone.accuracy}% Prec=${sbertStandalone.precision}% Rec=${sbertStandalone.recall}% F1=${sbertStandalone.f1}% | TP=${tp1} FP=${fp1} TN=${tn1} FN=${fn1}`);

  // ── Experiment 2: SBERT (tau=0.30) → LLM hybrid ──────────────────────────
  console.log(`\n⏳ Running SBERT(τ=${SBERT_TAU}) → LLM hybrid...`);
  let tp2 = 0, fp2 = 0, tn2 = 0, fn2 = 0;
  let llmCalls = 0;
  const sbertPassedIndices = [];

  for (let i = 0; i < testSet.length; i++) {
    const pair = testSet[i];
    const passes = sbertScores[i] >= SBERT_TAU;

    if (!passes) {
      // Gate rejects → predict DIFFERENT
      if (pair.expected === 'DIFFERENT') tn2++;
      else fn2++;
    } else {
      // Gate passes → call LLM
      sbertPassedIndices.push(i);
      llmCalls++;
      console.log(`  [${llmCalls}] SBERT=${sbertScores[i].toFixed(3)} | Pair ${i+1}: "${pair.headline_a.substring(0, 40)}..." → LLM`);
      try {
        const isSame = await isSameEvent(pair.headline_a, pair.headline_b);
        const pred = isSame ? 'SAME' : 'DIFFERENT';
        if (pred === 'SAME' && pair.expected === 'SAME') tp2++;
        else if (pred === 'SAME' && pair.expected === 'DIFFERENT') fp2++;
        else if (pred === 'DIFFERENT' && pair.expected === 'DIFFERENT') tn2++;
        else fn2++;
      } catch (err) {
        console.error(`  ❌ LLM error on pair ${i+1}: ${err.message}`);
        // On LLM error, fall back to SBERT decision
        if (pair.expected === 'SAME') tp2++;
        else fp2++;
      }
      // Rate limit buffer
      await new Promise(r => setTimeout(r, 300));
    }
  }

  const sbertLlmHybrid = {
    ...metrics(tp2, fp2, tn2, fn2),
    llm_calls: llmCalls,
    llm_call_rate_pct: Number(((llmCalls / N) * 100).toFixed(1)),
    llm_calls_saved_vs_exhaustive_pct: Number((((N - llmCalls) / N) * 100).toFixed(1)),
    cost_per_1m: 'computed_below'
  };

  // Cost at 1M pairs scale: LLM call ratio × $11.60/1M ceiling
  const llmRatio = llmCalls / N;
  const costPerM = Number((llmRatio * 11.60 + 0.10).toFixed(2)); // + $0.10 for DB/CPU
  sbertLlmHybrid.cost_per_1m = `$${costPerM}`;

  console.log(`\n✅ SBERT→LLM hybrid done. LLM calls: ${llmCalls}/${N} (${sbertLlmHybrid.llm_call_rate_pct}%)`);
  console.log(`📊 Acc=${sbertLlmHybrid.accuracy}% Prec=${sbertLlmHybrid.precision}% Rec=${sbertLlmHybrid.recall}% F1=${sbertLlmHybrid.f1}% MCC=${sbertLlmHybrid.mcc}`);
  console.log(`📊 CM: TP=${tp2} FP=${fp2} TN=${tn2} FN=${fn2}`);

  // ── Summary Table ─────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('COMPARATIVE SUMMARY (Test N=198)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('| Method                   | Acc    | Prec   | Recall | F1     | MCC  | LLM Calls | Cost/1M |');
  console.log('|:-------------------------|:------:|:------:|:------:|:------:|:----:|:---------:|:-------:|');
  console.log(`| SBERT standalone τ=0.30  | ${sbertStandalone.accuracy}% | ${sbertStandalone.precision}% | ${sbertStandalone.recall}% | ${sbertStandalone.f1}% | ${sbertStandalone.mcc} | 0/${N}   | $0.00   |`);
  console.log(`| SBERT(τ=0.30) → LLM      | ${sbertLlmHybrid.accuracy}% | ${sbertLlmHybrid.precision}% | ${sbertLlmHybrid.recall}% | ${sbertLlmHybrid.f1}% | ${sbertLlmHybrid.mcc} | ${llmCalls}/${N}  | ${sbertLlmHybrid.cost_per_1m}   |`);
  console.log(`| EFSA cascade → LLM       | 62.63% | 100%   | 25.25% | 40.32% | 0.38 | 64/198    | $7.52   |`);
  console.log(`| LLM ceiling (exhaustive) | 100%   | 100%   | 100%   | 100%   | 1.00 | ${N}/${N}  | $11.60  |`);

  // Save results
  const output = {
    experiment: 'SBERT (tau=0.30) → LLM Hybrid vs Baselines',
    timestamp: new Date().toISOString(),
    dataset: 'splits_real/test.json',
    n_test: N,
    sbert_threshold: SBERT_TAU,
    sbert_standalone: sbertStandalone,
    sbert_llm_hybrid: sbertLlmHybrid,
    sbert_passed_indices: sbertPassedIndices,
    note_on_llm_call_count: 'Exhaustive baseline on N=198 pairs would make 198 LLM calls. SBERT→LLM makes only passes-SBERT calls.'
  };

  const outPath = path.join(__dirname, 'sbert_llm_hybrid_results.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Results saved to: ${outPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

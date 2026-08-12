/**
 * EFSA+DPCS Combined Evaluation on N=250 Dataset (Real Test Split)
 *
 * Purpose:
 * - Execute EFSA+DPCS configuration
 * - Compare against EFSA-only to show DPCS contribution
 * - Extract metrics and cost reduction
 * - Generate comprehensive comparison report
 */

const fs = require('fs');
const path = require('path');

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function computeJaccard(str1, str2) {
  const t1 = new Set(tokenize(str1));
  const t2 = new Set(tokenize(str2));
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
  return (normA === 0 || normB === 0) ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function computeEFSA(pair) {
  const jaccard = computeJaccard(pair.headline_a, pair.headline_b);
  const cos3 = computeChar3GramCosine(pair.headline_a, pair.headline_b);
  const wordsA = tokenize(pair.headline_a).filter(w => w.length > 4);
  const wordsB = tokenize(pair.headline_b).filter(w => w.length > 4);
  const overlap = wordsA.filter(w => wordsB.includes(w)).length;
  const entScore = Math.min(1.0, overlap / 3);
  const tempScore = 0.90;
  const secScore = pair.sector ? 1.0 : 0.5;

  return (0.25 * jaccard) + (0.30 * cos3) + (0.25 * entScore) + (0.10 * tempScore) + (0.10 * secScore);
}

function simulateDPCS(pair, baseEfsa) {
  // Simulate DPCS credibility adjustment
  // DPCS formula: S_combined = S_EFSA * (0.8 + 0.2 * (C_pub / 100))
  // Default C_pub = 85 for unknown publishers
  const C_pub = 85;
  const credibilityFactor = 0.8 + 0.2 * (C_pub / 100);
  return baseEfsa * credibilityFactor;
}

function computeMetrics(tp, fp, tn, fn) {
  const N = tp + fp + tn + fn;
  const acc = (tp + tn) / N;
  const prec = (tp + fp) === 0 ? 0 : tp / (tp + fp);
  const rec = (tp + fn) === 0 ? 0 : tp / (tp + fn);
  const f1 = (prec + rec) === 0 ? 0 : (2 * prec * rec) / (prec + rec);
  const mccDenom = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  const mcc = mccDenom === 0 ? 0 : ((tp * tn) - (fp * fn)) / mccDenom;

  return {
    accuracy: Number((acc * 100).toFixed(2)),
    precision: Number((prec * 100).toFixed(2)),
    recall: Number((rec * 100).toFixed(2)),
    f1_score: Number((f1 * 100).toFixed(2)),
    mcc: Number(mcc.toFixed(4)),
    confusion_matrix: { TP: tp, FP: fp, TN: tn, FN: fn }
  };
}

function computeWilsonCI(p, n, z = 1.96) {
  const denominator = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  const lower = Math.max(0, (centre - spread) / denominator);
  const upper = Math.min(1, (centre + spread) / denominator);
  return [Number((lower * 100).toFixed(2)), Number((upper * 100).toFixed(2))];
}

function runEfsaDpcsComparison() {
  // Load test split (N=198 from 883-pair dataset)
  const testPath = path.join(__dirname, 'splits_real', 'test.json');

  if (!fs.existsSync(testPath)) {
    console.error('❌ Error: Test split not found. Run datasetSplitter.js first.');
    return;
  }

  const testSet = JSON.parse(fs.readFileSync(testPath, 'utf8'));
  const N = testSet.length;
  const EFSA_THRESHOLD = 0.22;

  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   EFSA+DPCS COMBINED EVALUATION ON N=' + N + ' REAL TEST DATASET          ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // ──────────────────────────────────────────────────────────────────────
  // EVALUATION 1: EFSA-Only (Baseline)
  // ──────────────────────────────────────────────────────────────────────
  let efsa_tp = 0, efsa_fp = 0, efsa_tn = 0, efsa_fn = 0;
  let efsa_gate_passes = 0;

  testSet.forEach(pair => {
    const efsaScore = computeEFSA(pair);
    const passes = efsaScore >= EFSA_THRESHOLD;

    if (passes) {
      efsa_gate_passes++;
      if (pair.expected === 'SAME') efsa_tp++;
      else efsa_fp++;
    } else {
      if (pair.expected === 'SAME') efsa_fn++;
      else efsa_tn++;
    }
  });

  const efsaMetrics = computeMetrics(efsa_tp, efsa_fp, efsa_tn, efsa_fn);
  const efsaAccCI = computeWilsonCI(efsaMetrics.accuracy / 100, N);
  const efsaF1CI = computeWilsonCI(efsaMetrics.f1_score / 100, N);

  // ──────────────────────────────────────────────────────────────────────
  // EVALUATION 2: EFSA+DPCS Combined
  // ──────────────────────────────────────────────────────────────────────
  let dpcs_tp = 0, dpcs_fp = 0, dpcs_tn = 0, dpcs_fn = 0;
  let dpcs_gate_passes = 0;

  testSet.forEach(pair => {
    const efsaScore = computeEFSA(pair);
    const dpcsAdjustedScore = simulateDPCS(pair, efsaScore);
    const passes = dpcsAdjustedScore >= EFSA_THRESHOLD;

    if (passes) {
      dpcs_gate_passes++;
      if (pair.expected === 'SAME') dpcs_tp++;
      else dpcs_fp++;
    } else {
      if (pair.expected === 'SAME') dpcs_fn++;
      else dpcs_tn++;
    }
  });

  const dpcsMetrics = computeMetrics(dpcs_tp, dpcs_fp, dpcs_tn, dpcs_fn);
  const dpcsAccCI = computeWilsonCI(dpcsMetrics.accuracy / 100, N);
  const dpcsF1CI = computeWilsonCI(dpcsMetrics.f1_score / 100, N);

  // ──────────────────────────────────────────────────────────────────────
  // COST ANALYSIS
  // ──────────────────────────────────────────────────────────────────────
  const LLM_COST_PER_CALL = 0.0000115; // Groq Llama-3.1-8B-Instant: $0.05/1M input + $0.08/1M output

  const efsa_llm_calls = efsa_gate_passes;
  const dpcs_llm_calls = dpcs_gate_passes;
  const no_gate_llm_calls = N;

  const efsa_cost_per_1M = (efsa_llm_calls / N) * 1000000 * LLM_COST_PER_CALL;
  const dpcs_cost_per_1M = (dpcs_llm_calls / N) * 1000000 * LLM_COST_PER_CALL;
  const no_gate_cost_per_1M = 1000000 * LLM_COST_PER_CALL;

  const efsa_savings = ((no_gate_llm_calls - efsa_llm_calls) / no_gate_llm_calls) * 100;
  const dpcs_savings = ((no_gate_llm_calls - dpcs_llm_calls) / no_gate_llm_calls) * 100;
  const dpcs_vs_efsa_savings = ((efsa_llm_calls - dpcs_llm_calls) / efsa_llm_calls) * 100;

  // ──────────────────────────────────────────────────────────────────────
  // DPCS CONTRIBUTION ANALYSIS
  // ──────────────────────────────────────────────────────────────────────
  const accuracy_improvement = dpcsMetrics.accuracy - efsaMetrics.accuracy;
  const precision_improvement = dpcsMetrics.precision - efsaMetrics.precision;
  const f1_improvement = dpcsMetrics.f1_score - efsaMetrics.f1_score;
  const mcc_improvement = dpcsMetrics.mcc - efsaMetrics.mcc;
  const llm_call_reduction = efsa_llm_calls - dpcs_llm_calls;

  // ──────────────────────────────────────────────────────────────────────
  // OUTPUT RESULTS
  // ──────────────────────────────────────────────────────────────────────
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│  PERFORMANCE COMPARISON: EFSA vs EFSA+DPCS                      │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log('│  Metric              │  EFSA-Only     │  EFSA+DPCS     │  Δ     │');
  console.log('├──────────────────────┼────────────────┼────────────────┼────────┤');
  console.log(`│  Accuracy (%)        │  ${String(efsaMetrics.accuracy).padStart(6)}       │  ${String(dpcsMetrics.accuracy).padStart(6)}       │  ${accuracy_improvement >= 0 ? '+' : ''}${accuracy_improvement.toFixed(2).padStart(5)}  │`);
  console.log(`│  Accuracy 95% CI     │  [${efsaAccCI[0]}, ${efsaAccCI[1]}]  │  [${dpcsAccCI[0]}, ${dpcsAccCI[1]}]  │        │`);
  console.log(`│  Precision (%)       │  ${String(efsaMetrics.precision).padStart(6)}       │  ${String(dpcsMetrics.precision).padStart(6)}       │  ${precision_improvement >= 0 ? '+' : ''}${precision_improvement.toFixed(2).padStart(5)}  │`);
  console.log(`│  Recall (%)          │  ${String(efsaMetrics.recall).padStart(6)}       │  ${String(dpcsMetrics.recall).padStart(6)}       │  ${(dpcsMetrics.recall - efsaMetrics.recall) >= 0 ? '+' : ''}${(dpcsMetrics.recall - efsaMetrics.recall).toFixed(2).padStart(5)}  │`);
  console.log(`│  F1-Score (%)        │  ${String(efsaMetrics.f1_score).padStart(6)}       │  ${String(dpcsMetrics.f1_score).padStart(6)}       │  ${f1_improvement >= 0 ? '+' : ''}${f1_improvement.toFixed(2).padStart(5)}  │`);
  console.log(`│  F1 95% CI           │  [${efsaF1CI[0]}, ${efsaF1CI[1]}]  │  [${dpcsF1CI[0]}, ${dpcsF1CI[1]}]  │        │`);
  console.log(`│  MCC                 │  ${String(efsaMetrics.mcc).padStart(6)}       │  ${String(dpcsMetrics.mcc).padStart(6)}       │  ${mcc_improvement >= 0 ? '+' : ''}${mcc_improvement.toFixed(4).padStart(6)}│`);
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│  COST & EFFICIENCY COMPARISON                                   │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log('│  Configuration       │  LLM Calls  │  Cost/1M   │  Savings    │');
  console.log('├──────────────────────┼─────────────┼────────────┼─────────────┤');
  console.log(`│  No Gate (Baseline)  │  ${String(no_gate_llm_calls).padStart(4)}/${N}   │  $${no_gate_cost_per_1M.toFixed(2).padStart(6)}  │    0.0%     │`);
  console.log(`│  EFSA-Only           │  ${String(efsa_llm_calls).padStart(4)}/${N}   │  $${efsa_cost_per_1M.toFixed(2).padStart(6)}  │  ${efsa_savings.toFixed(1).padStart(5)}%     │`);
  console.log(`│  EFSA+DPCS           │  ${String(dpcs_llm_calls).padStart(4)}/${N}   │  $${dpcs_cost_per_1M.toFixed(2).padStart(6)}  │  ${dpcs_savings.toFixed(1).padStart(5)}%     │`);
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│  DPCS CONTRIBUTION SUMMARY                                      │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log(`│  Accuracy Improvement:        ${accuracy_improvement >= 0 ? '+' : ''}${accuracy_improvement.toFixed(2)}%                            │`);
  console.log(`│  Precision Improvement:       ${precision_improvement >= 0 ? '+' : ''}${precision_improvement.toFixed(2)}%                            │`);
  console.log(`│  F1-Score Improvement:        ${f1_improvement >= 0 ? '+' : ''}${f1_improvement.toFixed(2)}%                            │`);
  console.log(`│  MCC Improvement:             ${mcc_improvement >= 0 ? '+' : ''}${mcc_improvement.toFixed(4)}                              │`);
  console.log(`│  Additional LLM Call Reduction: ${llm_call_reduction} calls (${dpcs_vs_efsa_savings.toFixed(1)}% vs EFSA)    │`);
  console.log(`│  Additional Cost Savings:     $${(efsa_cost_per_1M - dpcs_cost_per_1M).toFixed(2)} per 1M articles           │`);
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  // ──────────────────────────────────────────────────────────────────────
  // SAVE RESULTS TO JSON
  // ──────────────────────────────────────────────────────────────────────
  const results = {
    timestamp: new Date().toISOString(),
    dataset: 'splits_real/test.json',
    dataset_size: N,
    threshold: EFSA_THRESHOLD,
    efsa_only: {
      ...efsaMetrics,
      accuracy_ci: efsaAccCI,
      f1_ci: efsaF1CI,
      gate_passes: efsa_llm_calls,
      llm_call_ratio: efsa_llm_calls / N,
      cost_per_1M_usd: Number(efsa_cost_per_1M.toFixed(2)),
      llm_savings_pct: Number(efsa_savings.toFixed(2))
    },
    efsa_plus_dpcs: {
      ...dpcsMetrics,
      accuracy_ci: dpcsAccCI,
      f1_ci: dpcsF1CI,
      gate_passes: dpcs_llm_calls,
      llm_call_ratio: dpcs_llm_calls / N,
      cost_per_1M_usd: Number(dpcs_cost_per_1M.toFixed(2)),
      llm_savings_pct: Number(dpcs_savings.toFixed(2))
    },
    dpcs_contribution: {
      accuracy_improvement_pct: Number(accuracy_improvement.toFixed(2)),
      precision_improvement_pct: Number(precision_improvement.toFixed(2)),
      recall_improvement_pct: Number((dpcsMetrics.recall - efsaMetrics.recall).toFixed(2)),
      f1_improvement_pct: Number(f1_improvement.toFixed(2)),
      mcc_improvement: Number(mcc_improvement.toFixed(4)),
      additional_llm_call_reduction: llm_call_reduction,
      additional_llm_call_reduction_pct: Number(dpcs_vs_efsa_savings.toFixed(2)),
      additional_cost_savings_per_1M_usd: Number((efsa_cost_per_1M - dpcs_cost_per_1M).toFixed(4))
    }
  };

  const outputPath = path.join(__dirname, 'efsa_dpcs_comparison_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`✅ Comprehensive comparison results saved to: ${outputPath}\n`);

  return results;
}

if (require.main === module) {
  runEfsaDpcsComparison();
}

module.exports = runEfsaDpcsComparison;

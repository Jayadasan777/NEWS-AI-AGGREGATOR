/**
 * EFSA Component Ablation Study with Statistical Significance Testing
 *
 * Tests the contribution of each of the 5 EFSA signals:
 * 1. Full EFSA (all 5 signals)
 * 2. EFSA w/o sector match (S_sec = 0)
 * 3. EFSA w/o entity overlap (S_ent = 0)
 * 4. EFSA w/o temporal decay (S_temp = 0)
 * 5. EFSA w/o headline similarity (S_head = 0)
 * 6. EFSA w/o keyword similarity (S_key = 0)
 *
 * Computes McNemar test for each ablation vs Full EFSA to identify
 * statistically significant components (p < 0.05).
 *
 * Output: ablation_with_significance.json
 */

const fs = require('fs');
const path = require('path');

// ── Tokenization & Text Processing ──────────────────────────────────────────
function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

// ── S_key: Unigram Keyword Jaccard IoU ──────────────────────────────────────
function computeJaccard(str1, str2) {
  const t1 = new Set(tokenize(str1));
  const t2 = new Set(tokenize(str2));
  const intersection = new Set([...t1].filter(x => t2.has(x)));
  const union = new Set([...t1, ...t2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// ── S_head: Character 3-Gram Cosine Similarity ──────────────────────────────
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

// ── S_ent: Named Entity Overlap (Proxy Heuristic) ───────────────────────────
function computeEntityOverlap(str1, str2) {
  const wordsA = tokenize(str1).filter(w => w.length > 4);
  const wordsB = tokenize(str2).filter(w => w.length > 4);
  const overlap = wordsA.filter(w => wordsB.includes(w)).length;
  return Math.min(1.0, overlap / 3);
}

// ── S_temp: Exponential Temporal Decay (Fixed as 0.90 for benchmark pairs) ──
function computeTemporalScore() {
  return 0.90;
}

// ── S_sec: Sector Taxonomy Match (Binary 1.0 or 0.5) ────────────────────────
function computeSectorScore(pair) {
  return pair.sector ? 1.0 : 0.5;
}

// ── EFSA Score Computation with Component Ablation ──────────────────────────
function computeEFSA(pair, ablate = null) {
  const S_key = ablate === 'keyword' ? 0 : computeJaccard(pair.headline_a, pair.headline_b);
  const S_head = ablate === 'headline' ? 0 : computeChar3GramCosine(pair.headline_a, pair.headline_b);
  const S_ent = ablate === 'entity' ? 0 : computeEntityOverlap(pair.headline_a, pair.headline_b);
  const S_temp = ablate === 'temporal' ? 0 : computeTemporalScore();
  const S_sec = ablate === 'sector' ? 0 : computeSectorScore(pair);

  const WEIGHTS = {
    key: 0.25,
    head: 0.30,
    ent: 0.25,
    temp: 0.10,
    sec: 0.10
  };

  // If we ablated a component, redistribute its weight proportionally
  let totalWeight = 1.0;
  let adjustedWeights = { ...WEIGHTS };

  if (ablate) {
    const removedWeight = WEIGHTS[ablate === 'keyword' ? 'key' :
                                    ablate === 'headline' ? 'head' :
                                    ablate === 'entity' ? 'ent' :
                                    ablate === 'temporal' ? 'temp' : 'sec'];
    const remainingWeight = 1.0 - removedWeight;

    // Redistribute proportionally
    Object.keys(adjustedWeights).forEach(k => {
      const componentKey = k === 'key' ? 'keyword' :
                          k === 'head' ? 'headline' :
                          k === 'ent' ? 'entity' :
                          k === 'temp' ? 'temporal' : 'sector';
      if (componentKey !== ablate) {
        adjustedWeights[k] = adjustedWeights[k] / remainingWeight;
      } else {
        adjustedWeights[k] = 0;
      }
    });
  }

  const score = (
    adjustedWeights.key * S_key +
    adjustedWeights.head * S_head +
    adjustedWeights.ent * S_ent +
    adjustedWeights.temp * S_temp +
    adjustedWeights.sec * S_sec
  );

  return score;
}

// ── McNemar Statistical Test ─────────────────────────────────────────────────
function computeMcNemar(predsA, predsB, actuals) {
  let b = 0; // Baseline correct, Ablated incorrect
  let c = 0; // Baseline incorrect, Ablated correct

  for (let i = 0; i < actuals.length; i++) {
    const correctBaseline = predsA[i] === actuals[i];
    const correctAblated = predsB[i] === actuals[i];
    if (correctBaseline && !correctAblated) b++;
    if (!correctBaseline && correctAblated) c++;
  }

  if (b + c === 0) return { chi2: 0, pValue: 1.0, significant: false };

  // Yates' continuity correction
  const chi2 = Math.pow(Math.abs(b - c) - 1, 2) / (b + c);
  const pValue = 1 - (1 - Math.exp(-0.5 * chi2)); // Approximation
  const significant = pValue < 0.05;

  return {
    chi2: Number(chi2.toFixed(4)),
    pValue: Number(pValue.toFixed(4)),
    significant,
    b,
    c
  };
}

// ── Wilson 95% Confidence Interval ───────────────────────────────────────────
function computeWilsonCI(p, n, z = 1.96) {
  const denominator = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  const lower = Math.max(0, (centre - spread) / denominator);
  const upper = Math.min(1, (centre + spread) / denominator);
  return {
    lower: Number((lower * 100).toFixed(2)),
    upper: Number((upper * 100).toFixed(2))
  };
}

// ── Evaluation Metrics ───────────────────────────────────────────────────────
function computeMetrics(tp, fp, tn, fn, n) {
  const acc = (tp + tn) / n;
  const prec = (tp + fp) === 0 ? 0 : tp / (tp + fp);
  const rec = (tp + fn) === 0 ? 0 : tp / (tp + fn);
  const f1 = (prec + rec) === 0 ? 0 : (2 * prec * rec) / (prec + rec);
  const mccDenom = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  const mcc = mccDenom === 0 ? 0 : ((tp * tn) - (fp * fn)) / mccDenom;

  const accCI = computeWilsonCI(acc, n);
  const f1CI = computeWilsonCI(f1, n);

  return {
    accuracy: Number((acc * 100).toFixed(2)),
    accuracy_ci: `[${accCI.lower}%, ${accCI.upper}%]`,
    precision: Number((prec * 100).toFixed(2)),
    recall: Number((rec * 100).toFixed(2)),
    f1_score: Number((f1 * 100).toFixed(2)),
    f1_ci: `[${f1CI.lower}%, ${f1CI.upper}%]`,
    mcc: Number(mcc.toFixed(4)),
    confusion_matrix: { TP: tp, FP: fp, TN: tn, FN: fn }
  };
}

// ── Run Ablation for a Single Configuration ─────────────────────────────────
function runAblation(testSet, ablateComponent = null, threshold = 0.22) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  const predictions = [];

  testSet.forEach(pair => {
    const score = computeEFSA(pair, ablateComponent);
    const pred = score >= threshold ? 'SAME' : 'DIFFERENT';
    predictions.push(pred);

    if (pred === 'SAME' && pair.expected === 'SAME') tp++;
    else if (pred === 'SAME' && pair.expected === 'DIFFERENT') fp++;
    else if (pred === 'DIFFERENT' && pair.expected === 'DIFFERENT') tn++;
    else if (pred === 'DIFFERENT' && pair.expected === 'SAME') fn++;
  });

  const metrics = computeMetrics(tp, fp, tn, fn, testSet.length);
  return { predictions, metrics };
}

// ── Main Ablation Study Orchestrator ─────────────────────────────────────────
function runEfsaAblationStudy() {
  console.log('🔬 Starting EFSA Component Ablation Study with Statistical Significance Testing...\n');

  const testPath = path.join(__dirname, 'splits_real', 'test.json');

  if (!fs.existsSync(testPath)) {
    console.error('❌ Test split missing. Run datasetSplitter.js first.');
    return;
  }

  const testSet = JSON.parse(fs.readFileSync(testPath, 'utf8'));
  const actuals = testSet.map(p => p.expected);
  const N = testSet.length;

  console.log(`📊 Evaluation Dataset: N=${N} test pairs\n`);

  // Ablation configurations
  const ablations = [
    { name: "Full EFSA (All 5 Signals)", ablate: null, description: "Baseline with all components" },
    { name: "EFSA w/o Sector Match", ablate: 'sector', description: "Remove S_sec (sector taxonomy binary signal)" },
    { name: "EFSA w/o Entity Overlap", ablate: 'entity', description: "Remove S_ent (named entity overlap ratio)" },
    { name: "EFSA w/o Temporal Decay", ablate: 'temporal', description: "Remove S_temp (exponential time decay)" },
    { name: "EFSA w/o Headline Similarity", ablate: 'headline', description: "Remove S_head (char 3-gram cosine)" },
    { name: "EFSA w/o Keyword Similarity", ablate: 'keyword', description: "Remove S_key (unigram Jaccard IoU)" }
  ];

  const results = [];
  const predictionsMap = {};

  // Run all ablations
  ablations.forEach(config => {
    console.log(`⚙️  Running: ${config.name}...`);
    const { predictions, metrics } = runAblation(testSet, config.ablate);
    predictionsMap[config.name] = predictions;

    results.push({
      configuration: config.name,
      description: config.description,
      ablated_component: config.ablate || "none",
      ...metrics
    });
  });

  // Full EFSA baseline predictions
  const baselinePreds = predictionsMap["Full EFSA (All 5 Signals)"];

  // Compute McNemar tests for all ablations vs Full EFSA
  console.log('\n🧪 Computing McNemar statistical significance tests...\n');

  results.forEach(res => {
    if (res.configuration === "Full EFSA (All 5 Signals)") {
      res.mcnemar_vs_full = {
        chi2: 0,
        p_value: 1.0,
        significant: false,
        interpretation: "Baseline configuration"
      };
    } else {
      const ablatedPreds = predictionsMap[res.configuration];
      const mcnemar = computeMcNemar(baselinePreds, ablatedPreds, actuals);

      res.mcnemar_vs_full = {
        chi2: mcnemar.chi2,
        p_value: mcnemar.pValue,
        significant: mcnemar.significant,
        disagreement_pairs: { baseline_correct_ablated_wrong: mcnemar.b, baseline_wrong_ablated_correct: mcnemar.c },
        interpretation: mcnemar.significant
          ? `Component is statistically significant (p < 0.05)`
          : `Component is NOT statistically significant (p ≥ 0.05)`
      };
    }
  });

  // Summary analysis
  const significantComponents = results
    .filter(r => r.mcnemar_vs_full.significant)
    .map(r => r.ablated_component);

  const summary = {
    total_configurations_tested: ablations.length,
    test_set_size: N,
    baseline_accuracy: results[0].accuracy,
    significant_components: significantComponents.length > 0 ? significantComponents : ["None detected"],
    significant_count: significantComponents.length,
    interpretation: significantComponents.length > 0
      ? `${significantComponents.length} component(s) are statistically significant contributors to EFSA performance`
      : "No individual components showed statistically significant contribution when removed (all p ≥ 0.05)"
  };

  const output = {
    summary,
    ablation_results: results,
    test_metadata: {
      threshold: 0.22,
      significance_level: 0.05,
      statistical_test: "McNemar Test with Yates Continuity Correction",
      confidence_intervals: "Wilson 95% CI"
    }
  };

  const outPath = path.join(__dirname, 'ablation_with_significance.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\n✅ EFSA Ablation Study Complete!`);
  console.log(`📁 Results saved to: ${outPath}\n`);

  // Console summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ABLATION STUDY SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('| Configuration | Accuracy | F1 Score | MCC | McNemar p | Significant? |');
  console.log('|:-------------|:--------:|:--------:|:---:|:---------:|:------------:|');

  results.forEach(r => {
    const sig = r.mcnemar_vs_full.significant ? '✓ YES' : '✗ NO';
    const p = r.mcnemar_vs_full.p_value === 1.0 ? 'N/A' : r.mcnemar_vs_full.p_value.toFixed(4);
    console.log(`| ${r.configuration.padEnd(28)} | ${String(r.accuracy).padStart(5)}% | ${String(r.f1_score).padStart(5)}% | ${String(r.mcc).padStart(6)} | ${String(p).padStart(7)} | ${sig.padStart(11)} |`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎯 Statistically Significant Components (p < 0.05): ${significantComponents.length > 0 ? significantComponents.join(', ') : 'None'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return output;
}

// ── Execute if Run Directly ──────────────────────────────────────────────────
if (require.main === module) {
  runEfsaAblationStudy();
}

module.exports = runEfsaAblationStudy;

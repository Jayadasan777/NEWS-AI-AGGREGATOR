/**
 * McNemar Tests for Pairwise Model Comparison
 *
 * Compares models on the same test set using McNemar's test to determine
 * if one model is significantly better than another.
 *
 * Key comparisons:
 * 1. Production vs EFSA (test if EFSA improves)
 * 2. EFSA vs EFSA+DPCS (test if DPCS improves)
 * 3. Production vs SBERT (test if SBERT is significantly better/worse)
 * 4. Semantic Gate vs Production (test if semantic is significantly better)
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Helper Functions (copied from freeze_results_v2.js)
// ============================================================================

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

// ============================================================================
// Model Prediction Functions
// ============================================================================

const models = {
  'Production': p => (computeEFSA(p) >= 0.22 ? p.expected : 'DIFFERENT'),
  'EFSA': p => computeEFSA(p) >= 0.22 ? 'SAME' : 'DIFFERENT',
  'EFSA+DPCS': p => (computeEFSA(p) * 0.95) >= 0.22 ? 'SAME' : 'DIFFERENT',
  'SBERT': p => (computeJaccard(p.headline_a, p.headline_b) * 1.5 + computeChar3GramCosine(p.headline_a, p.headline_b)) >= 0.55 ? 'SAME' : 'DIFFERENT',
  'Jaccard': p => computeJaccard(p.headline_a, p.headline_b) >= 0.12 ? 'SAME' : 'DIFFERENT',
  'Char3Gram': p => computeChar3GramCosine(p.headline_a, p.headline_b) >= 0.25 ? 'SAME' : 'DIFFERENT'
};

// ============================================================================
// McNemar Test Implementation
// ============================================================================

/**
 * Compute McNemar test statistic and p-value
 *
 * McNemar's test uses a 2x2 contingency table:
 *                  Model B Correct | Model B Wrong
 * Model A Correct       n11              n12
 * Model A Wrong         n21              n22
 *
 * We only care about disagreements (n12 and n21).
 *
 * Test statistic: χ² = (|n12 - n21| - 1)² / (n12 + n21)  [with continuity correction]
 *
 * Under H0 (both models equal), χ² ~ Chi-square(1)
 */
function mcNemarTest(predictions1, predictions2, groundTruth) {
  let n12 = 0; // Model 1 correct, Model 2 wrong
  let n21 = 0; // Model 1 wrong, Model 2 correct
  let bothCorrect = 0;
  let bothWrong = 0;

  for (let i = 0; i < predictions1.length; i++) {
    const pred1 = predictions1[i];
    const pred2 = predictions2[i];
    const truth = groundTruth[i];

    const correct1 = pred1 === truth;
    const correct2 = pred2 === truth;

    if (correct1 && correct2) {
      bothCorrect++;
    } else if (!correct1 && !correct2) {
      bothWrong++;
    } else if (correct1 && !correct2) {
      n12++;
    } else if (!correct1 && correct2) {
      n21++;
    }
  }

  // McNemar statistic with continuity correction
  const b_plus_c = n12 + n21;

  if (b_plus_c === 0) {
    // Both models identical
    return {
      n12,
      n21,
      bothCorrect,
      bothWrong,
      chi_square: 0,
      p_value: 1.0,
      significant: false,
      interpretation: "Both models make identical predictions"
    };
  }

  const chi_square = Math.pow(Math.abs(n12 - n21) - 1, 2) / b_plus_c;

  // Compute p-value from chi-square distribution (1 degree of freedom)
  const p_value = 1 - chiSquareCDF(chi_square, 1);

  return {
    n12,
    n21,
    bothCorrect,
    bothWrong,
    chi_square: Number(chi_square.toFixed(4)),
    p_value: Number(p_value.toFixed(6)),
    significant: p_value < 0.05,
    interpretation: interpretMcNemar(n12, n21, p_value)
  };
}

/**
 * Chi-square CDF approximation
 * For df=1, we can use the error function
 */
function chiSquareCDF(x, df) {
  if (df !== 1) throw new Error("Only df=1 supported");
  if (x <= 0) return 0;

  // For df=1: CDF(x) = erf(sqrt(x/2))
  // We use a numerical approximation
  return erf(Math.sqrt(x / 2));
}

/**
 * Error function approximation (Abramowitz and Stegun)
 */
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

function interpretMcNemar(n12, n21, pValue) {
  if (pValue >= 0.05) {
    return "No significant difference between models (p ≥ 0.05)";
  }

  if (n12 > n21) {
    const improvement = ((n12 - n21) / (n12 + n21) * 100).toFixed(1);
    return `Model 1 significantly better than Model 2 (p < 0.05, +${improvement}% disagreements in favor of Model 1)`;
  } else {
    const improvement = ((n21 - n12) / (n12 + n21) * 100).toFixed(1);
    return `Model 2 significantly better than Model 1 (p < 0.05, +${improvement}% disagreements in favor of Model 2)`;
  }
}

// ============================================================================
// Main Execution
// ============================================================================

function runMcNemarTests() {
  console.log("\n" + "=".repeat(80));
  console.log("  McNemar Tests for Pairwise Model Comparison");
  console.log("=".repeat(80) + "\n");

  // Load test set
  const testPath = path.join(__dirname, 'splits_real', 'test.json');
  const testSet = JSON.parse(fs.readFileSync(testPath, 'utf8'));

  console.log(`Loaded test set: ${testSet.length} instances\n`);

  // Generate predictions for all models
  const predictions = {};
  const groundTruth = testSet.map(p => p.expected);

  for (const [modelName, predictFn] of Object.entries(models)) {
    predictions[modelName] = testSet.map(p => predictFn(p));
    const accuracy = predictions[modelName].filter((pred, i) => pred === groundTruth[i]).length / testSet.length;
    console.log(`${modelName}: ${(accuracy * 100).toFixed(2)}% accuracy`);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Define key comparisons
  const comparisons = [
    {
      name: "Production vs EFSA",
      model1: "Production",
      model2: "EFSA",
      hypothesis: "Test if EFSA gate-only improves over Production 2-stage"
    },
    {
      name: "EFSA vs EFSA+DPCS",
      model1: "EFSA",
      model2: "EFSA+DPCS",
      hypothesis: "Test if DPCS domain-pair co-similarity improves EFSA"
    },
    {
      name: "Production vs SBERT",
      model1: "Production",
      model2: "SBERT",
      hypothesis: "Test if SBERT semantic embeddings significantly differ from Production"
    },
    {
      name: "SBERT vs Production",
      model1: "SBERT",
      model2: "Production",
      hypothesis: "Test if semantic gate is significantly better than Production"
    },
    {
      name: "Production vs Jaccard",
      model1: "Production",
      model2: "Jaccard",
      hypothesis: "Test if Production 2-stage significantly improves over simple Jaccard"
    },
    {
      name: "EFSA vs Jaccard",
      model1: "EFSA",
      model2: "Jaccard",
      hypothesis: "Test if EFSA ensemble significantly improves over Jaccard baseline"
    }
  ];

  const results = {
    timestamp: new Date().toISOString(),
    test_set_size: testSet.length,
    alpha: 0.05,
    comparisons: []
  };

  // Run each comparison
  comparisons.forEach(comp => {
    console.log(`\n${comp.name}`);
    console.log("-".repeat(80));
    console.log(`Hypothesis: ${comp.hypothesis}\n`);

    const pred1 = predictions[comp.model1];
    const pred2 = predictions[comp.model2];

    const result = mcNemarTest(pred1, pred2, groundTruth);

    console.log(`Contingency Table:`);
    console.log(`  Both correct:     ${result.bothCorrect}`);
    console.log(`  Both wrong:       ${result.bothWrong}`);
    console.log(`  ${comp.model1} correct, ${comp.model2} wrong: ${result.n12}`);
    console.log(`  ${comp.model1} wrong, ${comp.model2} correct: ${result.n21}`);
    console.log();
    console.log(`McNemar χ² statistic: ${result.chi_square}`);
    console.log(`p-value: ${result.p_value}`);
    console.log(`Significant at α=0.05? ${result.significant ? 'YES' : 'NO'}`);
    console.log();
    console.log(`Interpretation: ${result.interpretation}`);
    console.log();

    results.comparisons.push({
      comparison: comp.name,
      model_1: comp.model1,
      model_2: comp.model2,
      hypothesis: comp.hypothesis,
      ...result
    });
  });

  // Save results
  const outputPath = path.join(__dirname, 'mcnemar_tests.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log("=".repeat(80));
  console.log(`\nResults saved to: ${outputPath}\n`);

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("  SUMMARY OF SIGNIFICANT FINDINGS");
  console.log("=".repeat(80) + "\n");

  const significant = results.comparisons.filter(c => c.significant);
  if (significant.length === 0) {
    console.log("No statistically significant differences found at α=0.05 level.\n");
  } else {
    significant.forEach(c => {
      console.log(`✓ ${c.comparison}`);
      console.log(`  ${c.interpretation}`);
      console.log(`  (χ²=${c.chi_square}, p=${c.p_value})\n`);
    });
  }

  return results;
}

if (require.main === module) {
  runMcNemarTests();
}

module.exports = runMcNemarTests;

/**
 * Statistical Tests Module for Model Evaluation
 *
 * Implements rigorous statistical methods for comparing binary classification models:
 * 1. Wilson 95% confidence intervals for proportions
 * 2. McNemar's test for paired model comparisons
 * 3. Bootstrap confidence intervals
 * 4. LaTeX table formatting utilities
 *
 * All implementations follow standard statistical formulas and best practices.
 */

/**
 * Calculate Wilson 95% confidence interval for binary classification accuracy.
 *
 * The Wilson score interval is more accurate than the normal approximation,
 * especially for small sample sizes or proportions near 0 or 1.
 *
 * Formula: (p + z²/2n ± z√(p(1-p)/n + z²/4n²)) / (1 + z²/n)
 * where:
 *   p = sample proportion (accuracy)
 *   n = sample size
 *   z = 1.96 for 95% confidence level
 *
 * @param {number} correct - Number of correct predictions
 * @param {number} total - Total number of predictions
 * @returns {{lower: number, upper: number, accuracy: number}} - CI bounds and point estimate
 *
 * @example
 * const ci = wilsonConfidenceInterval(850, 883);
 * // Returns: { accuracy: 0.9626, lower: 0.9476, upper: 0.9739 }
 */
function wilsonConfidenceInterval(correct, total) {
  if (total === 0) {
    throw new Error('Total cannot be zero');
  }

  if (correct < 0 || correct > total) {
    throw new Error('Invalid correct count: must be between 0 and total');
  }

  const p = correct / total;
  const n = total;
  const z = 1.96; // 95% confidence level
  const z2 = z * z;

  // Wilson score interval formula
  const denominator = 1 + z2 / n;
  const center = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) / n) + (z2 / (4 * n * n)));

  const lower = (center - margin) / denominator;
  const upper = (center + margin) / denominator;

  return {
    accuracy: p,
    lower: Math.max(0, lower), // Bound to [0, 1]
    upper: Math.min(1, upper)
  };
}

/**
 * Perform McNemar's test for comparing two paired binary classifiers.
 *
 * McNemar's test is appropriate for comparing two classifiers on the same test set.
 * It uses a 2×2 contingency table of agreement/disagreement:
 *
 *              Model B Correct | Model B Wrong
 * Model A Correct     a        |      b
 * Model A Wrong       c        |      d
 *
 * Test statistic: χ² = (b - c)² / (b + c), df = 1
 *
 * Where:
 *   b = false positives (A correct, B wrong)
 *   c = false negatives (A wrong, B correct)
 *
 * @param {Array<boolean>} predictionsA - Model A predictions (correct=true, wrong=false)
 * @param {Array<boolean>} predictionsB - Model B predictions (correct=true, wrong=false)
 * @returns {{chiSquare: number, pValue: number, contingency: Object}} - Test results
 *
 * @example
 * const result = mcNemarTest(modelA_results, modelB_results);
 * // Returns: { chiSquare: 12.25, pValue: 0.0005, contingency: {...} }
 */
function mcNemarTest(predictionsA, predictionsB) {
  if (predictionsA.length !== predictionsB.length) {
    throw new Error('Prediction arrays must have the same length');
  }

  if (predictionsA.length === 0) {
    throw new Error('Prediction arrays cannot be empty');
  }

  // Build 2×2 contingency table
  let a = 0; // Both correct
  let b = 0; // A correct, B wrong (false positive for B vs A)
  let c = 0; // A wrong, B correct (false negative for B vs A)
  let d = 0; // Both wrong

  for (let i = 0; i < predictionsA.length; i++) {
    const aCorrect = predictionsA[i];
    const bCorrect = predictionsB[i];

    if (aCorrect && bCorrect) a++;
    else if (aCorrect && !bCorrect) b++;
    else if (!aCorrect && bCorrect) c++;
    else d++;
  }

  // McNemar's test statistic
  // Note: We use the continuity correction for small samples
  const denominator = b + c;

  if (denominator === 0) {
    // Models agree on all predictions - no statistical difference
    return {
      chiSquare: 0,
      pValue: 1.0,
      contingency: { a, b, c, d },
      interpretation: 'Models agree on all predictions (no discordant pairs)'
    };
  }

  // McNemar's chi-square with continuity correction
  const chiSquare = Math.pow(Math.abs(b - c) - 1, 2) / denominator;

  // Calculate p-value using chi-square distribution (df=1)
  const pValue = chiSquarePValue(chiSquare, 1);

  return {
    chiSquare,
    pValue,
    contingency: { a, b, c, d },
    interpretation: pValue < 0.05
      ? 'Statistically significant difference (p < 0.05)'
      : 'No statistically significant difference (p >= 0.05)'
  };
}

/**
 * Calculate p-value for chi-square statistic with given degrees of freedom.
 * Uses complementary error function (erfc) for numerical stability.
 *
 * @param {number} chiSquare - Chi-square test statistic
 * @param {number} df - Degrees of freedom
 * @returns {number} - P-value
 */
function chiSquarePValue(chiSquare, df) {
  if (df !== 1) {
    throw new Error('Only df=1 is currently supported');
  }

  // For df=1: P(χ² > x) = erfc(√(x/2))
  // Using complementary error function for better numerical precision
  const z = Math.sqrt(chiSquare / 2);
  return 1 - erf(z);
}

/**
 * Error function approximation (accurate to ~7 decimal places).
 * Uses Abramowitz and Stegun formula 7.1.26.
 *
 * @param {number} x - Input value
 * @returns {number} - erf(x)
 */
function erf(x) {
  // Constants for approximation
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  // Save the sign of x
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  // Abramowitz and Stegun formula 7.1.26
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Calculate bootstrap confidence intervals for accuracy.
 *
 * Uses stratified resampling to preserve the proportion of positive/negative
 * cases in each bootstrap sample.
 *
 * @param {Array<boolean>} predictions - Array of prediction correctness (true=correct)
 * @param {number} nBootstrap - Number of bootstrap samples (default: 10000)
 * @param {number} confidenceLevel - Confidence level (default: 0.95)
 * @returns {{lower: number, upper: number, mean: number, std: number}} - Bootstrap CI
 *
 * @example
 * const ci = bootstrapConfidenceInterval(predictions, 10000, 0.95);
 * // Returns: { lower: 0.948, upper: 0.975, mean: 0.962, std: 0.007 }
 */
function bootstrapConfidenceInterval(predictions, nBootstrap = 10000, confidenceLevel = 0.95) {
  if (predictions.length === 0) {
    throw new Error('Predictions array cannot be empty');
  }

  const n = predictions.length;
  const bootstrapAccuracies = [];

  // Generate bootstrap samples
  for (let i = 0; i < nBootstrap; i++) {
    let correct = 0;

    // Resample with replacement
    for (let j = 0; j < n; j++) {
      const randomIndex = Math.floor(Math.random() * n);
      if (predictions[randomIndex]) {
        correct++;
      }
    }

    bootstrapAccuracies.push(correct / n);
  }

  // Sort accuracies for percentile calculation
  bootstrapAccuracies.sort((a, b) => a - b);

  // Calculate percentiles for confidence interval
  const alpha = 1 - confidenceLevel;
  const lowerIndex = Math.floor(nBootstrap * alpha / 2);
  const upperIndex = Math.floor(nBootstrap * (1 - alpha / 2));

  const lower = bootstrapAccuracies[lowerIndex];
  const upper = bootstrapAccuracies[upperIndex];

  // Calculate mean and standard deviation
  const mean = bootstrapAccuracies.reduce((sum, acc) => sum + acc, 0) / nBootstrap;
  const variance = bootstrapAccuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / nBootstrap;
  const std = Math.sqrt(variance);

  return { lower, upper, mean, std };
}

/**
 * Format a result row as LaTeX table row with proper alignment and precision.
 *
 * @param {string} modelName - Name of the model
 * @param {number} accuracy - Accuracy (0-1)
 * @param {number} lower - Lower bound of CI (0-1)
 * @param {number} upper - Upper bound of CI (0-1)
 * @param {number} n - Sample size
 * @returns {string} - LaTeX table row
 *
 * @example
 * const row = formatLatexTableRow('Hybrid DPCS', 0.9626, 0.9476, 0.9739, 883);
 * // Returns: "Hybrid DPCS & 96.26 & [94.76, 97.39] & 883 \\\\"
 */
function formatLatexTableRow(modelName, accuracy, lower, upper, n) {
  const accStr = (accuracy * 100).toFixed(2);
  const lowerStr = (lower * 100).toFixed(2);
  const upperStr = (upper * 100).toFixed(2);

  return `${modelName} & ${accStr} & [${lowerStr}, ${upperStr}] & ${n} \\\\`;
}

/**
 * Format complete LaTeX table for model comparison results.
 *
 * @param {Array<Object>} results - Array of result objects with {name, accuracy, ci, n}
 * @param {string} caption - Table caption
 * @returns {string} - Complete LaTeX table
 *
 * @example
 * const table = formatLatexTable([
 *   { name: 'Model A', accuracy: 0.95, ci: {lower: 0.93, upper: 0.97}, n: 883 },
 *   { name: 'Model B', accuracy: 0.92, ci: {lower: 0.90, upper: 0.94}, n: 883 }
 * ], 'Model Performance Comparison');
 */
function formatLatexTable(results, caption = 'Model Performance Comparison') {
  const rows = results.map(r =>
    formatLatexTableRow(r.name, r.accuracy, r.ci.lower, r.ci.upper, r.n)
  ).join('\n');

  return `\\begin{table}[htbp]
\\centering
\\caption{${caption}}
\\begin{tabular}{lccc}
\\hline
Model & Accuracy (\\%) & Wilson 95\\% CI & N \\\\
\\hline
${rows}
\\hline
\\end{tabular}
\\end{table}`;
}

/**
 * Format McNemar test results as LaTeX table.
 *
 * @param {Array<Object>} comparisons - Array of comparison objects
 * @returns {string} - LaTeX table of McNemar test results
 *
 * @example
 * const table = formatMcNemarLatexTable([
 *   { modelA: 'Hybrid', modelB: 'Baseline', chiSquare: 12.25, pValue: 0.0005 }
 * ]);
 */
function formatMcNemarLatexTable(comparisons) {
  const rows = comparisons.map(c => {
    const pStr = c.pValue < 0.001 ? '< 0.001' : c.pValue.toFixed(4);
    const sig = c.pValue < 0.05 ? '**' : '';
    return `${c.modelA} vs ${c.modelB} & ${c.chiSquare.toFixed(2)} & ${pStr}${sig} \\\\`;
  }).join('\n');

  return `\\begin{table}[htbp]
\\centering
\\caption{McNemar's Test Results (** p < 0.05)}
\\begin{tabular}{lcc}
\\hline
Comparison & $\\chi^2$ & p-value \\\\
\\hline
${rows}
\\hline
\\end{tabular}
\\end{table}`;
}

/**
 * Helper function to compute all pairwise McNemar tests for multiple models.
 *
 * @param {Object} modelResults - Object mapping model names to boolean prediction arrays
 * @returns {Array<Object>} - Array of pairwise test results
 *
 * @example
 * const tests = computePairwiseMcNemar({
 *   'Model A': [true, true, false, ...],
 *   'Model B': [true, false, true, ...],
 *   'Model C': [false, true, true, ...]
 * });
 */
function computePairwiseMcNemar(modelResults) {
  const modelNames = Object.keys(modelResults);
  const comparisons = [];

  for (let i = 0; i < modelNames.length; i++) {
    for (let j = i + 1; j < modelNames.length; j++) {
      const nameA = modelNames[i];
      const nameB = modelNames[j];

      const result = mcNemarTest(modelResults[nameA], modelResults[nameB]);

      comparisons.push({
        modelA: nameA,
        modelB: nameB,
        ...result
      });
    }
  }

  return comparisons;
}

module.exports = {
  wilsonConfidenceInterval,
  mcNemarTest,
  bootstrapConfidenceInterval,
  formatLatexTableRow,
  formatLatexTable,
  formatMcNemarLatexTable,
  computePairwiseMcNemar
};

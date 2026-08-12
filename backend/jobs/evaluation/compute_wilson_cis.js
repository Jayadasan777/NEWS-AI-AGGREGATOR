/**
 * Compute Wilson 95% Confidence Intervals for All Metrics
 *
 * This script calculates Wilson CIs for accuracy, precision, recall, and F1-score
 * for all methods in the Phase 3 evaluation results.
 */

const fs = require('fs');
const path = require('path');
const { wilsonConfidenceInterval } = require('./statisticalTests');

/**
 * Calculate Wilson CI for precision.
 * Precision = TP / (TP + FP)
 * This is a proportion where n = TP + FP (total positive predictions)
 */
function wilsonCIForPrecision(tp, fp) {
  const n = tp + fp;
  if (n === 0) {
    return { precision: 0, lower: 0, upper: 0 };
  }
  return wilsonConfidenceInterval(tp, n);
}

/**
 * Calculate Wilson CI for recall.
 * Recall = TP / (TP + FN)
 * This is a proportion where n = TP + FN (total actual positives)
 */
function wilsonCIForRecall(tp, fn) {
  const n = tp + fn;
  if (n === 0) {
    return { recall: 0, lower: 0, upper: 0 };
  }
  return wilsonConfidenceInterval(tp, n);
}

/**
 * Calculate Wilson CI for accuracy.
 * Accuracy = (TP + TN) / (TP + TN + FP + FN)
 * This is a proportion where n = total samples
 */
function wilsonCIForAccuracy(tp, tn, fp, fn) {
  const correct = tp + tn;
  const total = tp + tn + fp + fn;
  return wilsonConfidenceInterval(correct, total);
}

/**
 * Calculate Wilson CI for F1-score using the variance formula for F1.
 *
 * Since F1 is a non-linear combination of precision and recall,
 * we use the delta method to approximate its variance:
 *
 * F1 = 2PR / (P + R)
 * Var(F1) ≈ (∂F1/∂P)² Var(P) + (∂F1/∂R)² Var(R)
 *
 * For Wilson CI, we compute the CI based on the observed F1 and its
 * approximate standard error derived from precision and recall variances.
 */
function wilsonCIForF1(tp, fp, fn) {
  const precision = tp / (tp + fp);
  const recall = tp / (tp + fn);

  if (isNaN(precision) || isNaN(recall) || precision + recall === 0) {
    return { f1: 0, lower: 0, upper: 0 };
  }

  const f1 = 2 * precision * recall / (precision + recall);

  // For F1, we use a bootstrap-like approximation
  // by treating it as a derived metric from precision and recall
  const nPred = tp + fp;  // Total predictions
  const nTrue = tp + fn;  // Total true positives

  if (nPred === 0 || nTrue === 0) {
    return { f1, lower: 0, upper: 0 };
  }

  // Compute variance of precision and recall using Wilson formula components
  const z = 1.96;
  const z2 = z * z;

  // Variance of precision (binomial proportion)
  const varP = precision * (1 - precision) / nPred;

  // Variance of recall (binomial proportion)
  const varR = recall * (1 - recall) / nTrue;

  // F1 partial derivatives
  const dF1_dP = 2 * recall * recall / Math.pow(precision + recall, 2);
  const dF1_dR = 2 * precision * precision / Math.pow(precision + recall, 2);

  // Approximate variance of F1 using delta method
  const varF1 = Math.pow(dF1_dP, 2) * varP + Math.pow(dF1_dR, 2) * varR;

  // Wilson CI construction
  const seF1 = Math.sqrt(varF1);
  const margin = z * seF1;

  return {
    f1,
    lower: Math.max(0, f1 - margin),
    upper: Math.min(1, f1 + margin)
  };
}

/**
 * Process all results and compute Wilson CIs for all metrics.
 */
function computeAllWilsonCIs(resultsFile) {
  console.log('Reading results from:', resultsFile);
  const data = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

  const output = {
    tag: 'wilson-cis-v2',
    timestamp: new Date().toISOString(),
    benchmark_size_N: data.benchmark_size_N,
    full_dataset_size_N: data.full_dataset_size_N,
    confidence_level: 0.95,
    method: 'Wilson Score Interval',
    results: []
  };

  for (const result of data.results) {
    const { tp, fp, tn, fn, configuration } = result;

    // Calculate Wilson CIs for all metrics
    const accuracyCI = wilsonCIForAccuracy(tp, tn, fp, fn);
    const precisionCI = wilsonCIForPrecision(tp, fp);
    const recallCI = wilsonCIForRecall(tp, fn);
    const f1CI = wilsonCIForF1(tp, fp, fn);

    output.results.push({
      configuration,
      tp,
      fp,
      tn,
      fn,
      total_n: tp + fp + tn + fn,

      // Accuracy with Wilson CI
      accuracy: accuracyCI.accuracy,
      accuracy_ci_lower: accuracyCI.lower,
      accuracy_ci_upper: accuracyCI.upper,
      accuracy_formatted: `${(accuracyCI.accuracy * 100).toFixed(2)}% [${(accuracyCI.lower * 100).toFixed(2)}%, ${(accuracyCI.upper * 100).toFixed(2)}%]`,

      // Precision with Wilson CI
      precision: precisionCI.accuracy, // 'accuracy' field is the proportion
      precision_ci_lower: precisionCI.lower,
      precision_ci_upper: precisionCI.upper,
      precision_formatted: `${(precisionCI.accuracy * 100).toFixed(2)}% [${(precisionCI.lower * 100).toFixed(2)}%, ${(precisionCI.upper * 100).toFixed(2)}%]`,

      // Recall with Wilson CI
      recall: recallCI.accuracy, // 'accuracy' field is the proportion
      recall_ci_lower: recallCI.lower,
      recall_ci_upper: recallCI.upper,
      recall_formatted: `${(recallCI.accuracy * 100).toFixed(2)}% [${(recallCI.lower * 100).toFixed(2)}%, ${(recallCI.upper * 100).toFixed(2)}%]`,

      // F1-score with approximate Wilson CI
      f1_score: f1CI.f1,
      f1_ci_lower: f1CI.lower,
      f1_ci_upper: f1CI.upper,
      f1_formatted: `${(f1CI.f1 * 100).toFixed(2)}% [${(f1CI.lower * 100).toFixed(2)}%, ${(f1CI.upper * 100).toFixed(2)}%]`
    });
  }

  return output;
}

/**
 * Main execution
 */
function main() {
  const resultsFile = path.join(__dirname, 'results_v2_final.json');
  const outputFile = path.join(__dirname, 'statistical_significance_results.json');

  console.log('=' .repeat(80));
  console.log('Wilson 95% Confidence Interval Calculator');
  console.log('=' .repeat(80));

  const results = computeAllWilsonCIs(resultsFile);

  // Write results to file
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf8');
  console.log('\nResults written to:', outputFile);

  // Print summary table
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY: Wilson 95% Confidence Intervals for All Methods');
  console.log('='.repeat(80));

  for (const result of results.results) {
    console.log(`\n${result.configuration}`);
    console.log(`  Sample Size: ${result.total_n}`);
    console.log(`  Accuracy:    ${result.accuracy_formatted}`);
    console.log(`  Precision:   ${result.precision_formatted}`);
    console.log(`  Recall:      ${result.recall_formatted}`);
    console.log(`  F1-Score:    ${result.f1_formatted}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('LaTeX Table Format (Accuracy Only)');
  console.log('='.repeat(80));

  console.log('\n\\begin{table}[htbp]');
  console.log('\\centering');
  console.log('\\caption{Accuracy with Wilson 95\\% Confidence Intervals (N=' + results.benchmark_size_N + ')}');
  console.log('\\begin{tabular}{lcccc}');
  console.log('\\hline');
  console.log('Method & Accuracy (\\%) & 95\\% CI Lower & 95\\% CI Upper & Width \\\\');
  console.log('\\hline');

  for (const result of results.results) {
    const acc = (result.accuracy * 100).toFixed(2);
    const lower = (result.accuracy_ci_lower * 100).toFixed(2);
    const upper = (result.accuracy_ci_upper * 100).toFixed(2);
    const width = (result.accuracy_ci_upper - result.accuracy_ci_lower) * 100;
    const widthStr = width.toFixed(2);

    // Shorten configuration names for table
    let shortName = result.configuration
      .replace('Traditional Lexical ', '')
      .replace(' (τ=0.12)', '')
      .replace(' (τ=0.25)', '')
      .replace(' (τ=0.55)', '')
      .replace(' (τ=0.22)', '')
      .replace('Production 2-Stage Baseline (NISE)', 'Production')
      .replace('LLM-Only Ceiling (Exhaustive)', 'LLM-Only');

    console.log(`${shortName} & ${acc} & ${lower} & ${upper} & ${widthStr} \\\\`);
  }

  console.log('\\hline');
  console.log('\\end{tabular}');
  console.log('\\end{table}');

  console.log('\n' + '='.repeat(80));
  console.log('All Metrics LaTeX Table');
  console.log('='.repeat(80));

  console.log('\n\\begin{table*}[htbp]');
  console.log('\\centering');
  console.log('\\caption{Performance Metrics with Wilson 95\\% Confidence Intervals (N=' + results.benchmark_size_N + ')}');
  console.log('\\begin{tabular}{lcccc}');
  console.log('\\hline');
  console.log('Method & Accuracy & Precision & Recall & F1-Score \\\\');
  console.log('\\hline');

  for (const result of results.results) {
    let shortName = result.configuration
      .replace('Traditional Lexical ', '')
      .replace(' (τ=0.12)', '')
      .replace(' (τ=0.25)', '')
      .replace(' (τ=0.55)', '')
      .replace(' (τ=0.22)', '')
      .replace('Production 2-Stage Baseline (NISE)', 'Production')
      .replace('LLM-Only Ceiling (Exhaustive)', 'LLM-Only');

    const acc = `${(result.accuracy * 100).toFixed(2)}\\% [${(result.accuracy_ci_lower * 100).toFixed(2)}, ${(result.accuracy_ci_upper * 100).toFixed(2)}]`;
    const prec = `${(result.precision * 100).toFixed(2)}\\% [${(result.precision_ci_lower * 100).toFixed(2)}, ${(result.precision_ci_upper * 100).toFixed(2)}]`;
    const rec = `${(result.recall * 100).toFixed(2)}\\% [${(result.recall_ci_lower * 100).toFixed(2)}, ${(result.recall_ci_upper * 100).toFixed(2)}]`;
    const f1 = `${(result.f1_score * 100).toFixed(2)}\\% [${(result.f1_ci_lower * 100).toFixed(2)}, ${(result.f1_ci_upper * 100).toFixed(2)}]`;

    console.log(`${shortName} & ${acc} & ${prec} & ${rec} & ${f1} \\\\`);
  }

  console.log('\\hline');
  console.log('\\end{tabular}');
  console.log('\\end{table*}');

  console.log('\n' + '='.repeat(80));
  console.log('COMPLETE');
  console.log('='.repeat(80));
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  wilsonCIForAccuracy,
  wilsonCIForPrecision,
  wilsonCIForRecall,
  wilsonCIForF1,
  computeAllWilsonCIs
};
